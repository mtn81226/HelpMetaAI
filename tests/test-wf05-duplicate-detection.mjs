/**
 * Test Suite: WF05 - Duplicate Detection & Vietnamese NFD Text Normalization
 * Author: Trương Thị Mộng Ngân
 *
 * Verifies Vietnamese text normalization, IT stopword filtering,
 * deterministic fingerprint generation, and signature extraction.
 */

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const WEBHOOK_URL = `${N8N_URL}/webhook/duplicate-detection`;

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
  console.log(`\n▶ [WF05] Running: ${testName}`);
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
  console.log('🧪 TEST SUITE: WF05 - Duplicate Detection & Text Fingerprinting');
  console.log('Webhook Endpoint:', WEBHOOK_URL);
  console.log('====================================================');

  // Test 1: Vietnamese NFD Normalization & IT Stopwords Removal
  await runTest(
    'Vietnamese Stopwords Filtering & Tone Normalization',
    {
      ticketId: 'TEST-WF05-TONE',
      title: 'IT ơi cứu em với, em không thể nào vào được mạng wifi phòng họp',
      description: 'Nhờ anh admin hỗ trợ gấp giúp em với ạ, em cảm ơn',
      category: 'Network',
      priority: 'High'
    },
    (data) => {
      assert(Boolean(data.duplicateFingerprint), `Fingerprint generated: "${data.duplicateFingerprint}"`);
      assert(data.duplicateFingerprint.startsWith('Network|'), 'Fingerprint starts with category "Network|"');
      assert(!data.duplicateFingerprint.includes('|khong|'), 'Stopword "khong" correctly removed');
      assert(!data.duplicateFingerprint.includes('|duoc|'), 'Stopword "duoc" correctly removed');
      assert(!data.duplicateFingerprint.includes('|admin|'), 'Stopword "admin" correctly removed');
      assert(data.duplicateFingerprint.includes('wifi') || data.duplicateFingerprint.includes('mang'), 'Contains core keyword "wifi" or "mang"');
      assert(Boolean(data.deduplication), 'Deduplication metadata object present');
      assert(data.deduplication.checked === true, 'Deduplication checked flag is true');
      assert(typeof data.deduplication.signature === 'string', `Signature generated: "${data.deduplication.signature}"`);
    }
  );

  // Test 2: Software Crash Fingerprint
  await runTest(
    'Software Bug Report Fingerprinting',
    {
      ticketId: 'TEST-WF05-CRASH',
      title: 'Phần mềm MISA kế toán bị đơ khi xuất báo cáo thuế',
      description: 'Báo cáo doanh thu quý 3 xuất file Excel thì ứng dụng tự đóng',
      category: 'Software',
      priority: 'Medium'
    },
    (data) => {
      assert(data.duplicateFingerprint.startsWith('Software|'), 'Fingerprint starts with "Software|"');
      assert(data.duplicateFingerprint.includes('misa') || data.duplicateFingerprint.includes('toan'), 'Contains "misa" or "toan"');
      assert(data.deduplication.signature.startsWith('Software#Medium#'), 'Signature matches Software#Medium# pattern');
    }
  );

  // Test 3: Fingerprint Uniqueness Between Different Issues
  let fp1 = '';
  let fp2 = '';

  await runTest(
    'Distinct Issue 1: Printer Paper Jam',
    {
      ticketId: 'TEST-WF05-PRINTER',
      title: 'Máy in Canon LBP 2900 kẹt giấy khay số 2',
      description: 'Đèn báo đỏ liên tục',
      category: 'Hardware',
      priority: 'Low'
    },
    (data) => {
      fp1 = data.duplicateFingerprint;
      assert(fp1.startsWith('Hardware|'), 'Printer ticket category is Hardware');
    }
  );

  await runTest(
    'Distinct Issue 2: VPN Auth Failure',
    {
      ticketId: 'TEST-WF05-VPN',
      title: 'Không thể kết nối FortiClient VPN từ nhà',
      description: 'Lỗi xác thực chứng chỉ OTP 2FA',
      category: 'Network',
      priority: 'High'
    },
    (data) => {
      fp2 = data.duplicateFingerprint;
      assert(fp2.startsWith('Network|'), 'VPN ticket category is Network');
      assert(fp1 !== fp2, `Fingerprints are distinct (FP1: "${fp1}" vs FP2: "${fp2}")`);
    }
  );

  // Test 4: Downstream Pipeline Continuity to WF06-WF09
  await runTest(
    'Pipeline Continuity: WF05 through WF09 handoff',
    {
      ticketId: 'TEST-WF05-CHAIN',
      title: 'Kiểm tra đường truyền Internet cáp quang Viettel',
      description: 'Ping ra 8.8.8.8 bị rớt gói 40%',
      category: 'Network',
      priority: 'Critical'
    },
    (data) => {
      assert(Array.isArray(data.workflowTrace), 'Workflow trace is an array');
      assert(data.workflowTrace.includes('WF05'), 'Trace includes WF05');
      assert(data.workflowTrace.includes('WF06'), 'Trace handoff reached WF06');
      assert(data.workflowTrace.includes('WF09'), 'Trace finished at WF09');
      assert(Boolean(data.suggestedResponse), 'Suggested response created by downstream WF06');
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
