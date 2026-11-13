import json

with open('n8n-workflows/WF06_support-response.json', 'r', encoding='utf-8') as f:
    wf = json.load(f)

node = next(n for n in wf['nodes'] if n['name'] == 'Choose Category Guidance')
node['parameters']['jsCode'] = """const text = (($json.title || '') + ' ' + ($json.description || '')).toLowerCase();
const category = $json.category || 'Other';
let actionSteps = [];

if (category === 'Security' || /mã độc|ransomware|lừa đảo|phishing|bị hack|tài khoản bị lộ/i.test(text)) {
  actionSteps = [
    '1. Ngắt ngay kết nối mạng (rút dây LAN hoặc tắt Wi-Fi).',
    '2. Tuyệt đối không nhấp vào đường link lạ hoặc mở file đính kèm.',
    '3. Giữ nguyên hiện trạng máy và chờ chuyên viên bảo mật tiếp cận khẩn cấp.'
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
} else if (/wifi|wi-fi|mạng|network|internet|mất mạng/i.test(text)) {
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
} else if (/máy in|in ấn|printer|in kẹt|hết mực/i.test(text)) {
  actionSteps = [
    '1. Kiểm tra nguồn máy in, khay giấy và thông báo kẹt giấy.',
    '2. Khởi động lại dịch vụ Print Spooler hoặc khởi động lại máy in.',
    '3. Thử in một trang thử nghiệm (Test Page).'
  ];
} else if (/treo|đơ|crash|freeze|không phản hồi|lỗi phần mềm/i.test(text)) {
  actionSteps = [
    '1. Nhấn Ctrl + Shift + Esc mở Task Manager và buộc dừng ứng dụng bị đơ.',
    '2. Kiểm tra cập nhật phần mềm hoặc khởi động lại máy tính.',
    '3. Chụp lại ảnh màn hình thông báo lỗi (nếu có) gửi kèm ticket.'
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
    json.dump(wf, f, indent=2, ensure_ascii=False)
print('WF06 JSON updated with full $json expressions.')
