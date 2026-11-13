/**
 * Test Suite: WF06 - Automated Support Response & Expert Triage
 * Author: Trương Thị Mộng Ngân
 *
 * Verifies category-specific triage rules (Video conferencing, ERP/MISA,
 * Wi-Fi, Security), SLA estimation, credential safety checks,
 * and suggested customer response generation.
 */

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const WEBHOOK_URL = `${N8N_URL}/webhook/support-response`;

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
  console.log(`\n▶ [WF06] Running: ${testName}`);
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
  console.log('🧪 TEST SUITE: WF06 - Support Response & Expert Triage');
  console.log('Webhook Endpoint:', WEBHOOK_URL);
  console.log('====================================================');

  // Test 1: Video Conferencing (Zoom / Teams / Meet)
  await runTest(
    'Video Conferencing Triage: Microphone and camera permissions',
    {
      ticketId: 'TEST-WF06-ZOOM',
      title: 'Họp Zoom khách hàng không nghe thấy tiếng micro',
      description: 'Đã cắm tai nghe qua USB nhưng đối tác không nghe được âm thanh',
      category: 'Software',
      priority: 'High'
    },
    (data) => {
      assert(Boolean(data.suggestedResponse), 'Suggested response generated');
      assert(data.suggestedResponse.includes('Microphone và Camera'), 'Action steps include Microphone/Camera checks');
      assert(data.suggestedResponse.includes('1 - 2 giờ làm việc'), 'High priority SLA set to 1-2 hours');
      assert(data.suggestedResponse.includes('mật khẩu hoặc mã OTP'), 'Security credential warning included');
    }
  );

  // Test 2: ERP & Accounting Software (MISA / SAP)
  await runTest(
    'Accounting ERP Triage: MISA freeze during report export',
    {
      ticketId: 'TEST-WF06-ERP',
      title: 'Phần mềm kế toán MISA bị treo khi xuất hóa đơn điện tử',
      description: 'Nhấn xuất hóa đơn thì màn hình đơ không bấm được gì',
      category: 'Software',
      priority: 'Critical'
    },
    (data) => {
      assert(data.suggestedResponse.includes('SQL Server') || data.suggestedResponse.includes('Task Manager'), 'Action steps contain ERP / Task Manager guidance');
      assert(data.suggestedResponse.includes('15 - 30 phút'), 'Critical priority SLA set to 15-30 minutes');
    }
  );

  // Test 3: Wi-Fi & Office Network Troubleshooting
  await runTest(
    'Network Triage: Wi-Fi reconnect and Forget Network guidance',
    {
      ticketId: 'TEST-WF06-WIFI',
      title: 'Laptop bị mất kết nối Wi-Fi văn phòng',
      description: 'Báo lỗi No Internet Access',
      category: 'Network',
      priority: 'Medium'
    },
    (data) => {
      assert(data.suggestedResponse.includes('Quên mạng') || data.suggestedResponse.includes('Forget Network'), 'Action steps include Forget Network');
      assert(data.suggestedResponse.includes('4 - 8 giờ làm việc'), 'Medium priority SLA set to 4-8 hours');
    }
  );

  // Test 4: Security Incident Protocol
  await runTest(
    'Security Triage: Cable disconnection and isolation warning',
    {
      ticketId: 'TEST-WF06-SEC',
      title: 'Phát hiện email giả mạo lừa đảo yêu cầu nhập mật khẩu O365',
      description: 'Đồng nghiệp vừa click vào link trong email khả nghi',
      category: 'Security',
      priority: 'High'
    },
    (data) => {
      assert(data.suggestedResponse.includes('rút dây LAN') || data.suggestedResponse.includes('tắt Wi-Fi'), 'Immediate network isolation steps present');
      assert(data.suggestedResponse.includes('link lạ'), 'Warning against malicious links present');
      assert(data.alert?.severity === 'critical', 'Critical security alert triggered');
    }
  );

  // Test 5: Low Priority Hardware Printer
  await runTest(
    'Printer Triage: Paper jam and test page',
    {
      ticketId: 'TEST-WF06-PRINT',
      title: 'Máy in HP phòng nhân sự in bị sọc mờ',
      description: 'Bản in hợp đồng có vệt sọc đen dọc trang giấy',
      category: 'Hardware',
      priority: 'Low'
    },
    (data) => {
      assert(data.suggestedResponse.includes('máy in') || data.suggestedResponse.includes('giấy'), 'Printer guidance included');
      assert(data.suggestedResponse.includes('24 giờ'), 'Low priority SLA set to 24 hours');
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
