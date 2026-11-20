import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Bạn là HelpMate AI, trợ lý IT nội bộ, thân thiện và thực tế.
- Trả lời bằng tiếng Việt, dễ hiểu, theo từng bước khi hướng dẫn xử lý.
- Chỉ dựa trên dữ kiện được cung cấp; nếu thiếu thông tin, hỏi thêm ngắn gọn.
- Không yêu cầu người dùng chia sẻ mật khẩu, mã OTP hoặc thông tin bí mật.
- Với thao tác có nguy cơ mất dữ liệu hoặc ảnh hưởng bảo mật, cảnh báo và hướng dẫn liên hệ đội IT.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const payload = body as { message?: unknown; history?: unknown };
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "Hãy nhập nội dung cần hỗ trợ." }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Tin nhắn tối đa 5.000 ký tự." }, { status: 400 });
  }

  const history: ChatMessage[] = Array.isArray(payload.history)
    ? payload.history
        .filter(
          (item): item is { role: string; content: string } =>
            typeof item === "object" &&
            item !== null &&
            (item as { role?: unknown }).role !== undefined &&
            typeof (item as { content?: unknown }).content === "string"
        )
        .filter((item) => item.role === "user" || item.role === "assistant")
        .slice(-20)
        .map((item) => ({
          role: item.role as ChatMessage["role"],
          content: item.content.trim().slice(0, 5000),
        }))
        .filter((item) => item.content.length > 0)
    : [];

  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL || "qwen2.5:3b";

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content: message },
        ],
        options: { temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      const result = await response.json();
      const reply = result?.message?.content;
      if (typeof reply === "string" && reply.trim()) {
        return NextResponse.json({ reply: reply.trim() });
      }
    }
  } catch (error) {
    console.warn("Ollama unreachable on this host, using smart chat fallback:", error);
  }

  // Fallback IT Assistant Response
  const text = message.toLowerCase();
  let reply = "";

  if (/wifi|wi-fi|mạng|internet|kết nối/i.test(text)) {
    reply = `Chào bạn! Để khắc phục sự cố kết nối Wi-Fi/Internet, bạn hãy thử các bước sau:\n1. Tắt Wi-Fi trên thiết bị, đợi 10 giây và bật lại.\n2. Chọn mạng Wi-Fi và bấm 'Forget / Quên mạng', sau đó kết nối lại.\n3. Nếu vẫn không được, bạn bấm nút **'Tạo ticket từ sự cố này'** ở bên dưới để kỹ thuật viên IT hỗ trợ trực tiếp nhé!`;
  } else if (/mật khẩu|password|đăng nhập|login|tài khoản/i.test(text)) {
    reply = `Chào bạn! Đối với vấn đề tài khoản và mật khẩu:\n1. Kiểm tra xem phím Caps Lock có đang bật hay không.\n2. Nếu tài khoản bị tạm khóa do nhập sai nhiều lần, hệ thống sẽ mở khóa sau 15 phút.\n3. Bạn có thể bấm nút **'Tạo ticket từ sự cố này'** bên dưới để đội ngũ IT hỗ trợ reset mật khẩu nội bộ nhé! (Lưu ý: IT không bao giờ hỏi mật khẩu của bạn).`;
  } else if (/máy in|in|paper|kẹt giấy/i.test(text)) {
    reply = `Chào bạn! Để xử lý lỗi máy in:\n1. Mở nắp máy in kiểm tra xem có kẹt giấy ở khay nạp hoặc bộ cuốn hay không.\n2. Khởi động lại máy in và kiểm tra cáp USB/mạng LAN cắm vào máy in.\n3. Bạn có thể bấm nút **'Tạo ticket từ sự cố này'** bên dưới để bộ phận phần cứng đến kiểm tra mực và linh kiện nhé!`;
  } else if (/misa|phần mềm|treo|đơ|lỗi/i.test(text)) {
    reply = `Chào bạn! Khi phần mềm bị treo hoặc gặp lỗi:\n1. Thử nhấn tổ hợp Ctrl + Shift + Esc để mở Task Manager, xem ứng dụng có đang ngốn 100% CPU/RAM hay không.\n2. Thử khởi động lại ứng dụng dưới quyền Administrator.\n3. Nếu cần hỗ trợ khẩn cấp, bạn bấm nút **'Tạo ticket từ sự cố này'** ngay bên dưới nhé!`;
  } else {
    reply = `Chào bạn! Tôi là HelpMate AI. Tôi đã ghi nhận yêu cầu: "${message}".\n\nBạn có thể mô tả chi tiết hơn về hiện tượng lỗi, hoặc bấm ngay nút **'Tạo ticket từ sự cố này'** ở bên dưới để hệ thống chuyển sự cố đến kỹ thuật viên chuyên trách hỗ trợ bạn nhé!`;
  }

  return NextResponse.json({ reply });
}

