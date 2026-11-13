# HelpMate AI IT Helpdesk — Trương Thị Mộng Ngân

Dự án Hệ thống IT Helpdesk tích hợp Trí tuệ Nhân tạo và Chuỗi Tự động hóa 9 Workflows n8n, Next.js 16, TypeScript và MongoDB Atlas.

- **Tác giả / Developer:** Trương Thị Mộng Ngân ([@mtn81226](https://github.com/mtn81226))
- **Mã nguồn:** [HelpMetaAI Repository](https://github.com/mtn81226/HelpMetaAI)
- **Tài liệu đặc tả WF04-05-06:** [docs/WORKFLOWS_4_5_6_SPEC.md](docs/WORKFLOWS_4_5_6_SPEC.md)
- **Tài liệu kiểm thử tự động:** [docs/TESTING_AUTOMATION_GUIDE.md](docs/TESTING_AUTOMATION_GUIDE.md)

---

## 🚀 Tính năng nổi bật

1. **Chuỗi 9 Workflows Tự động hóa n8n (≥ 12 node/workflow):**
   - **WF01 (Ticket Intake):** Tiếp nhận yêu cầu hỗ trợ qua Webhook.
   - **WF02 (Ticket Classification):** Trí tuệ nhân tạo Ollama (`llama3.2`) phân loại danh mục tự động.
   - **WF03 (Priority Assessment):** Đánh giá mức độ nghiêm trọng và gắn cờ khẩn cấp.
   - **WF04 (Team Assignment):** Phân công đội ngũ chuyên trách & luồng đặc quyền **Executive VIP Fast-track**.
   - **WF05 (Duplicate Detection):** Thuật toán khử dấu tiếng Việt Unicode NFD & bộ từ điển 50+ IT Stopwords chống trùng lặp.
   - **WF06 (Support Response):** Kịch bản sơ cứu sự cố thông minh (Zoom/Teams micro, phần mềm ERP MISA/SAP, mạng Wi-Fi, cô lập mã độc) kèm cam kết SLA theo chuẩn ITIL.
   - **WF07 (High Priority Alert):** Cảnh báo sự cố mức cao.
   - **WF08 (SLA Monitoring):** Theo dõi hạn xử lý theo cấp độ ưu tiên.
   - **WF09 (Audit Log):** Đồng bộ và lưu vết kiểm toán vào MongoDB Atlas.

2. **Xác thực & Phân quyền Người dùng (RBAC):**
   - **Quản trị viên (Admin - Trương Thị Mộng Ngân):** Toàn quyền xem trang **Audit Log & Pipeline** trực tiếp từ MongoDB Atlas, quản lý và xóa vĩnh viễn ticket.
   - **Nhân viên Helpdesk (User):** Giao diện tinh gọn tập trung tiếp nhận và xử lý sự cố.

3. **Kiểm thử Tự động Toàn diện (Automated Testing Suite):**
   - 70/70 assertions đạt PASS 100% bao gồm cả kiểm thử đơn vị workflows và kiểm thử toàn trình End-to-End Pipeline.

---

## 🛠 Yêu cầu hệ thống

- Node.js 20.9+ (khuyến nghị bản LTS)
- npm
- MongoDB Atlas (hoặc MongoDB local)
- Ollama AI (Model `llama3.2`)
- n8n tự động hóa workflow (chạy trên cổng 5678)

---

## 1. Cài đặt

```bash
npm install
```

Tạo file `.env.local` ở thư mục gốc:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/it_helpdesk
N8N_WEBHOOK_URL=http://localhost:5678/webhook/ticket-intake
```

Khởi tạo dữ liệu người dùng mẫu:
```bash
node scripts/seed-users.mjs
```

---

## 2. Khởi chạy ứng dụng

```bash
npm run dev
```
Mở trình duyệt: `http://localhost:3000` (hoặc đăng nhập tại `http://localhost:3000/login`).

---

## 3. Kiểm thử Tự động (Automated Testing)

Chạy toàn bộ 70 kịch bản kiểm thử:
```bash
npm run test:workflows
```

Hoặc chạy riêng lẻ từng bộ kiểm thử:
```bash
npm run test:wf04     # Kiểm thử Phân công Đội ngũ & VIP Routing (14 checks)
npm run test:wf05     # Kiểm thử Chống trùng lặp & Tiếng Việt NFD (20 checks)
npm run test:wf06     # Kiểm thử Kịch bản Sơ cứu IT & SLA (13 checks)
npm run test:e2e      # Kiểm thử Toàn trình End-to-End Pipeline (23 checks)
```

---

## 4. Tài khoản Đăng nhập Mẫu

| Vai trò | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên** | `ngan@helpdesk.meta.ai` | `Helpdesk123` | Toàn quyền, Xem Audit Log, Xóa ticket |
| **Nhân viên Helpdesk** | `user@helpdesk.meta.ai` | `User123` | Xử lý ticket L1/L2, Đổi trạng thái |
