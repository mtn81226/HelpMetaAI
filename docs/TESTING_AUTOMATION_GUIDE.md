# 🧪 Hướng Dẫn Chạy Kiểm Thử Tự Động (Automated Test Suites)

**Tác giả:** Trương Thị Mộng Ngân (`mtn81226`)  
**Bộ kiểm thử:** HelpMetaAI Workflow Automation Tests  

---

## 1. Yêu Cầu Môi Trường Trước Khi Test

Trước khi chạy kiểm thử, đảm bảo các dịch vụ phụ trợ đang hoạt động:
1. **n8n Container** đang chạy trên cổng `5678`:
   ```bash
   curl http://localhost:5678/healthz
   # Kết quả mong đợi: {"status":"ok"}
   ```
2. **Ollama AI Service** đang lắng nghe trên cổng `11434` (để phục vụ WF02 Classification):
   ```bash
   curl http://localhost:11434/api/tags
   ```

---

## 2. Các Lệnh Chạy Kiểm Thử

Dự án đã tích hợp sẵn các script kiểm thử thông qua `package.json`:

### 🔹 Chạy toàn bộ các bài kiểm thử (Toàn diện)
```bash
npm run test:workflows
```
> Lệnh này sẽ tuần tự thực thi toàn bộ 4 bộ test (WF04, WF05, WF06 và E2E Pipeline).

---

### 🔹 Chạy kiểm thử riêng từng Workflow

#### 1. Kiểm thử Phân bổ đội nhóm & VIP Routing (WF04):
```bash
npm run test:wf04
# hoặc: node tests/test-wf04-team-assignment.mjs
```
*Kịch bản kiểm tra:*
- Nhận diện sự cố phòng họp VIP Ban Giám Đốc -> Chuyển vào `Executive VIP Support Taskforce` & `queue-executive-fasttrack`.
- Sự cố hạ tầng mạng mức Critical -> Leo thang sang Tier 2 (`queue-network-escalated`).
- Sự cố phần cứng thông thường -> Hàng đợi L1 (`queue-hardware`).
- Quyền truy cập thư mục & sự cố an ninh bảo mật.

#### 2. Kiểm thử Lọc trùng & Chuẩn hóa Tiếng Việt NFD (WF05):
```bash
npm run test:wf05
# hoặc: node tests/test-wf05-duplicate-detection.mjs
```
*Kịch bản kiểm tra:*
- Bóc tách dấu tiếng Việt bằng chuẩn NFD.
- Lọc bỏ hơn 50 stopwords IT thông dụng (`khong`, `duoc`, `admin`, `help`, `gap`, `em`, `anh`...).
- Kiểm tra tính độc bản của Fingerprint và Signature giữa các loại sự cố khác nhau.
- Tính liên tục của pipeline dẫn sang WF06-WF09.

#### 3. Kiểm thử Tự động phản hồi & Triage chuyên gia (WF06):
```bash
npm run test:wf06
# hoặc: node tests/test-wf06-support-response.mjs
```
*Kịch bản kiểm tra:*
- Sự cố họp trực tuyến (Zoom / Teams) -> Hướng dẫn cấp quyền Microphone/Camera.
- Sự cố phần mềm kế toán (MISA / SAP) -> Hướng dẫn kiểm tra SQL Server và Task Manager.
- Khắc phục sự cố mạng Wi-Fi (Quên mạng / Forget Network).
- Giao thức an ninh mạng khẩn cấp (Ngắt kết nối vật lý ngay lập tức).
- Độ chính xác cam kết SLA theo từng mức ưu tiên.

#### 4. Kiểm thử Tích Hợp Toàn Chuỗi (End-to-End Pipeline):
```bash
npm run test:e2e
# hoặc: node tests/test-e2e-pipeline.mjs
```
*Kịch bản kiểm tra:*
- Luồng vé xuất phát từ điểm tiếp nhận **WF01 Intake**.
- Đi qua phân loại AI **WF02 (Ollama llama3.2)** -> đánh giá ưu tiên **WF03**.
- Định tuyến thông minh **WF04** -> bóc tách dấu vân tay **WF05** -> phản hồi giải pháp **WF06**.
- Kích hoạt cảnh báo **WF07** -> tính toán SLA **WF08**.
- Lưu trữ bản ghi Audit Log hoàn chỉnh vào **MongoDB Atlas** thông qua **WF09**.

---

## 3. Mẫu Kết Quả Kiểm Thử Thành Công

```
======================================================================
🚀 TEST SUITE: End-to-End IT HelpDesk Multi-Workflow AI Pipeline
Intake Webhook Endpoint: http://localhost:5678/webhook/ticket-intake
======================================================================

▶ [E2E Pipeline] Running: Scenario 1: Executive Boardroom VIP Emergency Network Incident
  ⏱ Pipeline execution finished in 15.30s
  ✅ PASS: Valid ticketId generated: TCK-1794560495727
  ✅ PASS: Ticket status is "Open" (got "Open")
  ✅ PASS: Classified into valid category: "Network"
  ✅ PASS: AI classification rationale provided
  ✅ PASS: Emergency ticket assessed as high/critical: "High"
  ✅ PASS: VIP assigned to Executive Taskforce: "Executive VIP Support Taskforce"
  ✅ PASS: VIP queue is fast-track: "queue-executive-fasttrack"
  ✅ PASS: Deduplication fingerprint generated: "Network|10h|cap|cuoc|gia|giam|hop|khan|luc|mang|noi|phong|sang|tham|tong|truc"
  ✅ PASS: Deduplication check completed
  ✅ PASS: Duplicate signature extracted: "Network#High#10h-cap-cuoc-gia"
  ✅ PASS: Automated customer suggested response generated
  ✅ PASS: Security warning preserved in response
  ✅ PASS: SLA due date calculated: 2026-11-13T13:01:35.738Z
  ✅ PASS: Workflow trace contains all 9 workflows: [WF01 -> WF02 -> WF03 -> WF04 -> WF05 -> WF06 -> WF07 -> WF08 -> WF09]
  ✅ PASS: MongoDB Atlas persisted document ID: 6af6d1fe6dd8d6e61f9732bf
  ✅ PASS: Workflow pipeline final success confirmed

======================================================================
Pipeline Results: 23 passed, 0 failed
======================================================================
```
