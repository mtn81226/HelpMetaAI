/**
 * Test Suite: End-to-End IT HelpDesk AI Pipeline (WF01 -> WF09)
 * Author: Trương Thị Mộng Ngân
 *
 * Verifies full automated ticket processing:
 * WF01 (Intake) -> WF02 (AI Classification) -> WF03 (Priority Assessment) ->
 * WF04 (Team Assignment & VIP Routing) -> WF05 (Duplicate Detection) ->
 * WF06 (Support Response Guidance) -> WF07 (Alert Dispatch) ->
 * WF08 (SLA Monitoring) -> WF09 (MongoDB Atlas Audit Logging).
 */

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const INTAKE_URL = `${N8N_URL}/webhook/ticket-intake`;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runE2ETest(testName, payload, assertions) {
  console.log(`\n▶ [E2E Pipeline] Running: ${testName}`);
  const startTime = Date.now();
  try {
    const res = await fetch(INTAKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`  ⏱ Pipeline execution finished in ${duration}s`);
    assertions(data);
  } catch (err) {
    console.error(`  ❌ Pipeline execution failed: ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log('======================================================================');
  console.log('🚀 TEST SUITE: End-to-End IT HelpDesk Multi-Workflow AI Pipeline');
  console.log('Intake Webhook Endpoint:', INTAKE_URL);
  console.log('======================================================================');

  // Scenario 1: VIP Boardroom Emergency Network Incident
  await runE2ETest(
    'Scenario 1: Executive Boardroom VIP Emergency Network Incident',
    {
      title: 'Tổng giám đốc không truy cập được mạng nội bộ VPN tại phòng VIP',
      description: 'Cần tham gia cuộc họp HĐQT trực tuyến khẩn cấp lúc 10h sáng nay',
      requesterEmail: 'ceo@company.com',
      source: 'vip-portal'
    },
    (data) => {
      // 1. Ticket metadata & status
      assert(Boolean(data.ticketId) && data.ticketId.startsWith('TCK-'), `Valid ticketId generated: ${data.ticketId}`);
      assert(data.status === 'Open', `Ticket status is "Open" (got "${data.status}")`);

      // 2. WF02 AI Classification
      assert(['Network', 'Security', 'Account & Access'].includes(data.category), `Classified into valid category: "${data.category}"`);
      assert(Boolean(data.categoryRationale || data.aiClassification), 'AI classification rationale provided');

      // 3. WF03 Priority Assessment
      assert(['Critical', 'High'].includes(data.priority), `Emergency ticket assessed as high/critical: "${data.priority}"`);

      // 4. WF04 Team Assignment (VIP Fast-track)
      assert(data.assignedTeam === 'Executive VIP Support Taskforce', `VIP assigned to Executive Taskforce: "${data.assignedTeam}"`);
      assert(data.assignmentQueue === 'queue-executive-fasttrack', `VIP queue is fast-track: "${data.assignmentQueue}"`);

      // 5. WF05 Duplicate Fingerprint & Signature
      assert(Boolean(data.duplicateFingerprint), `Deduplication fingerprint generated: "${data.duplicateFingerprint}"`);
      assert(data.deduplication?.checked === true, 'Deduplication check completed');
      assert(Boolean(data.deduplication?.signature), `Duplicate signature extracted: "${data.deduplication?.signature}"`);

      // 6. WF06 Support Guidance & SLA
      assert(Boolean(data.suggestedResponse), 'Automated customer suggested response generated');
      assert(data.suggestedResponse.includes('mật khẩu hoặc mã OTP'), 'Security warning preserved in response');
      assert(Boolean(data.sla?.dueAt), `SLA due date calculated: ${data.sla?.dueAt}`);

      // 7. Full Workflow Chain Integrity
      const expectedTrace = ['WF01', 'WF02', 'WF03', 'WF04', 'WF05', 'WF06', 'WF07', 'WF08', 'WF09'];
      const hasAllWorkflows = expectedTrace.every(wf => data.workflowTrace?.includes(wf));
      assert(hasAllWorkflows, `Workflow trace contains all 9 workflows: [${data.workflowTrace?.join(' -> ')}]`);

      // 8. WF09 MongoDB Atlas Audit Record
      assert(Boolean(data._id || data.id), `MongoDB Atlas persisted document ID: ${data._id || data.id}`);
      assert(data.workflowResult?.success === true, 'Workflow pipeline final success confirmed');
    }
  );

  // Scenario 2: Standard Software Bug Report (MISA Accounting)
  await runE2ETest(
    'Scenario 2: Software Support Ticket (MISA Export Error)',
    {
      title: 'Phần mềm MISA báo lỗi không kết nối được máy chủ kế toán',
      description: 'Nhân viên kế toán xuất báo cáo tài chính tháng thì bị mất kết nối',
      requesterEmail: 'ketoan@company.com',
      source: 'web-form'
    },
    (data) => {
      assert(Boolean(data.ticketId), `Ticket ID created: ${data.ticketId}`);
      assert(data.category === 'Software' || data.category === 'Network', `Category classified: "${data.category}"`);
      assert(Boolean(data.assignedTeam), `Support team assigned: "${data.assignedTeam}"`);
      assert(data.workflowTrace?.includes('WF04'), 'Trace passed through WF04');
      assert(data.workflowTrace?.includes('WF05'), 'Trace passed through WF05');
      assert(data.workflowTrace?.includes('WF06'), 'Trace passed through WF06');
      assert(data.workflowResult?.success === true, 'Pipeline completed successfully');
    }
  );

  console.log('\n======================================================================');
  console.log(`Pipeline Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================================');
  if (failed > 0) {
    process.exit(1);
  }
}

main();
