
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = String(body.category ?? "Chưa phân loại");
    const priority = String(body.priority ?? "Medium");

    if (!title || !description) {
      return NextResponse.json(
        { error: "Ticket cần có tiêu đề và mô tả." },
        { status: 400 }
      );
    }

    const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
    const model = process.env.OLLAMA_MODEL || "qwen2.5:3b";

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [
              {
                role: "system",
                content: `
Bạn là chuyên gia hỗ trợ kỹ thuật IT của hệ thống HelpMate AI.
Hãy phân tích ticket và đưa ra đề xuất xử lý bằng tiếng Việt.
Chỉ dựa trên thông tin được cung cấp, không khẳng định nguyên nhân
khi chưa đủ bằng chứng.

Trả lời theo đúng cấu trúc:
1. Nhận định vấn đề
2. Nguyên nhân có thể
3. Đề xuất xử lý theo từng bước
4. Mức độ khẩn cấp và lưu ý

Đề xuất phải thực tế, dễ hiểu, phù hợp với nhân viên IT.
Nếu thiếu thông tin, hãy nêu rõ cần kiểm tra thêm điều gì.
                `.trim(),
              },
              {
                role: "user",
                content: `
Tiêu đề: ${title}
Mô tả: ${description}
Danh mục: ${category}
Mức độ ưu tiên hiện tại: ${priority}

Hãy tạo đề xuất xử lý cho ticket này.
                `.trim(),
              },
            ],
            options: {
              temperature: 0.2,
            },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const suggestion = result.message?.content?.trim();

        if (suggestion) {
          return NextResponse.json({ success: true, suggestion });
        }
      }
    } catch (ollamaErr) {
      console.warn("Ollama unreachable on this host, using smart triage fallback:", ollamaErr);
    }

    // Fallback AI Diagnostic Plan
    const text = `${title} ${description}`.toLowerCase();
    let fallbackText = "";

    if (/wifi|wi-fi|mạng|internet|lan|kết nối|dns|vpn/i.test(text)) {
      fallbackText = `### 1. Nhận định vấn đề\nSự cố gián đoạn kết nối mạng (${category}) tại khu vực làm việc.\n\n### 2. Nguyên nhân có thể\n- Xung đột địa chỉ IP nội bộ hoặc Access Point quá tải.\n- Driver card mạng Wi-Fi bị treo hoặc cáp mạng LAN lỏng.\n\n### 3. Đề xuất xử lý theo từng bước\n1. Tắt và bật lại card mạng (hoặc ngắt kết nối và chọn 'Forget Network').\n2. Chạy lệnh \`ipconfig /flushdns\` và \`ipconfig /renew\`.\n3. Kiểm tra đèn báo tín hiệu trên Switch/Access Point tầng.\n\n### 4. Mức độ khẩn cấp & Lưu ý\n- Mức độ ưu tiên: ${priority}.\n- Không reset Router trung tâm khi chưa báo quản trị viên mạng.`;
    } else if (/misa|treo|đơ|xuất|báo cáo|phần mềm|excel|word|outlook/i.test(text)) {
      fallbackText = `### 1. Nhận định vấn đề\nỨng dụng phần mềm (${category}) bị đóng băng (Not Responding) khi thao tác dữ liệu.\n\n### 2. Nguyên nhân có thể\n- Tràn bộ nhớ tạm (RAM leak) hoặc tệp báo cáo quá lớn vượt hạn mức xử lý.\n- Xung đột tiến trình nền đang khóa tệp dữ liệu.\n\n### 3. Đề xuất xử lý theo từng bước\n1. Mở Task Manager, kiểm tra mức sử dụng CPU/Memory của ứng dụng.\n2. Chờ 2-3 phút để hoàn tất ghi tệp, nếu không phản hồi thì chọn End Task an toàn.\n3. Khởi động lại ứng dụng dưới quyền 'Run as administrator' và thử chia nhỏ kỳ xuất báo cáo.\n\n### 4. Mức độ khẩn cấp & Lưu ý\n- Mức độ ưu tiên: ${priority}.\n- Khuyên người dùng sao lưu tệp thường xuyên.`;
    } else {
      fallbackText = `### 1. Nhận định vấn đề\nTiếp nhận sự cố: "${title}" thuộc nhóm ${category} (Ưu tiên: ${priority}).\n\n### 2. Nguyên nhân có thể\n- Lỗi tương thích cấu hình phần cứng hoặc tệp cấu hình phần mềm bị lỗi.\n\n### 3. Đề xuất xử lý theo từng bước\n1. Thu thập chi tiết thông báo lỗi và ảnh chụp màn hình từ người dùng.\n2. Khởi động lại thiết bị liên quan để giải phóng bộ nhớ tạm.\n3. Điều phối kỹ thuật viên chuyên trách liên hệ hỗ trợ theo quy trình ITIL.\n\n### 4. Mức độ khẩn cấp & Lưu ý\n- Cam kết SLA phản hồi theo mức độ ${priority}.\n- ⚠️ Tuyệt đối không yêu cầu người dùng cung cấp mật khẩu hoặc mã OTP.`;
    }

    return NextResponse.json({ success: true, suggestion: fallbackText });
  } catch (error) {
    console.error("AI suggestion error:", error);

    return NextResponse.json(
      {
        error:
          "Không thể tạo đề xuất AI. Hãy kiểm tra lại kết nối.",
      },
      { status: 500 }
    );
  }
}
