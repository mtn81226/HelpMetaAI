import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Load .env.local
const envPath = fileURLToPath(new URL('../.env.local', import.meta.url));
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const separator = trimmed.indexOf('=');
  if (separator < 1) continue;
  const key = trimmed.slice(0, separator).trim();
  const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
  if (!process.env[key]) process.env[key] = value;
}

const sampleTickets = [
  {
    ticketId: 'TCK-202611-001',
    title: 'Mất kết nối mạng Wi-Fi khu vực phòng họp tầng 3',
    description: 'Toàn bộ laptop trong phòng họp 301 không thể bắt được sóng Wi-Fi văn phòng hoặc báo "No Internet Access". Đang có cuộc họp trực tuyến quan trọng với đối tác.',
    category: 'Network',
    priority: 'High',
    assignedTeam: 'Infrastructure Operations (Tier 2)',
    aiReason: 'Sự cố ảnh hưởng nhiều người và gián đoạn cuộc họp kinh doanh quan trọng, thuộc danh mục Mạng nội bộ.',
    aiSuggestion: '1. Khởi động lại bộ phát Access Point (AP) tại tầng 3 qua trang quản trị mạng.\n2. Kiểm tra dây mạng uplink kết nối từ switch tầng 3 đến router chính.\n3. Hướng dẫn người dùng tạm thời kết nối qua sóng 5GHz hoặc cổng mạng LAN dự phòng.',
    status: 'Open',
    createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 phút trước
    updatedAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    ticketId: 'TCK-202611-002',
    title: 'Máy in Canon tầng 2 bị kẹt giấy và mất kết nối',
    description: 'Máy in mã PRN-02 ở phòng Kế toán báo đèn đỏ kẹt giấy liên tục dù đã rút giấy kẹt ra. Đồng thời trên máy tính báo trạng thái Printer Offline.',
    category: 'Hardware',
    priority: 'Medium',
    assignedTeam: 'Hardware Support',
    aiReason: 'Sự cố phần cứng thiết bị ngoại vi văn phòng, ảnh hưởng cục bộ bộ phận Kế toán nhưng vẫn có thể in nhờ máy tầng khác.',
    aiSuggestion: '1. Mở nắp máy in, kiểm tra kỹ cảm biến nhả giấy xem có vụn giấy sót lại.\n2. Khởi động lại dịch vụ Print Spooler trên máy tính điều khiển qua services.msc.\n3. Kiểm tra cáp USB/LAN nối từ máy in vào hub mạng nội bộ.',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000), // 2 giờ trước
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    ticketId: 'TCK-202611-003',
    title: 'Phát hiện email đáng ngờ mạo danh thông báo bảo hiểm',
    description: 'Nhiều nhân viên phòng Nhân sự nhận được email từ hr-support@baohiem-online-xyz.com yêu cầu bấm vào đường link lạ để xác thực thông tin số thẻ bảo hiểm y tế.',
    category: 'Security',
    priority: 'Critical',
    assignedTeam: 'Security Operations (Tier 2 Incident Response)',
    aiReason: 'Có dấu hiệu tấn công lừa đảo (Phishing) diện rộng nhắm vào thông tin cá nhân của nhân sự, nguy cơ lộ lọt dữ liệu doanh nghiệp.',
    aiSuggestion: '1. Cô lập và chặn tên miền độc hại trên hệ thống Firewall và Mail Gateway toàn công ty.\n2. Thu hồi toàn bộ email lừa đảo đã gửi tới hòm thư người dùng.\n3. Phát thông báo nội bộ cảnh báo nhân viên tuyệt đối không nhấp link và không nhập mật khẩu/OTP.',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    ticketId: 'TCK-202611-004',
    title: 'Phần mềm kế toán MISA bị đơ và tự thoát khi xuất báo cáo thuế',
    description: 'Khi bấm xuất dữ liệu file Excel quý 3, ứng dụng MISA báo lỗi "Application Not Responding" rồi tự đóng. Đã thử khởi động lại 2 lần vẫn gặp lỗi.',
    category: 'Software',
    priority: 'High',
    assignedTeam: 'Senior IT Support Team',
    aiReason: 'Lỗi phần mềm nghiệp vụ chuyên môn, ảnh hưởng trực tiếp đến hạn nộp báo cáo thuế cuối kỳ.',
    aiSuggestion: '1. Mở Task Manager tắt toàn bộ tiến trình chạy ngầm của MISA và SQL Server.\n2. Kiểm tra quyền ghi thư mục Temp và kiểm tra dung lượng ổ đĩa C còn trống.\n3. Chạy công cụ kiểm tra và bảo trì cơ sở dữ liệu tích hợp trong phần mềm.',
    status: 'Open',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 5 * 3600 * 1000),
  },
  {
    ticketId: 'TCK-202611-005',
    title: 'Quên mật khẩu tài khoản email và cổng thông tin nội bộ',
    description: 'Nhân viên mới nghỉ phép vào làm lại quên mật khẩu, nhập sai quá 5 lần nên tài khoản bị tạm khóa 30 phút.',
    category: 'Account & Access',
    priority: 'Low',
    assignedTeam: 'Identity and Access Support',
    aiReason: 'Yêu cầu hỗ trợ tài khoản người dùng cá nhân thông thường, không ảnh hưởng diện rộng.',
    aiSuggestion: '1. Xác minh danh tính người yêu cầu qua mã nhân viên hoặc trưởng bộ phận.\n2. Mở khóa tài khoản trên Active Directory / Google Workspace Admin.\n3. Cấp mật khẩu tạm thời có yêu cầu đổi mật khẩu ngay ở lần đăng nhập đầu tiên.',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000), // 1 ngày trước
    updatedAt: new Date(Date.now() - 23 * 3600 * 1000),
  },
  {
    ticketId: 'TCK-202611-006',
    title: 'Cài đặt bộ gõ tiếng Việt và gói Office 365 cho máy nhân viên mới',
    description: 'Cần cài đặt hệ điều hành Windows sạch, bộ gõ Unikey, gói phần mềm văn phòng Office 365 có bản quyền và cấu hình máy in cho máy bàn mới phòng Marketing.',
    category: 'Software',
    priority: 'Low',
    assignedTeam: 'Software Support',
    aiReason: 'Yêu cầu triển khai phần mềm chuẩn bị trang thiết bị làm việc theo quy trình Onboarding thông thường.',
    aiSuggestion: '1. Chạy bản ghost/image chuẩn của công ty từ Company Portal.\n2. Cài đặt Unikey bản chuẩn từ trang chính thức và thêm vào mục Startup.\n3. Đăng nhập tài khoản Microsoft 365 nội bộ và đồng bộ OneDrive công việc.',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 28 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 26 * 3600 * 1000),
  },
  {
    ticketId: 'TCK-202611-007',
    title: 'Màn hình máy tính Dell bị sọc ngang và nhấp nháy liên tục',
    description: 'Màn hình Dell 24 inch tại bàn làm việc số 15 xuất hiện sọc ngang màu hồng và chớp tắt khi cắm dây HDMI. Đã thử cắm sang màn hình khác thì bình thường.',
    category: 'Hardware',
    priority: 'Medium',
    assignedTeam: 'Hardware Support',
    aiReason: 'Sự cố lỗi phần cứng tấm nền màn hình hoặc cổng cắm hiển thị.',
    aiSuggestion: '1. Thử thay dây cáp HDMI mới hoặc chuyển sang cổng DisplayPort.\n2. Kiểm tra lại củ nguồn adapter màn hình có cấp đủ điện áp không.\n3. Nếu vẫn bị sọc, lập biên bản bảo hành đổi màn hình dự phòng cho nhân viên.',
    status: 'Open',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000),
  },
  {
    ticketId: 'TCK-202611-008',
    title: 'Không thể kết nối VPN công ty khi làm việc từ xa',
    description: 'Từ sáng nay nhân viên làm việc tại nhà sử dụng FortiClient VPN kết nối đến mạng văn phòng đều báo lỗi "Unable to establish the VPN connection (-8)".',
    category: 'Network',
    priority: 'High',
    assignedTeam: 'Infrastructure Operations (Tier 2)',
    aiReason: 'Lỗi dịch vụ mạng VPN từ xa ảnh hưởng đến tất cả nhân viên làm việc từ xa (Work from Home).',
    aiSuggestion: '1. Kiểm tra trạng thái cổng VPN Gateway trên tường lửa trung tâm.\n2. Kiểm tra chứng chỉ SSL Certificate của VPN có bị hết hạn hay không.\n3. Khởi động lại dịch vụ VPN Daemon trên Firewall chính.',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000),
  },
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'it_helpdesk';
    console.log(`Đang kết nối MongoDB: ${dbName}...`);
    await mongoose.connect(uri, { dbName });

    const collection = mongoose.connection.db.collection('tickets');
    
    // Xóa dữ liệu cũ nếu có
    const existing = await collection.countDocuments();
    if (existing > 0) {
      console.log(`Đang xóa ${existing} ticket cũ...`);
      await collection.deleteMany({});
    }

    // Thêm các ticket mẫu
    const result = await collection.insertMany(sampleTickets);
    console.log(`✓ Đã thêm thành công ${result.insertedCount} ticket mẫu vào database!`);

    const total = await collection.countDocuments();
    console.log(`Tổng số ticket hiện có trong database: ${total}`);
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối MongoDB.');
  }
}

seed();
