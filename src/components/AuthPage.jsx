import React, { useState } from 'react';
import { Plane, Mail, Lock, User, LogIn } from 'lucide-react';

/**
 * AuthPage - 登入/註冊頁面
 */
const AuthPage = ({ onLogin, onSignup, onGoogleLogin, onSkip }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        const result = await onSignup(email, password, name);
        // 如果 Supabase 回傳 session，代表不需信箱確認，已自動登入
        if (result?.session) {
          return; // useAuth 的 onAuthStateChange 會自動更新 user
        }
        // 需要信箱確認 → 切回登入並提示
        setSuccessMsg('註冊成功！請檢查信箱確認郵件，確認後即可登入。');
        setPassword('');
        setName('');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || '操作失敗，請再試一次');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 text-white mb-4 shadow-lg">
            <Plane className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Trip Planner</h1>
          <p className="mt-2 text-slate-500">旅程規劃與管理工具</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {isLogin ? '登入帳號' : '建立帳號'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="你的名字"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">密碼</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="至少 6 個字元"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {isLogin ? '登入' : '註冊'}
                </>
              )}
            </button>
          </form>

          {/* Google login */}
          {onGoogleLogin && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-slate-400">或</span>
                </div>
              </div>

              <button
                onClick={onGoogleLogin}
                className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                使用 Google 登入
              </button>
            </>
          )}

          {/* Toggle */}
          <p className="text-center text-sm text-slate-500 mt-6">
            {isLogin ? '還沒有帳號？' : '已經有帳號？'}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
              className="ml-1 text-blue-500 hover:text-blue-600 font-semibold"
            >
              {isLogin ? '立即註冊' : '返回登入'}
            </button>
          </p>
        </div>

        {/* Skip */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="w-full mt-4 py-2 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
          >
            跳過登入，使用本地模式
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
