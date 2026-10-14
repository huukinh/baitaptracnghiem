import React, { useState } from 'react';
import { QuizData, Classroom, TeacherUser } from '../types/quiz';
import { Share2, Copy, Check, ExternalLink, School, QrCode, MessageSquare, X, Plus } from 'lucide-react';
import { sound } from '../utils/sound';

interface ShareAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizData;
  classes: Classroom[];
  onOpenCreateClass: () => void;
  onLaunchStudentQuizWithDetails: (quiz: QuizData, schoolName: string, className: string) => void;
  currentTeacher?: TeacherUser | null;
}

export const ShareAssignmentModal: React.FC<ShareAssignmentModalProps> = ({
  isOpen,
  onClose,
  quiz,
  classes,
  onOpenCreateClass,
  onLaunchStudentQuizWithDetails,
  currentTeacher,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0] || {
    schoolName: 'Trường Tiểu học Hoài Nhơn Nam',
    className: '5A1',
    grade: quiz.grade,
  };

  // Generate shareable URL with teacher identification
  const origin = window.location.origin;
  const teacherEmailVal = currentClass.teacherEmail || currentTeacher?.email || quiz.authorEmail || '';
  const shareUrl = `${origin}/?quizId=${quiz.id}&code=${quiz.quizCode || 'DE5'}&school=${encodeURIComponent(currentClass.schoolName)}&class=${encodeURIComponent(currentClass.className)}&grade=${encodeURIComponent(quiz.grade)}&teacher=${encodeURIComponent(teacherEmailVal)}&role=student`;

  // Pre-written parent message
  const parentNoticeMessage = `📢 BÀI TẬP VỀ NHÀ - LỚP ${currentClass.className}
🏫 ${currentClass.schoolName}
📚 Môn: ${quiz.subject} (${quiz.grade})
📝 Đề bài: ${quiz.title}

Kính gửi Quý Phụ huynh,
Thầy/Cô gửi bài tập trắc nghiệm ôn tập cho các em học sinh. Phụ huynh vui lòng mở đường link dưới đây để con làm bài tập trực tiếp trên điện thoại hoặc máy tính:
👉 Link làm bài: ${shareUrl}

(Các em học sinh chỉ cần nhập Họ và Tên là có thể bắt đầu làm bài. Sau khi hoàn thành, kết quả sẽ tự động lưu vào Bảng vàng thành tích của Thầy/Cô).
Chúc các em làm bài đạt kết quả tốt nhất! ✨`;

  const handleCopyLink = () => {
    sound.playSuccess();
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    sound.playSuccess();
    navigator.clipboard.writeText(parentNoticeMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-emerald-300 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-sm">
              📤
            </div>
            <div>
              <h2 className="text-xl font-black">Chia Sẻ Bài Tập Cho Phụ Huynh & Học Sinh</h2>
              <p className="text-xs text-emerald-100">
                Giao bài tập về nhà làm trên điện thoại, máy tính bảng hoặc máy tính
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Step 1: Select Classroom */}
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <School className="w-4 h-4 text-emerald-600" /> 1. Chọn Lớp Nhận Bài Tập:
              </label>
              <button
                type="button"
                onClick={onOpenCreateClass}
                className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo lớp học mới
              </button>
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 bg-white font-bold text-sm text-slate-800 outline-none cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.className} - {c.schoolName} ({c.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Quiz Badge */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md">
                Mã đề: {quiz.quizCode || 'DE5'}
              </span>
              <div className="font-extrabold text-slate-800 text-sm mt-1">
                {quiz.title}
              </div>
              <div className="text-xs text-slate-500">
                {quiz.grade} • Môn {quiz.subject} • {quiz.totalQuestions} câu hỏi • Thời gian: {quiz.durationMinutes} phút
              </div>
            </div>
          </div>

          {/* Step 2: Shareable Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Đường dẫn làm bài trực tiếp cho học sinh:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-emerald-200 bg-white text-xs font-semibold text-slate-700 truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã sao chép!' : 'Sao chép link'}</span>
              </button>
            </div>
          </div>

          {/* Step 3: Message to copy to Zalo / Facebook */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" /> 3. Tin nhắn mẫu gửi nhóm Zalo / Phụ huynh:
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedMessage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMessage ? 'Đã chép tin nhắn!' : 'Sao chép cả tin nhắn'}</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={5}
              value={parentNoticeMessage}
              className="w-full p-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 leading-relaxed resize-none focus:outline-none"
            />
          </div>

          {/* Direct Student Launch from here */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Học sinh truy cập sẽ tự động nhận đúng <strong>{currentClass.schoolName}</strong> - <strong>Lớp {currentClass.className}</strong>
            </span>

            <button
              type="button"
              onClick={() => {
                sound.playSuccess();
                onLaunchStudentQuizWithDetails(quiz, currentClass.schoolName, currentClass.className);
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Thử làm bài ngay với vai Học sinh</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
