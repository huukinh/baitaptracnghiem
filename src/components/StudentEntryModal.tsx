import React, { useState } from 'react';
import { QuizData } from '../types/quiz';
import { Sparkles, User, School, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { sound } from '../utils/sound';

interface StudentEntryModalProps {
  isOpen: boolean;
  quiz: QuizData;
  schoolName: string;
  className: string;
  onStartQuiz: (studentName: string) => void;
  onCancel?: () => void;
}

export const StudentEntryModal: React.FC<StudentEntryModalProps> = ({
  isOpen,
  quiz,
  schoolName,
  className,
  onStartQuiz,
  onCancel,
}) => {
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Em vui lòng nhập họ và tên của mình nhé!');
      return;
    }

    sound.playSuccess();
    onStartQuiz(studentName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden my-auto text-center">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 p-6 text-white relative">
          <div className="w-16 h-16 rounded-3xl bg-white text-3xl flex items-center justify-center mx-auto shadow-md mb-2">
            🎒
          </div>
          <h2 className="text-xl md:text-2xl font-black text-amber-950">
            Chào Mừng Em Đến Với Bài Tập!
          </h2>
          <p className="text-xs md:text-sm font-semibold text-amber-900 mt-1">
            Hãy điền họ và tên để bắt đầu làm bài và ghi tên lên Bảng vàng nhé
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left">
          {/* Pre-filled School & Class badges */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <School className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Trường: <strong>{schoolName || 'Trường Tiểu học'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shrink-0">
                L
              </span>
              <span>Lớp: <strong className="text-amber-800 font-black text-sm">{className || '5A1'}</strong> • Khối: {quiz.grade}</span>
            </div>
            <div className="pt-1 text-xs text-slate-600 border-t border-amber-200/80 flex items-center justify-between">
              <span>Đề: <strong>{quiz.title}</strong></span>
              <span className="flex items-center gap-1 font-bold text-amber-800">
                <Clock className="w-3.5 h-3.5" /> {quiz.durationMinutes} phút
              </span>
            </div>
          </div>

          {/* Student Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Nhập Họ và Tên của em *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5 text-amber-500" />
              </div>
              <input
                type="text"
                autoFocus
                required
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ví dụ: Nguyễn Gia Huy, Trần Bảo An..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-200/60 outline-none text-base font-bold text-slate-800 transition-all placeholder:text-slate-400 bg-white"
              />
            </div>
            {error && (
              <p className="text-xs font-bold text-red-600 mt-1">{error}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
              >
                Quay lại
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm md:text-base shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>BẮT ĐẦU LÀM BÀI NGAY</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
