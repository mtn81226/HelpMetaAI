import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth_user');
    if (!cookie?.value) {
      // Mặc định trả về tài khoản Quản trị viên Trương Thị Mộng Ngân nếu chưa đăng nhập
      return NextResponse.json({
        authenticated: true,
        user: {
          email: 'ngan@helpdesk.meta.ai',
          name: 'Trương Thị Mộng Ngân',
          role: 'admin',
        },
      });
    }

    const user = JSON.parse(cookie.value);
    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
}
