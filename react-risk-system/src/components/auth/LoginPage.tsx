import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeUserRole } from './authUtils';

const API_URL = 'https://localhost:7002/api/auth/login';

interface LoginResponse {
  token: string;
  refreshToken: string;
  username: string;
  roles: string[];
  role: string;
  expiresAt: number;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State for form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');

  // State for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Generate random captcha
  const generateCaptcha = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; 
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [captchaText] = useState(generateCaptcha());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Validate Captcha
    if (captcha.trim().toLowerCase() !== captchaText.toLowerCase()) {
      setErrorMessage('رمز التحقق غير صحيح');
      return;
    }

    // 2. Start Loading
    setIsLoading(true);

    try {
      // 3. Send Request to Backend
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Email: username,
          Password: password,
        }),
      });

      // 4. Parse Response
      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as any).message || 'فشل تسجيل الدخول');
      }

      // 5. Save Authentication Data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('username', data.username);
      const primaryRole = data.roles?.[0] ?? data.role;
      localStorage.setItem('userRole', normalizeUserRole(primaryRole));
      
      // Calculate token expiry timestamp
      const expiryTime = Date.now() + (data.expiresAt * 1000);
      localStorage.setItem('tokenExpiry', expiryTime.toString());
      
      // Login flag
      localStorage.setItem('isLoggedIn', 'true');

      console.log('✅ Login successful:', {
        username: data.username,
        role: data.roles[0],
        expiresIn: `${data.expiresAt} seconds`
      });

      // 6. Navigate to Dashboard
      navigate('/');

    } catch (error: any) {
      console.error('❌ Login Error:', error);
      
      if (error.message === 'Failed to fetch') {
        setErrorMessage('فشل الاتصال بالخادم. تأكد من اتصالك بالإنترنت');
      } else {
        setErrorMessage(error.message || 'حدث خطأ غير متوقع');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-row">
      {/* Left Side - Background Photo */}
      <div 
        className="hidden md:block flex-1 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/loginphoto.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-[480px] bg-white flex items-center justify-center p-6 shadow-2xl flex-shrink-0">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mb-4">
              <img 
                src="/JUlogo.png" 
                alt="University of Jordan Logo" 
                className="w-28 h-28 mx-auto object-contain"
              />
            </div>
            <h2 className="text-gray-800 text-lg font-bold mb-1">الجامعة الأردنية</h2>
            <h1 className="text-gray-900 text-xl font-bold">نظام تسجيل الطلبة</h1>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-right text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5 text-right">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-right bg-gray-50 disabled:bg-gray-100"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5 text-right">
                كلمة السر
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-right bg-gray-50 disabled:bg-gray-100"
                required
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5 text-right">
                رمز التحقق
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-right bg-gray-50 disabled:bg-gray-100"
                  required
                  autoComplete="off"
                />
                <div className="w-28 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300 select-none">
                  <span 
                    className="text-xl font-bold tracking-widest text-gray-700" 
                    style={{ textDecoration: 'line-through', fontFamily: 'monospace' }}
                  >
                    {captchaText}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white py-2.5 rounded-lg font-bold text-base shadow-lg transition-colors
                  ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                `}
              >
                {isLoading ? 'جاري الاتصال...' : 'دخول'}
              </button>
            </div>
          </form>

          <div className="mt-5 space-y-1.5 text-center text-sm">
            <a href="#" className="block text-blue-600 hover:underline">
              استعادة كلمة السر باستخدام: رقم الهاتف
            </a>
            <a href="#" className="block text-blue-600 hover:underline">
              حساب مايكروسوفت
            </a>
            <a href="#" className="block text-blue-600 hover:underline">
              البريد الإلكتروني البديل
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
