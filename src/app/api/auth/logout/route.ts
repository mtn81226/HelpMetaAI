import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: 'Đăng xuất thành công',
  });

  res.cookies.set('auth_user', '', {
    path: '/',
    maxAge: 0,
  });

  return res;
}
