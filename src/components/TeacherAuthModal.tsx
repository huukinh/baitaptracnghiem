import React, { useState } from 'react';
import { TeacherUser } from '../types/quiz';
import { 
  GraduationCap, 
  School, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  UserPlus, 
  Sparkles,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { sound } from '../utils/sound';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (teacher: TeacherUser) => void;
  initialMode?: 'login' | 'register' | 'reset';
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [fullName, setFullName] = useState('Thầy Nguyễn Hữu Kính');
  const [schoolName, setSchoolName] = useState('Trường Tiểu học Hoài Nhơn Nam');
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('last_teacher_email') || 'thaykinh2022@gmail.com';
    } catch {
      return 'thaykinh2022@gmail.com';
    }
  });
  const [password, setPassword] = useState('123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorReason, setErrorReason] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorReason('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Vui lòng nhập Email.');
      return;
    }

    if (!cleanPassword) {
      setError('Vui lòng nhập Mật khẩu.');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim() || !schoolName.trim()) {
        setError('Vui lòng điền đầy đủ Họ và tên cùng Trường học.');
        return;
      }
      if (cleanPassword.length < 3) {
        setError('Mật khẩu cần tối thiểu 3 ký tự.');
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
    } else if (mode === 'reset') {
      if (cleanPassword.length < 3) {
        setError('Mật khẩu mới cần tối thiểu 3 ký tự.');
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    setIsLoading(true);
    sound.playClick();

    try {
      let endpoint = '/api/auth/login';
      let body: any = { email: cleanEmail, password: cleanPassword };

      if (mode === 'register') {
        endpoint = '/api/auth/register';
        body = {
          fullName: fullName.trim(),
          schoolName: schoolName.trim(),
          email: cleanEmail,
          password: cleanPassword,
        };
      } else if (mode === 'reset') {
        endpoint = '/api/auth/reset-password';
        body = {
          email: cleanEmail,
          newPassword: cleanPassword,
          fullName: fullName.trim(),
          schoolName: schoolName.trim(),
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorReason(data.reason || '');
        throw new Error(data.error || 'Thao tác không thành công.');
      }

      sound.playSuccess();
      try {
        localStorage.setItem('last_teacher_email', cleanEmail);
      } catch {}
      onAuthSuccess(data.teacher);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (teacherEmail: string, pass: string = '123') => {
    sound.playClick();
    setEmail(teacherEmail);
    setPassword(pass);
    setIsLoading(true);
    setError('');
    setErrorReason('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: teacherEmail.trim().toLowerCase(), password: pass }),
      });
      const data = await res.json();
      if (data.success && data.teacher) {
        sound.playSuccess();
        try {
          localStorage.setItem('last_teacher_email', teacherEmail.trim().toLowerCase());
        } catch {}
        onAuthSuccess(data.teacher);
        onClose();
      } else {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-amber-300 overflow-hidden my-auto flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 p-5 md:p-6 text-white text-center relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl mx-auto mb-2 shadow-inner">
            🎓
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            {mode === 'login'
              ? 'Đăng Nhập Giáo Viên'
              : mode === 'register'
              ? 'Đăng Ký Tài Khoản Giáo Viên'
              : 'Đặt Lại Mật Khẩu'}
          </h2>
          <p className="text-xs text-amber-100 mt-1">
            {mode === 'login'
              ? 'Đăng nhập để quản lý lớp học, giao bài tập và theo dõi Bảng Vàng'
              : mode === 'register'
              ? 'Tạo tài khoản giáo viên mới để giao đề và đánh giá học sinh'
              : 'Thiết lập mật khẩu mới và đăng nhập tức thì vào hệ thống'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-amber-200 bg-amber-50/50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setErrorReason('');
            }}
            className={`flex-1 py-3 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'text-amber-950 border-b-2 border-amber-500 bg-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
              setErrorReason('');
            }}
            className={`flex-1 py-3 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'text-amber-950 border-b-2 border-amber-500 bg-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Đăng Ký Mới
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('reset');
              setError('');
              setErrorReason('');
            }}
            className={`flex-1 py-3 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'reset'
                ? 'text-amber-950 border-b-2 border-amber-500 bg-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Đổi Mật Khẩu
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {errorReason === 'wrong_password' && (
                <div className="pt-1 border-t border-red-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-red-600 font-semibold">Gợi ý: Thử mật khẩu 123 hoặc</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setError('');
                    }}
                    className="text-[11px] font-black underline text-amber-800 hover:text-amber-950 cursor-pointer"
                  >
                    Đặt lại mật khẩu ngay ➔
                  </button>
                </div>
              )}
              {errorReason === 'email_not_found' && (
                <div className="pt-1 border-t border-red-200/60 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="text-[11px] font-black underline text-amber-800 hover:text-amber-950 cursor-pointer"
                  >
                    Bấm vào đây để Đăng Ký Mới với email này ➔
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Registration Fields */}
          {mode === 'register' && (
            <>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Họ và Tên Giáo Viên *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Thầy Nguyễn Hữu Kính"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 outline-none text-xs font-bold text-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* School Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Trường Học Công Tác *
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Ví dụ: Trường Tiểu học Hoài Nhơn Nam"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 outline-none text-xs font-bold text-slate-800 bg-white"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Email Đăng Nhập *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="thaykinh2022@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 outline-none text-xs font-bold text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                {mode === 'reset' ? 'Mật Khẩu Mới *' : 'Mật Khẩu *'}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError('');
                  }}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'reset' ? 'Nhập mật khẩu mới...' : 'Nhập mật khẩu (mặc định 123)...'}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 outline-none text-xs font-bold text-slate-800 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register and Reset modes) */}
          {(mode === 'register' || mode === 'reset') && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Nhập Lại Mật Khẩu *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại mật khẩu..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 outline-none text-xs font-bold text-slate-800 bg-white"
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-md shadow-amber-300 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập Ngay'}</span>
              </>
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{isLoading ? 'Đang tạo tài khoản...' : 'Hoàn Tất Đăng Ký'}</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>{isLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu & Đăng Nhập'}</span>
              </>
            )}
          </button>

          {/* Quick 1-Click login helper for evaluation */}
          <div className="pt-2 text-center space-y-2">
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                <span className="bg-white px-2">Đăng nhập nhanh 1-chạm</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleQuickLogin('thaykinh2022@gmail.com', '123')}
              className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-extrabold text-xs transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Thầy Nguyễn Hữu Kính</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">thaykinh2022@gmail.com (123)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('mai.tran@kimdong.edu.vn', '123')}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 font-bold text-xs transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-slate-500" />
                <span>Cô Trần Thị Mai (TH Kim Đồng)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">mai.tran@kimdong.edu.vn (123)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('thang.hoang@lequydon.edu.vn', '123')}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 font-bold text-xs transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-slate-500" />
                <span>Thầy Hoàng Văn Thắng (TH Lê Quý Đôn)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">thang.hoang@lequydon.edu.vn (123)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
