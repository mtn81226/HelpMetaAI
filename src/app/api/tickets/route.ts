import { NextResponse } from 'next/server';
import connectDB, { isMongoConnectionError } from '../../../lib/mongodb';
import Ticket from '../../../models/Ticket';


type Classification = {
  category:
    | 'Network'
    | 'Hardware'
    | 'Software'
    | 'Account & Access'
    | 'Security'
    | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  assignedTeam: string;
  reason: string;
  suggestion: string;
};

const categories: Classification['category'][] = [
  'Network',
  'Hardware',
  'Software',
  'Account & Access',
  'Security',
  'Other',
];

const priorities: Classification['priority'][] = [
  'Low',
  'Medium',
  'High',
];

function fallbackClassifyTicket(
  title: string,
  description: string
): Classification {
  const text = `${title} ${description}`.toLowerCase();

  let category: Classification['category'] = 'Other';
  let assignedTeam = 'IT Helpdesk Tier 1';
  let priority: Classification['priority'] = 'Medium';

  if (
    /phishing|mã độc|malware|virus|tấn công|hack|xâm nhập|ransomware|lộ mật khẩu/i.test(
      text
    )
  ) {
    category = 'Security';
    assignedTeam = 'Security Operations (Tier 2 Incident Response)';
    priority = 'High';
  } else if (
    /wifi|wi-fi|mạng|internet|lan|vpn|dns|kết nối|mất mạng/i.test(text)
  ) {
    category = 'Network';
    assignedTeam = 'Network Support';
    priority = /toàn bộ|phòng họp|khẩn|sếp|giám đốc|hội thảo/i.test(text)
      ? 'High'
      : 'Medium';
  } else if (
    /máy in|máy tính|chuột|bàn phím|màn hình|hardware|hỏng phím|kẹt giấy|laptop|hdmi|máy chiếu/i.test(
      text
    )
  ) {
    category = 'Hardware';
    assignedTeam = 'Hardware Support';
    priority = /cháy|bốc khói|hỏng nguồn|hội thảo/i.test(text) ? 'High' : 'Low';
  } else if (
    /mật khẩu|tài khoản|đăng nhập|quyền truy cập|reset mật khẩu|khóa tài khoản|account|login/i.test(
      text
    )
  ) {
    category = 'Account & Access';
    assignedTeam = 'Identity and Access Support';
    priority = 'Medium';
  } else if (
    /phần mềm|software|cài đặt|lỗi ứng dụng|misa|excel|word|outlook|zoom|teams|treo/i.test(
      text
    )
  ) {
    category = 'Software';
    assignedTeam = 'Software Support';
    priority = /treo máy|không xuất được báo cáo|gấp/i.test(text)
      ? 'High'
      : 'Medium';
  }

  const reason = `Phân loại thông minh dựa trên phân tích từ khóa và ngữ cảnh sự cố (${category}).`;
  const suggestion = `1. Tiếp nhận và điều phối sự cố đến ${assignedTeam}.\n2. Kiểm tra log hệ thống và chủ động liên hệ người dùng xử lý theo chuẩn SLA ${priority}.\n⚠️ Lưu ý bảo mật: Tuyệt đối không yêu cầu người dùng cung cấp mật khẩu hoặc mã OTP.`;

  return {
    category,
    priority,
    assignedTeam,
    reason,
    suggestion,
  };
}

async function classifyTicket(
  title: string,
  description: string
): Promise<Classification> {
  const baseUrl =
    process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

  const model = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: false,
        format: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: categories,
            },
            priority: {
              type: 'string',
              enum: priorities,
            },
            assignedTeam: {
              type: 'string',
            },
            reason: {
              type: 'string',
            },
            suggestion: {
              type: 'string',
            },
          },
          required: [
            'category',
            'priority',
            'assignedTeam',
            'reason',
            'suggestion',
          ],
        },
        messages: [
          {
            role: 'system',
            content: `
Bạn là chuyên viên IT Helpdesk.
Phân tích ticket và chỉ trả về JSON theo cấu trúc được yêu cầu.

Quy tắc phân loại:
- Network: Wi-Fi, Internet, mạng, DNS, VPN, kết nối mạng.
- Hardware: máy tính, bàn phím, chuột, màn hình, máy in hoặc thiết bị vật lý.
- Software: ứng dụng, lỗi phần mềm, cài đặt hoặc cập nhật phần mềm.
- Account & Access: đăng nhập, tài khoản, mật khẩu, quyền truy cập.
- Security: phishing, tài khoản bị xâm nhập, mã độc hoặc nguy cơ bảo mật.
- Other: các vấn đề không phù hợp nhóm trên.

Mức ưu tiên:
- High: nhiều người bị ảnh hưởng, công việc quan trọng bị dừng,
  có dấu hiệu tấn công hoặc nguy cơ mất dữ liệu.
- Medium: sự cố ảnh hưởng đáng kể nhưng vẫn có cách làm việc tạm thời.
- Low: yêu cầu thông thường, câu hỏi hoặc sự cố ít ảnh hưởng.

Không tự bịa dữ kiện.
reason và suggestion phải viết bằng tiếng Việt, ngắn gọn.
Không yêu cầu người dùng cung cấp mật khẩu hoặc OTP.
Nếu chưa đủ thông tin, hãy nêu điều cần kiểm tra thêm.
          `.trim(),
          },
          {
            role: 'user',
            content: `Tiêu đề: ${title}\nMô tả: ${description}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn('Ollama không phản hồi hợp lệ, chuyển sang phân loại dự phòng.');
      return fallbackClassifyTicket(title, description);
    }

    const result = await response.json();
    const content = result?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      return fallbackClassifyTicket(title, description);
    }

    const classification = JSON.parse(content);

    if (
      !categories.includes(classification.category) ||
      !priorities.includes(classification.priority) ||
      typeof classification.assignedTeam !== 'string' ||
      typeof classification.reason !== 'string' ||
      typeof classification.suggestion !== 'string'
    ) {
      return fallbackClassifyTicket(title, description);
    }

    return classification;
  } catch (error) {
    console.warn(
      'Không thể kết nối đến Ollama trên máy chủ này (môi trường cloud), kích hoạt phân loại thông minh dự phòng:',
      error
    );
    return fallbackClassifyTicket(title, description);
  }
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500, 1000];
const VALID_STATUSES = ['Open', 'In Progress', 'Resolved'];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const requestedPage = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '10', 10) || 10;
    const limit = PAGE_SIZE_OPTIONS.includes(requestedLimit) ? requestedLimit : 10;
    const search = (searchParams.get('search') || '').trim().slice(0, 120);
    const status = searchParams.get('status') || 'All';
    const sortBy = searchParams.get('sort') || 'recent';

    const filters: Record<string, unknown>[] = [];
    if (VALID_STATUSES.includes(status)) filters.push({ status });
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filters.push({
        $or: [
          { ticketId: pattern },
          { title: pattern },
          { description: pattern },
          { category: pattern },
          { assignedTeam: pattern },
        ],
      });
    }
    const query = filters.length ? { $and: filters } : {};

    const [total, allTickets, open, inProgress, resolved, urgent, categoryAgg, priorityAgg] = await Promise.all([
      Ticket.countDocuments(query),
      Ticket.countDocuments({}),
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'In Progress' }),
      Ticket.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments({ priority: { $in: ['Critical', 'High'] }, status: { $ne: 'Resolved' } }),
      Ticket.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Ticket.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
    ]);

    const categoryMap: Record<string, number> = {};
    for (const item of categoryAgg) {
      if (item._id) categoryMap[item._id] = item.count;
    }

    const priorityMap: Record<string, number> = {};
    for (const item of priorityAgg) {
      if (item._id) priorityMap[item._id] = item.count;
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * limit;

    const sort: Record<string, 1 | -1> = sortBy === 'oldest'
      ? { createdAt: 1 as const }
      : sortBy === 'updated'
        ? { updatedAt: -1 as const, createdAt: -1 as const }
        : { createdAt: -1 as const };

    const listQuery = sortBy === 'priority'
      ? Ticket.aggregate([
          { $match: query },
          {
            $addFields: {
              __priorityOrder: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$priority', 'Critical'] }, then: 0 },
                    { case: { $eq: ['$priority', 'High'] }, then: 1 },
                    { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                    { case: { $eq: ['$priority', 'Low'] }, then: 3 },
                  ],
                  default: 4,
                },
              },
            },
          },
          { $sort: { __priorityOrder: 1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { __priorityOrder: 0 } },
        ])
      : Ticket.find(query).sort(sort).skip(skip).limit(limit).lean();

    const [tickets, priorityTickets] = await Promise.all([
      listQuery,
      Ticket.aggregate([
        {
          $addFields: {
            __priorityOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'Critical'] }, then: 0 },
                  { case: { $eq: ['$priority', 'High'] }, then: 1 },
                  { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'Low'] }, then: 3 },
                ],
                default: 4,
              },
            },
          },
        },
        { $sort: { __priorityOrder: 1, createdAt: -1 } },
        { $limit: 4 },
        { $project: { __priorityOrder: 0 } },
      ]),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: tickets,
        priorityTickets,
        meta: {
          page,
          limit,
          total,
          totalPages,
          summary: {
            total: allTickets,
            open,
            inProgress,
            resolved,
            urgent,
            categories: categoryMap,
            priorities: priorityMap,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const unavailable = isMongoConnectionError(error);
    console.error('Lỗi tải ticket:', error);

    return NextResponse.json(
      {
        success: false,
        error: unavailable
          ? 'Không thể kết nối cơ sở dữ liệu. Hãy kiểm tra MongoDB Atlas, allowlist IP và kết nối mạng.'
          : 'Không thể tải ticket. Hãy thử lại sau.',
      },
      { status: unavailable ? 503 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title =
      typeof body.title === 'string' ? body.title.trim() : '';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : '';

    if (!title || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tiêu đề và mô tả không được để trống.',
        },
        { status: 400 }
      );
    }

    if (title.length > 200 || description.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Tiêu đề tối đa 200 ký tự và mô tả tối đa 10.000 ký tự.',
        },
        { status: 400 }
      );
    }

    // Phân loại bằng Ollama trước khi lưu ticket.
    const classification = await classifyTicket(title, description);

    await connectDB();

    const ticketId = `TCK-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    const newTicket = await Ticket.create({
      ticketId,
      title,
      description,
      category: classification.category,
      priority: classification.priority,
      assignedTeam: classification.assignedTeam,
      aiReason: classification.reason,
      aiSuggestion: classification.suggestion,
      status: 'Open',
      updatedAt: new Date(),
    });

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: newTicket.ticketId,
          title: newTicket.title,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority,
          assignedTeam: newTicket.assignedTeam,
          aiReason: newTicket.aiReason,
          aiSuggestion: newTicket.aiSuggestion,
        }),
        signal: AbortSignal.timeout(10000),
      }).catch((error) => {
        console.error('Lỗi khi gọi n8n webhook:', error);
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Ollama đã phân loại và tạo ticket thành công.',
        data: newTicket,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Tạo ticket thất bại.';
    const databaseUnavailable = isMongoConnectionError(error);

    console.error('Lỗi tạo ticket:', message);

    const status =
      databaseUnavailable ||
      message.includes('Ollama') ||
      message.includes('fetch failed') ||
      message.includes('ECONNREFUSED')
        ? 503
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: databaseUnavailable
          ? 'Không thể kết nối cơ sở dữ liệu. Hãy kiểm tra MongoDB Atlas, allowlist IP và kết nối mạng.'
          : message,
      },
      { status }
    );
  }
}
