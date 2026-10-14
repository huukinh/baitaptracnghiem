import React, { useState, useEffect } from 'react';
import { QuizData, UserAnswers } from '../types/quiz';
import { QuestionCard } from './QuestionCard';
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  AlertTriangle,
  Printer,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { sound } from '../utils/sound';

interface QuizPlayerProps {
  quiz: QuizData;
  onFinishQuiz: (answers: UserAnswers, timeSpentSeconds: number) => void;
  onOpenPrint: () => void;
  onNewQuiz: () => void;
  isSavedInBank?: boolean;
  onSaveToBank?: (quiz: QuizData) => void;
  userRole?: 'teacher' | 'student';
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  onFinishQuiz,
  onOpenPrint,
  isSavedInBank = false,
  onSaveToBank,
  userRole = 'student',
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  // Track which questions have their answers revealed by the user
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  // Timer interval
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;

  const handleAnswerChange = (answer: any) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  // Toggle answer & explanation for THIS current question
  const isCurrentAnswerRevealed = !!revealedAnswers[currentQuestion?.id];

  const handleToggleAnswer = () => {
    if (!currentQuestion) return;
    const nextState = !isCurrentAnswerRevealed;
    sound.playClick();
    setRevealedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: nextState,
    }));
  };

  // Switch to next question
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      sound.playClick();
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowSubmitConfirm(true);
    }
  };

  // Switch to previous question
  const handlePrev = () => {
    if (currentIndex > 0) {
      sound.playClick();
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isQuestionAnswered = (qId: string) => {
    const ans = userAnswers[qId];
    if (ans === undefined || ans === null || ans === '') return false;
    if (typeof ans === 'object') {
      return Object.keys(ans).length > 0;
    }
    return true;
  };

  const answeredCount = quiz.questions.filter((q) => isQuestionAnswered(q.id)).length;

  const confirmSubmit = () => {
    sound.playSuccess();
    setShowSubmitConfirm(false);
    onFinishQuiz(userAnswers, timeSpent);
  };

  // Format time
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn">
      {/* Top Header Status: Progress & Controls */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-amber-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
              {quiz.grade}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-800 border border-orange-300">
              {quiz.subject}
            </span>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              • Đang làm câu {currentIndex + 1} / {totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{formatTimer(timeSpent)}</span>
            </div>

            {/* Save to Bank button/indicator for teacher */}
            {userRole === 'teacher' && (
              isSavedInBank ? (
                <span
                  title="Đề này đã có trong Ngân hàng đề của trường"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã lưu vào Ngân Hàng Đề</span>
                </span>
              ) : onSaveToBank ? (
                <button
                  onClick={() => onSaveToBank(quiz)}
                  type="button"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-extrabold text-xs transition-colors cursor-pointer"
                  title="Lưu bổ sung đề này vào Ngân hàng đề của trường"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Lưu Vào Ngân Hàng Đề</span>
                </button>
              ) : null
            )}

            {/* Quick Print Button */}
            <button
              onClick={onOpenPrint}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              title="In đề ra giấy A4"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">In A4</span>
            </button>

            {/* Quick Submit */}
            <button
              onClick={() => setShowSubmitConfirm(true)}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Nộp Bài</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Dots */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
            <span className="text-amber-800 font-extrabold">
              Câu {currentIndex + 1} trên {totalQuestions}
            </span>
            <span className="text-slate-500">
              Đã làm {answeredCount}/{totalQuestions} câu ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Compact question dot pills for quick glance */}
          <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-amber-100">
            {quiz.questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = isQuestionAnswered(q.id);

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setCurrentIndex(idx);
                  }}
                  className={`h-6 rounded-lg text-[11px] font-extrabold px-2 transition-all cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-xs'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                  title={`Câu ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SINGLE QUESTION CARD DISPLAY */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          index={currentIndex}
          totalQuestions={totalQuestions}
          userAnswer={userAnswers[currentQuestion.id]}
          onAnswerChange={handleAnswerChange}
          showReviewMode={isCurrentAnswerRevealed}
        />
      )}

      {/* TWO CORE ACTION BUTTONS: [NÚT ĐÁP ÁN] & [NÚT CHUYỂN CÂU HỎI] */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Previous button */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          type="button"
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Câu Trước</span>
        </button>

        {/* NÚT ĐÁP ÁN CHO CÂU HỎI ĐÓ */}
        <button
          onClick={handleToggleAnswer}
          type="button"
          className={`w-full sm:w-auto flex-1 max-w-sm flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-sm md:text-base border-2 transition-all cursor-pointer shadow-sm ${
            isCurrentAnswerRevealed
              ? 'bg-amber-100 border-amber-400 text-amber-950 hover:bg-amber-200'
              : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-transparent shadow-sky-200'
          }`}
        >
          {isCurrentAnswerRevealed ? (
            <>
              <EyeOff className="w-5 h-5 text-amber-700" />
              <span>Ẩn Đáp Án Câu Này</span>
            </>
          ) : (
            <>
              <Eye className="w-5 h-5 text-white" />
              <span>Xem Đáp Án & Lời Giải 💡</span>
            </>
          )}
        </button>

        {/* NÚT CHUYỂN CÂU HỎI */}
        {currentIndex === totalQuestions - 1 ? (
          <button
            onClick={() => setShowSubmitConfirm(true)}
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm md:text-base shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <span>Hoàn Thành & Nộp Bài</span>
            <CheckCircle className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm md:text-base shadow-md shadow-amber-300 transition-all cursor-pointer"
          >
            <span>Chuyển Câu Tiếp Theo</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-amber-300 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center text-3xl">
              🎯
            </div>

            <h3 className="text-xl font-black text-slate-800">
              Em có muốn nộp bài ngay?
            </h3>

            <div className="bg-amber-50 rounded-2xl p-4 text-sm text-slate-700 space-y-1">
              <div>Đã hoàn thành: <strong className="text-emerald-700">{answeredCount}/{totalQuestions}</strong> câu</div>
              {totalQuestions - answeredCount > 0 && (
                <div className="text-amber-800 font-bold flex items-center justify-center gap-1.5 mt-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Còn {totalQuestions - answeredCount} câu chưa làm xong!
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Sau khi nộp bài, hệ thống sẽ tính điểm tổng kết và hiển thị đánh giá chi tiết cho em.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors text-sm cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={confirmSubmit}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
