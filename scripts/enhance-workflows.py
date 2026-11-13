import json

# ==================== ENHANCE WF04 ====================
with open('n8n-workflows/WF04_team-assignment.json', 'r', encoding='utf-8') as f:
    wf4 = json.load(f)

n6_4 = next(n for n in wf4['nodes'] if n['name'] == 'Select Support Team')
n6_4['parameters']['jsCode'] = """const text = (($json.title || '') + ' ' + ($json.description || '')).toLowerCase();
const category = $json.category || 'Other';
const priority = $json.priority || 'Medium';
const isVip = /vip|ban giám đốc|hội đồng quản trị|phòng họp tổng giám đốc|boardroom|ceo|director/i.test(text);

const baseTeams = {
  Network: 'Network Support',
  Hardware: 'Hardware Support',
  Software: 'Software Support',
  'Account & Access': 'Identity and Access Support',
  Security: 'Security Operations',
  Other: 'IT General'
};

let team = $json.assignedTeam || baseTeams[category] || baseTeams.Other;
let queue = '';

if (isVip) {
  team = 'Executive VIP Support Taskforce';
  queue = 'queue-executive-fasttrack';
} else if (priority === 'Critical' || priority === 'High') {
  if (category === 'Security') team = 'Security Operations (Tier 2 Incident Response)';
  else if (category === 'Network' || category === 'Hardware') team = 'Infrastructure Operations (Tier 2)';
  else team = 'Senior IT Support Team';
  const slug = category === 'Account & Access' ? 'access' : category.toLowerCase().replace(/[^a-z]/g, '');
  queue = 'queue-' + slug + '-escalated';
} else {
  const slug = category === 'Account & Access' ? 'access' : category.toLowerCase().replace(/[^a-z]/g, '');
  queue = 'queue-' + slug;
}

return [{ json: { ...$json, assignedTeam: team, assignmentQueue: queue, isVipRequest: isVip } }];"""

n8_4 = next(n for n in wf4['nodes'] if n['name'] == 'Set Assignment Reason')
n8_4['parameters']['jsCode'] = """const priority = $json.priority || 'Medium';
let reason = '';
if ($json.isVipRequest) {
  reason = 'Fast-tracked for Executive/VIP stakeholder priority';
} else if (priority === 'Critical' || priority === 'High') {
  reason = 'Routed by category: ' + ($json.category || 'Other') + ' (Escalated tier for ' + priority + ' priority)';
} else {
  reason = 'Routed by category: ' + ($json.category || 'Other') + ' (Standard L1 queue)';
}
return [{ json: { ...$json, assignmentReason: reason } }];"""

with open('n8n-workflows/WF04_team-assignment.json', 'w', encoding='utf-8') as f:
    json.dump(wf4, f, indent=2, ensure_ascii=False)
print('WF04 enhanced cleanly!')


# ==================== ENHANCE WF05 ====================
with open('n8n-workflows/WF05_duplicate-detection.json', 'r', encoding='utf-8') as f:
    wf5 = json.load(f)

# Expand Vietnamese IT stopword dictionary in Create Duplicate Fingerprint
n6_5 = next(n for n in wf5['nodes'] if n['name'] == 'Create Duplicate Fingerprint')
n6_5['parameters']['jsCode'] = """const rawText = $json.duplicateSearchText || '';
const stopwords = new Set([
  'toi', 'la', 'bi', 'khong', 'duoc', 'cho', 'va', 'tai', 'tren', 'trong',
  'nhung', 'cac', 'cua', 'nay', 'voi', 'lam', 'sao', 'gi', 'the', 'nao',
  'biet', 'xin', 'giup', 'can', 'alo', 'em', 'anh', 'chi', 'ticket', 'gap',
  'the', 'is', 'at', 'which', 'on', 'in', 'and', 'for', 'to', 'with',
  'it', 'oi', 'ad', 'admin', 'help', 'ho', 'minh', 'nho', 'nhanh', 'lien',
  'he', 'gap', 'luon', 'a', 'da', 'dang', 'bi', 'loi', 'bi', 'hong',
  'khong', 'vao', 'duoc', 'xin', 'cam', 'on', 'please', 'thanks'
]);

const words = rawText.split(' ').filter(w => w.length >= 3 && !stopwords.has(w));
const uniqueSorted = [...new Set(words)].sort();
const fingerprint = ($json.category || 'Other') + '|' + uniqueSorted.slice(0, 15).join('|');
const keywords = uniqueSorted.slice(0, 12);
const signature = ($json.category || 'Other') + '#' + ($json.priority || 'Medium') + '#' + keywords.slice(0, 4).sort().join('-');

return [{ json: { ...$json, duplicateFingerprint: fingerprint, duplicateKeywords: keywords, duplicateSignature: signature } }];"""

with open('n8n-workflows/WF05_duplicate-detection.json', 'w', encoding='utf-8') as f:
    json.dump(wf5, f, indent=2, ensure_ascii=False)
print('WF05 enhanced cleanly!')


# ==================== ENHANCE WF06 ====================
with open('n8n-workflows/WF06_support-response.json', 'r', encoding='utf-8') as f:
    wf6 = json.load(f)

n5_6 = next(n for n in wf6['nodes'] if n['name'] == 'Choose Category Guidance')
n5_6['parameters']['jsCode'] = """const text = (($json.title || '') + ' ' + ($json.description || '')).toLowerCase();
const category = $json.category || 'Other';
let actionSteps = [];

if (/wifi|wi-fi|mạng|network|internet|mất mạng/i.test(text)) {
  actionSteps = [
    '1. Tắt Wi-Fi trên thiết bị, chờ 10 giây và bật lại.',
    '2. Chọn "Quên mạng" (Forget Network) và kết nối lại đúng mạng công ty.',
    '3. Thử mở trình duyệt ở chế độ ẩn danh để kiểm tra cổng đăng nhập.'
  ];
} else if (/vpn|kết nối từ xa/i.test(text)) {
  actionSteps = [
    '1. Ngắt kết nối VPN hiện tại và đóng hoàn toàn ứng dụng VPN.',
    '2. Kiểm tra mạng Internet thông thường trước khi kết nối lại VPN.',
    '3. Xác nhận tài khoản xác thực 2 bước (2FA) vẫn đang hoạt động.'
  ];
} else if (/máy in|in|printer/i.test(text)) {
  actionSteps = [
    '1. Kiểm tra nguồn máy in, khay giấy và thông báo kẹt giấy.',
    '2. Khởi động lại dịch vụ Print Spooler hoặc khởi động lại máy in.',
    '3. Thử in một trang thử nghiệm (Test Page).'
  ];
} else if (/zoom|teams|meet|hội nghị|micro|camera|không nghe|mất tiếng/i.test(text)) {
  actionSteps = [
    '1. Kiểm tra quyền truy cập Microphone và Camera trong cài đặt hệ điều hành và trình duyệt.',
    '2. Rút jack cắm tai nghe / webcam và cắm lại vào cổng USB khác.',
    '3. Khởi động lại ứng dụng họp trực tuyến và thử kiểm tra thiết bị trong phần Settings audio/video.'
  ];
} else if (/misa|sap|fast|kế toán|erp|hóa đơn|xuất báo cáo|treo khi xuất/i.test(text)) {
  actionSteps = [
    '1. Nhấn Ctrl + Shift + Esc mở Task Manager và đóng tiến trình ứng dụng đang bị treo.',
    '2. Kiểm tra kết nối mạng nội bộ tới máy chủ lưu trữ dữ liệu kế toán / SQL Server.',
    '3. Thử thu hẹp khoảng thời gian lọc dữ liệu khi xuất báo cáo để tránh tràn bộ nhớ tạm.'
  ];
} else if (/treo|đơ|crash|freeze|không phản hồi|lỗi phần mềm/i.test(text)) {
  actionSteps = [
    '1. Nhấn Ctrl + Shift + Esc mở Task Manager và buộc dừng ứng dụng bị đơ.',
    '2. Kiểm tra cập nhật phần mềm hoặc khởi động lại máy tính.',
    '3. Chụp lại ảnh màn hình thông báo lỗi (nếu có) gửi kèm ticket.'
  ];
} else if (category === 'Security') {
  actionSteps = [
    '1. Ngắt ngay kết nối mạng (rút dây LAN hoặc tắt Wi-Fi).',
    '2. Tuyệt đối không nhấp vào đường link lạ hoặc mở file đính kèm.',
    '3. Giữ nguyên hiện trạng máy và chờ chuyên viên bảo mật tiếp cận khẩn cấp.'
  ];
} else {
  actionSteps = [
    '1. Lưu toàn bộ tài liệu đang mở và khởi động lại máy tính.',
    '2. Ghi lại thời điểm bắt đầu xảy ra sự cố và các thao tác trước đó.',
    '3. Chờ kỹ thuật viên liên hệ hỗ trợ trong thời gian cam kết.'
  ];
}

const responseGuidance = actionSteps.join(' ');
return [{ json: { ...$json, responseGuidance, responseActionSteps: actionSteps, firstTroubleshootingStep: actionSteps[0] } }];"""

with open('n8n-workflows/WF06_support-response.json', 'w', encoding='utf-8') as f:
    json.dump(wf6, f, indent=2, ensure_ascii=False)
print('WF06 enhanced cleanly!')
