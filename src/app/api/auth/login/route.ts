import { NextRequest, NextResponse } from 'next/server';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
    const [, salt, originalHash] = parts;
    const hash = scryptSync(password, salt, 64).toString('hex');
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ email và mật khẩu' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 1. Kiểm tra đối sánh trong MongoDB
    let authenticatedUser: { email: string; name: string; role: string } | null = null;

    try {
      await connectDB();
      const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
      if (user && user.passwordHash) {
        const isMatch = verifyPassword(password, user.passwordHash);
        if (isMatch) {
          authenticatedUser = {
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }
      }
    } catch (dbError) {
      console.warn('MongoDB query warning in login, checking default credentials:', dbError);
    }

    // 2. Fallback đối chiếu tài khoản Quản trị viên & Demo
    if (!authenticatedUser) {
      if (
        (normalizedEmail === 'ngan@helpdesk.meta.ai' || normalizedEmail === 'admin@helpdesk.meta.ai') &&
        password === (process.env.ADMIN_PASSWORD || 'Helpdesk123')
      ) {
        authenticatedUser = {
          email: normalizedEmail,
          name: process.env.ADMIN_NAME || 'Trương Thị Mộng Ngân',
          role: 'admin',
        };
      } else if (
        normalizedEmail === 'user@helpdesk.meta.ai' &&
        password === (process.env.DEMO_USER_PASSWORD || 'User123')
      ) {
        authenticatedUser = {
          email: normalizedEmail,
          name: process.env.DEMO_USER_NAME || 'Nhân viên Helpdesk',
          role: 'user',
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { success: false, message: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Thiết lập cookie phiên đăng nhập
    const res = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: authenticatedUser,
    });

    res.cookies.set('auth_user', JSON.stringify(authenticatedUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    });

    return res;
  } catch (error: any) {
    console.error('Lỗi API login:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi máy chủ, vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
