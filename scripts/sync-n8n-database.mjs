import fs from 'node:fs';
import { execSync } from 'node:child_process';

const activeMap = {
  'VTKCji6GFxx2GSdN': 'n8n-workflows/WF01_ticket-intake.json',
  'VbrYyvnerkxWvkoK': 'n8n-workflows/WF02_ticket-classification.json',
  'PRb2mptLVuq5L1KX': 'n8n-workflows/WF03_priority-assessment.json',
  'ZzYd6QOzfiNy8sp6': 'n8n-workflows/WF04_team-assignment.json',
  'w6vtLgd4HrDwtT32': 'n8n-workflows/WF05_duplicate-detection.json',
  'cllgZGYCeRYBF0mZ': 'n8n-workflows/WF06_support-response.json',
  'DsiXT5rQE7W9fviQ': 'n8n-workflows/WF07_high-priority-alert.json',
  'G85O6AEUfbzsBepV': 'n8n-workflows/WF08_sla-monitoring.json',
  '5q7hWGXtVeCeaAcv': 'n8n-workflows/WF09_audit-log.json',
};

const updates = [];

for (const [id, filePath] of Object.entries(activeMap)) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  updates.push({
    id,
    nodes: JSON.stringify(content.nodes),
    connections: JSON.stringify(content.connections)
  });
}

// Chạy cập nhật trực tiếp vào database sqlite trong container n8n
const script = `
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const updates = ${JSON.stringify(updates)};

db.serialize(() => {
  // Xóa các workflow trùng lặp bị import thừa
  db.run("DELETE FROM workflow_entity WHERE active = 0", (err) => {
    if (err) console.error("Error deleting inactive:", err);
    else console.log("Cleaned up inactive duplicate workflows.");
  });

  const stmt = db.prepare("UPDATE workflow_entity SET nodes = ?, connections = ? WHERE id = ?");
  const stmtHistory = db.prepare("UPDATE workflow_history SET nodes = ?, connections = ? WHERE versionId = (SELECT activeVersionId FROM workflow_entity WHERE id = ?)");

  for (const item of updates) {
    stmt.run(item.nodes, item.connections, item.id, (err) => {
      if (err) console.error("Update failed for " + item.id, err);
      else console.log("Updated workflow_entity " + item.id);
    });
    stmtHistory.run(item.nodes, item.connections, item.id, (err) => {
      if (err) console.error("History update failed for " + item.id, err);
      else console.log("Updated workflow_history for " + item.id);
    });
  }
  stmt.finalize(() => {
    stmtHistory.finalize(() => {
      db.close();
      console.log("All 9 workflows successfully synced in both workflow_entity and workflow_history!");
    });
  });
});
`;

fs.writeFileSync('/tmp/sync-n8n.js', script);
execSync('docker cp /tmp/sync-n8n.js 4269f2b2e62c:/tmp/sync-n8n.js');
const output = execSync('docker exec 4269f2b2e62c node /tmp/sync-n8n.js').toString();
console.log(output);
