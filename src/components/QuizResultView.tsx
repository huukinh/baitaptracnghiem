import React, { useEffect } from 'react';
import { QuizData, UserAnswers } from '../types/quiz';
import { QuestionCard } from './QuestionCard';
import confetti from 'canvas-confetti';
import { RotateCcw, Printer, PlusCircle, Award, CheckCircle2, XCircle, Clock, Trophy, BookOpen, Share2 } from 'lucide-react';
import { sound } from '../utils/sound';

interface QuizResultViewProps {
  quiz: QuizData;
  userAnswers: UserAnswers;
  timeSpentSeconds: number;
  onRetry: () => void;
  onNewQuiz: () => void;
  onOpenPrint: () => void;
  onOpenLeaderboard?: () => void;
  isSavedInBank?: boolean;
  onSaveToBank?: (quiz: QuizData) => void;
  onOpenShare?: (quiz: QuizData) => void;
  userRole?: 'teacher' | 'student';
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  quiz,
  userAnswers,
  timeSpentSeconds,
  onRetry,
  onNewQuiz,
  onOpenPrint,
  onOpenLeaderboard,
  isSavedInBank = false,
  onSaveToBank,
  onOpenShare,
  userRole = 'student',
}) => {
  // Calculate score
  let correctCount = 0;

  quiz.questions.forEach((q) => {
    const userAns = userAnswers[q.id];

    if (q.type === 'multiple_choice') {
      if (userAns && userAns === q.correctAnswer) {
        correctCount++;
      }
    } else if (q.type === 'matching' && q.matchingPairs) {
      if (userAns && typeof userAns === 'object') {
        const totalPairs = q.matchingPairs.length;
        let matchedRight = 0;
        q.matchingPairs.forEach((pair) => {
          if (userAns[pair.id] === pair.right) {
            matchedRight++;
          }
        });
        if (matchedRight === totalPairs) {
          correctCount++;
        }
      }
    } else if (q.type === 'fill_blank' && q.acceptableAnswers) {
      if (userAns && typeof userAns === 'string') {
        const cleanUser = userAns.trim().toLowerCase();
        const isMatch = q.acceptableAnswers.some(
          (acc) => acc.trim().toLowerCase() === cleanUser
        );
        if (isMatch) correctCount++;
      }
    } else if (q.type === 'true_false' && q.tfStatements) {
      if (userAns && typeof userAns === 'object') {
        const totalStmts = q.tfStatements.length;
        let correctStmts = 0;
        q.tfStatements.forEach((stmt) => {
          if (userAns[stmt.id] === stmt.isTrue) {
            correctStmts++;
          }
        });
        if (correctStmts === totalStmts) {
          correctCount++;
        }
      }
    }
  });

  const totalQuestions = quiz.questions.length;
  const score10 = Number(((correctCount / totalQuestions) * 10).toFixed(1));

  useEffect(() => {
    sound.playSuccess();
    // Confetti effect
    if (score10 >= 7) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'],
        });
      } catch {}
    }
  }, [score10]);

  // Format time
  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;
  const timeFormatted = `${minutes > 0 ? `${minutes} phút ` : ''}${seconds} giây`;

  // Cheerful praise
  const getPraise = () => {
    if (score10 === 10) {
      return {
        badge: '🏆 XUẤT SẮC TUYỆT ĐỐI!',
        message: 'Tuyệt vời quá! Em đã hoàn thành xuất sắc 100% câu hỏi! Em xứng đáng nhận danh hiệu Trạng Nguyên nhí!',
        color: 'from-amber-400 to-orange-500 text-white',
      };
    }
    if (score10 >= 8) {
      return {
        badge: '🌟 HỌC SINH GIỎI!',
        message: 'Giỏi lắm! Em nắm rất vững kiến thức và trả lời đúng hầu hết các câu hỏi. Tiếp tục phát huy nhé!',
        color: 'from-emerald-400 to-teal-500 text-white',
      };
    }
    if (score10 >= 6) {
      return {
        badge: '👏 KHÁ TỐT - CỐ GẮNG LÊN!',
        message: 'Em đã nỗ lực rất tốt! Hãy xem lại phần giải thích chi tiết ở các câu chưa chính xác để nhớ bài lâu hơn nhé!',
        color: 'from-sky-400 to-blue-500 text-white',
      };
    }
    return {
      badge: '💪 ĐỪNG NẢN LÒNG NHÉ!',
      message: 'Không sao cả, mỗi lần làm bài là một lần học hỏi. Em hãy đọc kỹ từng lời giải của cô giáo bên dưới để làm tốt hơn ở lần sau nhé!',
      color: 'from-rose-400 to-amber-500 text-white',
    };
  };

  const praise = getPraise();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Celebration Banner */}
      <div className={`p-6 md:p-8 rounded-3xl bg-gradient-to-r ${praise.color} shadow-lg text-white`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <span className="inline-block px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
              {praise.badge}
            </span>
            <h2 className="text-2xl md:text-3xl font-black">
              Chúc Mừng Em Đã Hoàn Thành Bài Tập!
            </h2>
            <p className="text-white/95 text-sm md:text-base max-w-xl leading-relaxed">
              {praise.message}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-md p-6 rounded-3xl min-w-[160px] border border-white/30 text-center">
            <span className="text-xs uppercase font-bold text-white/90">Điểm số</span>
            <div className="text-5xl font-black tracking-tight my-1">
              {score10}
            </div>
            <span className="text-xs font-semibold text-white/80">Thang điểm 10</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-6 pt-5 border-t border-white/20 grid grid-cols-3 gap-2 text-center text-xs md:text-sm">
          <div className="flex flex-col items-center">
            <span className="text-white/80 font-medium">Số câu đúng</span>
            <span className="font-extrabold text-base md:text-lg flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              {correctCount} / {totalQuestions}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white/80 font-medium">Tỉ lệ chính xác</span>
            <span className="font-extrabold text-base md:text-lg mt-0.5">
              {Math.round((correctCount / totalQuestions) * 100)}%
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white/80 font-medium">Thời gian</span>
            <span className="font-extrabold text-base md:text-lg flex items-center gap-1 mt-0.5">
              <Clock className="w-4 h-4" />
              {timeFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => {
            sound.playClick();
            onRetry();
          }}
          type="button"
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300 font-extrabold text-sm shadow-sm transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-amber-600" /> Làm Lại Bài Này
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenPrint();
          }}
          type="button"
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md shadow-blue-300/50 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" /> In Trang A4 / Tải File Word
        </button>

        {userRole === 'teacher' && onOpenShare && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenShare(quiz);
            }}
            type="button"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-300/50 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Giao Đề Cho Học Sinh
          </button>
        )}

        {userRole === 'teacher' && (
          isSavedInBank ? (
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-300 font-extrabold text-sm shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã Lưu Trong Ngân Hàng Đề
            </div>
          ) : onSaveToBank ? (
            <button
              onClick={() => {
                sound.playSuccess();
                onSaveToBank(quiz);
              }}
              type="button"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300 font-extrabold text-sm shadow-sm transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-700" /> Lưu Vào Ngân Hàng Đề
            </button>
          ) : null
        )}

        <button
          onClick={() => {
            sound.playClick();
            onNewQuiz();
          }}
          type="button"
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-md shadow-amber-300/50 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Tạo Đề Trắc Nghiệm Mới
        </button>

        {onOpenLeaderboard && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            type="button"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-black text-sm shadow-md shadow-yellow-300/50 transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-yellow-200 fill-yellow-200" /> Xem Bảng Vàng Thành Tích
          </button>
        )}
      </div>

      {/* Detailed Question Review Header */}
      <div className="pt-4">
        <div className="flex items-center justify-between pb-4 border-b border-amber-200">
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-black text-slate-800">
              Chi Tiết Từng Câu Hỏi & Lời Giải Thích
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Kèm hướng dẫn giải chi tiết cho từng câu
          </span>
        </div>

        {/* List of Question Cards in Review Mode */}
        <div className="space-y-6 mt-6">
          {quiz.questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              totalQuestions={quiz.questions.length}
              userAnswer={userAnswers[q.id]}
              onAnswerChange={() => {}}
              showReviewMode={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
