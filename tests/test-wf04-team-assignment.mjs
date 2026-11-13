/**
 * Test Suite: WF04 - Team Assignment & Multi-tier Routing
 * Author: Trương Thị Mộng Ngân
 *
 * Verifies intelligent team assignment, VIP fast-tracking,
 * and escalation queues for IT HelpDesk tickets.
 */

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const WEBHOOK_URL = `${N8N_URL}/webhook/team-assignment`;

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

async function runTest(testName, payload, assertions) {
  console.log(`\n▶ [WF04] Running: ${testName}`);
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    assertions(data);
  } catch (err) {
    console.error(`  ❌ Exception during test: ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log('====================================================');
  console.log('🧪 TEST SUITE: WF04 - Team Assignment & VIP Routing');
  console.log('Webhook Endpoint:', WEBHOOK_URL);
  console.log('====================================================');

  // Test 1: VIP Executive Routing
  await runTest(
    'VIP Request: Executive boardroom emergency meeting',
    {
      ticketId: 'TEST-WF04-VIP',
      title: 'Phòng họp Tổng Giám Đốc bị mất kết nối màn hình trình chiếu VIP',
      description: 'Hội đồng quản trị chuẩn bị họp cổ đông khẩn',
      category: 'Network',
      priority: 'Critical'
    },
    (data) => {
      assert(data.assignedTeam === 'Executive VIP Support Taskforce', `Assigned team is "${data.assignedTeam}" (expected "Executive VIP Support Taskforce")`);
      assert(data.assignmentQueue === 'queue-executive-fasttrack', `Assignment queue is "${data.assignmentQueue}" (expected "queue-executive-fasttrack")`);
      assert(data.assignmentReason?.includes('Executive/VIP'), `Assignment reason contains VIP note: "${data.assignmentReason}"`);
      assert(Array.isArray(data.workflowTrace) && data.workflowTrace.includes('WF04'), 'Workflow trace contains WF04');
    }
  );

  // Test 2: Tier 2 Escalation for Critical Infrastructure
  await runTest(
    'Critical Network Incident: Multi-tier escalation',
    {
      ticketId: 'TEST-WF04-ESCALATED',
      title: 'Core Switch tầng 3 bị sập toàn bộ cổng mạng LAN',
      description: 'Cả tầng không thể làm việc',
      category: 'Network',
      priority: 'Critical'
    },
    (data) => {
      assert(data.assignedTeam === 'Infrastructure Operations (Tier 2)', `Assigned team is Tier 2: "${data.assignedTeam}"`);
      assert(data.assignmentQueue === 'queue-network-escalated', `Escalated queue is "${data.assignmentQueue}"`);
      assert(data.assignmentReason?.includes('Escalated tier'), `Assignment reason specifies Escalated tier: "${data.assignmentReason}"`);
    }
  );

  // Test 3: Standard L1 Hardware Routing
  await runTest(
    'Standard L1 Hardware Support: Mouse & keyboard failure',
    {
      ticketId: 'TEST-WF04-L1-HW',
      title: 'Chuột quang và bàn phím không nhận cổng USB',
      description: 'Cần mượn bộ chuột bàn phím thay thế',
      category: 'Hardware',
      priority: 'Low'
    },
    (data) => {
      assert(data.assignedTeam === 'Hardware Support', `Assigned team is Standard L1: "${data.assignedTeam}"`);
      assert(data.assignmentQueue === 'queue-hardware', `Standard queue is "${data.assignmentQueue}"`);
      assert(data.assignmentReason?.includes('Standard L1 queue'), `Assignment reason specifies Standard L1: "${data.assignmentReason}"`);
    }
  );

  // Test 4: Identity & Access Support
  await runTest(
    'Account & Access Support: Folder permission grant',
    {
      ticketId: 'TEST-WF04-ACCESS',
      title: 'Xin cấp quyền truy cập thư mục kế toán trên NAS',
      description: 'Nhân viên mới cần xem chứng từ',
      category: 'Account & Access',
      priority: 'Medium'
    },
    (data) => {
      assert(data.assignedTeam === 'Identity and Access Support', `Assigned team is "${data.assignedTeam}"`);
      assert(data.assignmentQueue === 'queue-access', `Queue is "${data.assignmentQueue}"`);
    }
  );

  // Test 5: Security Operations Incident Response
  await runTest(
    'Security Incident: Ransomware suspicion',
    {
      ticketId: 'TEST-WF04-SEC',
      title: 'Phát hiện file đuôi lạ bị khóa mã hóa trên máy cá nhân',
      description: 'Nghi ngờ dính mã độc ransomware',
      category: 'Security',
      priority: 'High'
    },
    (data) => {
      assert(data.assignedTeam === 'Security Operations (Tier 2 Incident Response)', `Assigned team is Security Tier 2: "${data.assignedTeam}"`);
      assert(data.assignmentQueue === 'queue-security-escalated', `Security queue is "${data.assignmentQueue}"`);
    }
  );

  console.log('\n----------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------------------');
  if (failed > 0) {
    process.exit(1);
  }
}

main();
