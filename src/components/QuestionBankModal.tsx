import React, { useState } from 'react';
import { QuizData, GradeLevel, Subject, TeacherUser } from '../types/quiz';
import { QUESTION_BANK } from '../data/questionBank';
import { 
  BookOpen, 
  Share2, 
  Play, 
  Printer, 
  X, 
  Search, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  Trash2, 
  PlusCircle,
  Filter,
  User,
  AlertTriangle
} from 'lucide-react';
import { sound } from '../utils/sound';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuiz: (quiz: QuizData) => void;
  onShareQuiz: (quiz: QuizData) => void;
  onPrintQuiz: (quiz: QuizData) => void;
  customQuizzes?: QuizData[];
  onDeleteCustomQuiz?: (quizId: string) => void;
  onOpenCreateModal?: () => void;
  currentTeacher?: TeacherUser | null;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  onSelectQuiz,
  onShareQuiz,
  onPrintQuiz,
  customQuizzes = [],
  onDeleteCustomQuiz,
  onOpenCreateModal,
  currentTeacher,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('Lớp 5');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'standard' | 'custom'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quizToDelete, setQuizToDelete] = useState<QuizData | null>(null);

  if (!isOpen) return null;

  // Combine standard quizzes with custom teacher quizzes (custom quizzes first so teachers see their newest work)
  const combinedQuizzes = [...customQuizzes, ...QUESTION_BANK];

  const filteredQuizzes = combinedQuizzes.filter((q) => {
    if (q.grade !== selectedGrade) return false;
    if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;
    
    if (sourceFilter === 'standard' && q.isCustom) return false;
    if (sourceFilter === 'custom' && !q.isCustom) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(term);
      const matchCode = q.quizCode?.toLowerCase().includes(term);
      const matchSummary = q.summary?.toLowerCase().includes(term);
      const matchAuthor = q.authorName?.toLowerCase().includes(term);
      if (!matchTitle && !matchCode && !matchSummary && !matchAuthor) return false;
    }
    return true;
  });

  const totalGradeQuizzes = combinedQuizzes.filter((q) => q.grade === selectedGrade);
  const totalCustomInGrade = totalGradeQuizzes.filter((q) => q.isCustom).length;
  const totalStandardInGrade = totalGradeQuizzes.length - totalCustomInGrade;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border-2 border-amber-300 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 p-5 md:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-sm">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black">Ngân Hàng Đề Thi Chuẩn Tiểu Học</h2>
                {customQuizzes.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-200 text-amber-950 border border-white/50">
                    +{customQuizzes.length} đề GV mới bổ sung
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-amber-100">
                Kho đề bài chuẩn chương trình GDPT và các đề thi do giáo viên tuyển chọn, lưu bổ sung
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCreateModal && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onClose();
                  onOpenCreateModal();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-amber-900 hover:bg-amber-100 font-extrabold text-xs shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-600" />
                <span>Tạo Đề Bổ Sung</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grade tabs */}
        <div className="bg-amber-50/70 p-3 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Grade Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['Lớp 5', 'Lớp 4', 'Lớp 3', 'Lớp 2', 'Lớp 1'] as GradeLevel[]).map((gr) => (
              <button
                key={gr}
                onClick={() => {
                  sound.playClick();
                  setSelectedGrade(gr);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  selectedGrade === gr
                    ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                    : 'bg-white text-slate-700 hover:bg-amber-100/60 border border-amber-200'
                }`}
              >
                {gr}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên bài, mã đề..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-amber-200 focus:border-amber-500 text-xs font-bold bg-white outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Secondary Filter: Subjects & Sources */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Subjects */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Môn:</span>
            {(['all', 'Toán', 'Tiếng Việt', 'Khoa học', 'Lịch sử và Địa lí'] as (Subject | 'all')[]).map((subj) => (
              <button
                key={subj}
                onClick={() => {
                  sound.playClick();
                  setSelectedSubject(subj);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  selectedSubject === subj
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {subj === 'all' ? 'Tất cả' : subj}
              </button>
            ))}
          </div>

          {/* Source Filter Tabs */}
          <div className="flex items-center gap-1 bg-amber-100/70 p-1 rounded-xl border border-amber-200 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                setSourceFilter('all');
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                sourceFilter === 'all'
                  ? 'bg-white text-amber-950 shadow-2xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Tất cả ({totalGradeQuizzes.length})
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setSourceFilter('standard');
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                sourceFilter === 'standard'
                  ? 'bg-white text-amber-950 shadow-2xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Chuẩn BGD ({totalStandardInGrade})
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setSourceFilter('custom');
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                sourceFilter === 'custom'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              ✨ Đề GV tạo ({totalCustomInGrade})
            </button>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1">
          {filteredQuizzes.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="text-4xl">📭</div>
              <div className="font-bold text-sm text-slate-600">
                Không tìm thấy đề bài nào trong khối {selectedGrade} môn {selectedSubject}.
              </div>
              {sourceFilter === 'custom' && onOpenCreateModal && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    onOpenCreateModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tạo đề mới để lưu bổ sung vào Ngân hàng ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className={`p-4 rounded-3xl border-2 transition-all shadow-xs flex flex-col justify-between space-y-3 group ${
                    quiz.isCustom
                      ? 'border-amber-300 bg-amber-50/20 hover:border-amber-500'
                      : 'border-slate-200 hover:border-amber-400 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          {quiz.quizCode || 'DE'}
                        </span>
                        {quiz.isCustom && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> GV Biên Soạn
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {quiz.subject} • {quiz.totalQuestions} câu
                      </span>
                    </div>

                    <h4 className="font-black text-slate-800 text-sm md:text-base group-hover:text-amber-900 transition-colors line-clamp-2">
                      {quiz.title}
                    </h4>

                    {quiz.summary && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {quiz.summary}
                      </p>
                    )}

                    {quiz.authorName && (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-amber-800">
                        <User className="w-3 h-3" />
                        <span>Biên soạn: {quiz.authorName}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          onPrintQuiz(quiz);
                          onClose();
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Xem và in trang A4"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {(() => {
                        const isMyCustomQuiz = Boolean(
                          quiz.isCustom &&
                          currentTeacher &&
                          (!quiz.authorEmail || quiz.authorEmail.toLowerCase().trim() === currentTeacher.email.toLowerCase().trim())
                        );

                        if (isMyCustomQuiz && onDeleteCustomQuiz) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setQuizToDelete(quiz);
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Xóa đề này khỏi ngân hàng đề của bạn"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          );
                        }

                        return null;
                      })()}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          onShareQuiz(quiz);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Giao Cho Lớp
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sound.playSuccess();
                          onSelectQuiz(quiz);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Làm Bài
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Khối <strong>{selectedGrade}</strong>: Tổng cộng <strong>{filteredQuizzes.length}</strong> đề thi ({totalStandardInGrade} đề chuẩn BGD, {totalCustomInGrade} đề GV tạo mới)
          </div>
          <div className="flex items-center gap-2">
            {onOpenCreateModal && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onClose();
                  onOpenCreateModal();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Tạo Đề Mới Bổ Sung</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Delete Custom Quiz */}
      {quizToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border-2 border-red-200 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Xác nhận xóa đề thi?</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Thầy/Cô có chắc chắn muốn xóa đề <strong className="text-red-600">"{quizToDelete.title}"</strong> (Mã: {quizToDelete.quizCode}) khỏi Ngân hàng đề của mình không?
              </p>
            </div>
            <div className="flex items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setQuizToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  if (onDeleteCustomQuiz) {
                    onDeleteCustomQuiz(quizToDelete.id);
                  }
                  setQuizToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-extrabold text-xs hover:bg-red-700 transition-colors shadow-md shadow-red-200 cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
