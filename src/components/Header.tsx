import React from 'react';
import { 
  Sparkles, 
  Printer, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Trophy, 
  School, 
  UserCheck, 
  GraduationCap,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { sound } from '../utils/sound';
import { UserRole, TeacherUser } from '../types/quiz';

interface HeaderProps {
  userRole: UserRole;
  onToggleRole: (role: UserRole) => void;
  currentTeacher: TeacherUser | null;
  onOpenAuthModal: () => void;
  onLogoutTeacher: () => void;
  onOpenCreateModal: () => void;
  onOpenPrintView: () => void;
  onOpenQuestionBank: () => void;
  onOpenClassrooms: () => void;
  onOpenLeaderboard: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentGrade: string;
  studentName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  onToggleRole,
  currentTeacher,
  onOpenAuthModal,
  onLogoutTeacher,
  onOpenCreateModal,
  onOpenPrintView,
  onOpenQuestionBank,
  onOpenClassrooms,
  onOpenLeaderboard,
  soundEnabled,
  onToggleSound,
  currentGrade,
  studentName,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200 shadow-xs print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 flex items-center justify-center text-2xl shadow-sm shadow-amber-300">
            🎒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-tight text-slate-800 leading-tight">
                Trắc Nghiệm Tiểu Học
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 hidden sm:inline-block">
                {currentGrade}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 hidden md:block">
              {userRole === 'teacher'
                ? currentTeacher
                  ? `${currentTeacher.fullName} • ${currentTeacher.schoolName}`
                  : 'Cổng Giáo Viên • Đăng nhập để quản lý & đánh giá'
                : 'Cổng Học Sinh • Làm bài tập & Nhận điểm ngay'}
            </p>
          </div>
        </div>

        {/* Center: Prominent Role Switcher */}
        <div className="flex items-center bg-amber-100/70 p-1 rounded-2xl border border-amber-300">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onToggleRole('teacher');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              userRole === 'teacher'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-900 hover:bg-amber-200/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Giáo Viên</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onToggleRole('student');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              userRole === 'student'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-950 hover:bg-amber-200/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Học Sinh</span>
            {studentName && <span className="hidden sm:inline font-bold">({studentName})</span>}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Teacher Auth / Profile Button */}
          {userRole === 'teacher' && (
            currentTeacher ? (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-xl text-xs">
                <span className="font-extrabold text-amber-950 truncate max-w-[120px] sm:max-w-[150px]">
                  {currentTeacher.fullName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onLogoutTeacher();
                  }}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Đăng xuất tài khoản giáo viên"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenAuthModal();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs border border-amber-300 transition-colors cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-700" />
                <span>Đăng Nhập / Đăng Ký</span>
              </button>
            )
          )}

          {/* Question Bank */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenQuestionBank();
            }}
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-amber-300 hover:bg-amber-50 text-amber-950 font-extrabold text-xs transition-colors cursor-pointer"
            title="Ngân hàng đề thi chuẩn"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Ngân Hàng Đề</span>
          </button>

          {/* Teacher Only: Classrooms */}
          {userRole === 'teacher' && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenClassrooms();
              }}
              type="button"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
              title="Quản lý lớp học"
            >
              <School className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Lớp Học</span>
            </button>
          )}

          {/* Leaderboard / Bảng Vàng */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-amber-300 hover:bg-amber-50 text-amber-900 font-black text-xs transition-colors cursor-pointer"
            title="Bảng vàng thành tích"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span className="hidden md:inline">Bảng Vàng</span>
          </button>

          {/* Teacher Only: Create New Quiz */}
          {userRole === 'teacher' && (
            <button
              onClick={onOpenCreateModal}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white/20" />
              <span>Tạo Đề Mới</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            type="button"
            className="w-8 h-8 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
