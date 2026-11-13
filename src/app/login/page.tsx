'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ngan@helpdesk.meta.ai');
  const [password, setPassword] = useState('Helpdesk123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Email hoặc mật khẩu không chính xác');
      }

      // Lưu trữ thông tin tài khoản vào localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const selectQuickAccount = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, #ece8ff 0%, #f7f8fc 60%, #eef0ff 100%)',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(104, 86, 232, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e8e5fc',
        padding: '38px 36px',
        boxSizing: 'border-box'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #7c6af3, #5744d5)',
            color: '#ffffff',
            fontSize: '30px',
            boxShadow: '0 10px 22px rgba(104, 86, 232, 0.32)',
            marginBottom: '16px'
          }}>
            ✦
          </div>
          <h1 style={{
            margin: '0 0 6px 0',
            fontSize: '24px',
            fontWeight: 800,
            color: '#20213a',
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: '-0.5px'
          }}>
            HelpMate <span style={{ color: '#6856e8' }}>AI</span>
          </h1>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: '#8a8da5'
          }}>
            Hệ thống Tự động hóa IT HelpDesk & Quản lý Ticket
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecaca',
            color: '#9f1239',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '18px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              color: '#474966',
              marginBottom: '7px'
            }}>
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhap.email@helpdesk.meta.ai"
              style={{
                width: '100%',
                padding: '13px 14px',
                border: '1px solid #e1e1ec',
                borderRadius: '11px',
                fontSize: '13px',
                color: '#20213a',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
                background: '#fafafc'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6856e8'}
              onBlur={(e) => e.target.style.borderColor = '#e1e1ec'}
            />
          </div>

          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '7px'
            }}>
              <label style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#474966'
              }}>
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6856e8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? 'Ẩn' : 'Hiện'} mật khẩu
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '13px 14px',
                border: '1px solid #e1e1ec',
                borderRadius: '11px',
                fontSize: '13px',
                color: '#20213a',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
                background: '#fafafc'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6856e8'}
              onBlur={(e) => e.target.style.borderColor = '#e1e1ec'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '11px',
              background: loading ? '#9b8ee8' : 'linear-gradient(135deg, #6856e8, #5240d4)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 18px rgba(104, 86, 232, 0.28)',
              marginTop: '4px',
              transition: 'transform 0.15s, background 0.15s'
            }}
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống →'}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px dashed #e4e2f3'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#8b8ca8',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Tài khoản mẫu nhanh (Demo)
          </div>

          <div style={{ display: 'grid', gap: '9px' }}>
            <button
              type="button"
              onClick={() => selectQuickAccount('ngan@helpdesk.meta.ai', 'Helpdesk123')}
              style={{
                padding: '10px 14px',
                border: email === 'ngan@helpdesk.meta.ai' ? '1.5px solid #6856e8' : '1px solid #eae7f8',
                borderRadius: '10px',
                background: email === 'ngan@helpdesk.meta.ai' ? '#f4f1ff' : '#faf9ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <div>
                <strong style={{ fontSize: '12px', color: '#20213a', display: 'block' }}>
                  👑 Trương Thị Mộng Ngân
                </strong>
                <span style={{ fontSize: '11px', color: '#6856e8' }}>
                  ngan@helpdesk.meta.ai (Quản trị viên)
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#8a8da5', fontWeight: 600 }}>Chọn</span>
            </button>

            <button
              type="button"
              onClick={() => selectQuickAccount('user@helpdesk.meta.ai', 'User123')}
              style={{
                padding: '10px 14px',
                border: email === 'user@helpdesk.meta.ai' ? '1.5px solid #6856e8' : '1px solid #eae7f8',
                borderRadius: '10px',
                background: email === 'user@helpdesk.meta.ai' ? '#f4f1ff' : '#faf9ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <div>
                <strong style={{ fontSize: '12px', color: '#20213a', display: 'block' }}>
                  👤 Nhân viên Helpdesk
                </strong>
                <span style={{ fontSize: '11px', color: '#6856e8' }}>
                  user@helpdesk.meta.ai (Nhân viên)
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#8a8da5', fontWeight: 600 }}>Chọn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
