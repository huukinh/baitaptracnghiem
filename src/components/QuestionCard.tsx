import React, { useState } from 'react';
import { QuizQuestion } from '../types/quiz';
import { MathText } from './MathText';
import { 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Link as LinkIcon, 
  RotateCcw,
  Check,
  HelpCircle
} from 'lucide-react';
import { sound } from '../utils/sound';

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  totalQuestions: number;
  userAnswer: any;
  onAnswerChange: (answer: any) => void;
  showReviewMode?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  totalQuestions,
  userAnswer,
  onAnswerChange,
  showReviewMode = false,
}) => {
  const [showHint, setShowHint] = useState(false);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);

  // Level badge color
  const getLevelColor = (level: string) => {
    if (level.includes('1')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (level.includes('2')) return 'bg-sky-100 text-sky-800 border-sky-300';
    if (level.includes('3')) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-purple-100 text-purple-800 border-purple-300';
  };

  // Multiple Choice handler
  const handleOptionSelect = (optionId: string) => {
    sound.playPop();
    onAnswerChange(optionId);
  };

  // Matching handler
  const currentMatchingAnswers: Record<string, string> = userAnswer || {};

  const handleLeftClick = (leftId: string) => {
    sound.playClick();
    if (selectedLeftId === leftId) {
      setSelectedLeftId(null);
    } else {
      setSelectedLeftId(leftId);
    }
  };

  const handleRightClick = (rightText: string) => {
    if (!selectedLeftId) return;
    sound.playPop();
    const updated = { ...currentMatchingAnswers, [selectedLeftId]: rightText };
    onAnswerChange(updated);
    setSelectedLeftId(null);
  };

  const handleRemoveMatch = (leftId: string) => {
    sound.playClick();
    const updated = { ...currentMatchingAnswers };
    delete updated[leftId];
    onAnswerChange(updated);
  };

  const handleResetMatching = () => {
    sound.playClick();
    onAnswerChange({});
    setSelectedLeftId(null);
  };

  // True/False handler
  const currentTfAnswers: Record<string, boolean> = userAnswer || {};
  const handleTfSelect = (statementId: string, val: boolean) => {
    sound.playPop();
    const updated = { ...currentTfAnswers, [statementId]: val };
    onAnswerChange(updated);
  };

  // Check correctness of current answer for feedback
  const isAnswerCorrect = (): boolean | null => {
    if (userAnswer === undefined || userAnswer === null || userAnswer === '') return null;

    if (question.type === 'multiple_choice') {
      return userAnswer === question.correctAnswer;
    }
    if (question.type === 'matching' && question.matchingPairs) {
      const total = question.matchingPairs.length;
      let correct = 0;
      question.matchingPairs.forEach((p) => {
        if (userAnswer[p.id] === p.right) correct++;
      });
      return correct === total;
    }
    if (question.type === 'fill_blank' && question.acceptableAnswers) {
      const cleanUser = String(userAnswer).trim().toLowerCase();
      return question.acceptableAnswers.some(
        (acc) => acc.trim().toLowerCase() === cleanUser
      );
    }
    if (question.type === 'true_false' && question.tfStatements) {
      const total = question.tfStatements.length;
      let correct = 0;
      question.tfStatements.forEach((s) => {
        if (userAnswer[s.id] === s.isTrue) correct++;
      });
      return correct === total;
    }
    return null;
  };

  const isCorrect = isAnswerCorrect();

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-amber-200/80 transition-all duration-300">
      {/* Header of Question */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-amber-100">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-extrabold text-lg flex items-center justify-center shadow-sm shadow-amber-300/50">
            {index + 1}
          </span>
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Câu hỏi {index + 1} trên {totalQuestions}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getLevelColor(question.level)}`}>
                {question.level}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {question.points ? `${question.points} điểm` : '1 điểm'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {question.hint && (
            <button
              onClick={() => {
                sound.playClick();
                setShowHint(!showHint);
              }}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý cô giáo'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Hint box */}
      {showHint && question.hint && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-sm flex items-start gap-3 animate-fadeIn">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-800 mb-0.5">Cô giáo gợi ý em nhé:</div>
            <p className="leading-relaxed">{question.hint}</p>
          </div>
        </div>
      )}

      {/* Question prompt */}
      <div className="my-6">
        <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
          <MathText text={question.question} />
        </h3>
      </div>

      {/* QUESTION BODY BY TYPE */}

      {/* 1. Multiple Choice */}
      {question.type === 'multiple_choice' && question.options && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {question.options.map((opt) => {
            const isSelected = userAnswer === opt.id;
            const isTargetCorrect = showReviewMode && question.correctAnswer === opt.id;
            const isWrongSelected = showReviewMode && isSelected && question.correctAnswer !== opt.id;

            let buttonStyles = 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 bg-white text-slate-800';

            if (showReviewMode) {
              if (isTargetCorrect) {
                buttonStyles = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-400 shadow-sm';
              } else if (isWrongSelected) {
                buttonStyles = 'border-red-400 bg-red-50 text-red-950 ring-2 ring-red-300';
              } else {
                buttonStyles = 'border-slate-200 bg-slate-50/60 text-slate-500 opacity-70';
              }
            } else if (isSelected) {
              buttonStyles = 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-400/80 shadow-sm';
            }

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleOptionSelect(opt.id)}
                className={`group flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${buttonStyles}`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                    showReviewMode && isTargetCorrect
                      ? 'bg-emerald-600 text-white'
                      : isSelected
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-amber-200 group-hover:text-amber-900'
                  }`}
                >
                  {opt.id}
                </span>
                <div className="pt-1.5 flex-1 text-base leading-relaxed">
                  <MathText text={opt.text} />
                  {showReviewMode && isTargetCorrect && (
                    <div className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Đáp án đúng
                    </div>
                  )}
                  {showReviewMode && isWrongSelected && (
                    <div className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Lựa chọn của em
                    </div>
                  )}
                </div>
                {showReviewMode && isTargetCorrect && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 self-center" />
                )}
                {showReviewMode && isWrongSelected && (
                  <XCircle className="w-6 h-6 text-red-500 shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Matching (Nối Cột) */}
      {question.type === 'matching' && question.matchingPairs && (
        <div className="pt-2 space-y-4">
          <div className="p-3 bg-sky-50 text-sky-800 rounded-2xl text-xs md:text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-sky-600" />
              Cách làm: Bấm chọn 1 ô ở <strong>Cột A</strong>, sau đó bấm chọn ô tương ứng ở <strong>Cột B</strong> để ghép nối!
            </span>
            {Object.keys(currentMatchingAnswers).length > 0 && (
              <button
                onClick={handleResetMatching}
                type="button"
                className="flex items-center gap-1 text-xs text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Làm lại nối
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column A */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Cột A</div>
              {question.matchingPairs.map((pair, idx) => {
                const isSelected = selectedLeftId === pair.id;
                const matchedRight = currentMatchingAnswers[pair.id];

                return (
                  <div
                    key={pair.id}
                    onClick={() => handleLeftClick(pair.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
                        : matchedRight
                        ? 'border-emerald-400 bg-emerald-50/60'
                        : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="font-semibold text-slate-800 text-sm md:text-base pt-0.5">
                          <MathText text={pair.left} />
                        </div>
                      </div>
                      {matchedRight && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMatch(pair.id);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50"
                        >
                          Gỡ
                        </button>
                      )}
                    </div>

                    {matchedRight && (
                      <div className="mt-2 pl-9 text-xs flex items-center gap-1 text-emerald-800 font-bold">
                        <span>➜ Đã nối với:</span>
                        <span className="bg-emerald-200/80 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                          {matchedRight}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Column B */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Cột B</div>
              {question.matchingPairs.map((pair, idx) => {
                const isMatched = Object.values(currentMatchingAnswers).includes(pair.right);

                return (
                  <div
                    key={`right-${idx}`}
                    onClick={() => handleRightClick(pair.right)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedLeftId
                        ? 'border-blue-400 bg-blue-50/40 hover:bg-blue-100 hover:border-blue-600'
                        : isMatched
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div className="font-semibold text-slate-800 text-sm md:text-base pt-0.5">
                        <MathText text={pair.right} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Correct Matching Summary when revealed */}
          {showReviewMode && (
            <div className="mt-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-sm">
              <div className="font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Các cặp ghép nối chính xác:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.matchingPairs.map((pair, pIdx) => (
                  <div key={pair.id} className="p-2 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {pIdx + 1}. <MathText text={pair.left} />
                    </span>
                    <span className="text-emerald-700 font-black mx-2">➜</span>
                    <span className="font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                      <MathText text={pair.right} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Fill in the Blank */}
      {question.type === 'fill_blank' && (
        <div className="pt-2 space-y-4">
          {question.blankText && (
            <div className="p-4 md:p-5 rounded-2xl bg-amber-50/60 border border-amber-200 text-slate-800 text-base md:text-lg leading-relaxed">
              <MathText text={question.blankText} highlightBlank={true} />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Nhập đáp án của em vào đây:
            </label>
            <div className="relative">
              <input
                type="text"
                value={userAnswer || ''}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="Gõ từ hoặc số thích hợp..."
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-200/60 outline-none text-base md:text-lg font-semibold text-slate-800 transition-all placeholder:text-slate-400 bg-white"
              />
            </div>
          </div>

          {/* Correct answer display when revealed */}
          {showReviewMode && question.acceptableAnswers && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-sm">
              <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đáp án chính xác cần điền:
              </div>
              <div className="text-base font-black text-emerald-800">
                {question.acceptableAnswers.join(' hoặc ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. True / False */}
      {question.type === 'true_false' && question.tfStatements && (
        <div className="pt-2 space-y-3">
          {question.tfStatements.map((item, idx) => {
            const currentVal = currentTfAnswers[item.id];

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-300 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {String.fromCharCode(97 + idx)}
                  </span>
                  <div className="font-semibold text-slate-800 text-sm md:text-base">
                    <MathText text={item.statement} />
                    {showReviewMode && (
                      <span className={`ml-2 text-xs font-extrabold px-2 py-0.5 rounded-md inline-block ${
                        item.isTrue ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        [Đáp án đúng: {item.isTrue ? 'Đúng (Đ)' : 'Sai (S)'}]
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTfSelect(item.id, true)}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold border-2 transition-all cursor-pointer ${
                      currentVal === true
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 hover:border-emerald-400 bg-slate-50 text-slate-700'
                    }`}
                  >
                    Đúng (Đ)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTfSelect(item.id, false)}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold border-2 transition-all cursor-pointer ${
                      currentVal === false
                        ? 'border-red-600 bg-red-600 text-white shadow-sm'
                        : 'border-slate-200 hover:border-red-400 bg-slate-50 text-slate-700'
                    }`}
                  >
                    Sai (S)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Answer & Explanation Box when showReviewMode is TRUE */}
      {showReviewMode && (
        <div className="mt-6 p-5 rounded-3xl bg-gradient-to-br from-amber-50/80 via-sky-50/60 to-emerald-50/60 border-2 border-amber-300 text-slate-900 animate-fadeIn">
          {/* Quick status message */}
          {isCorrect !== null && (
            <div className={`mb-3 p-3 rounded-2xl flex items-center gap-2 text-sm font-extrabold ${
              isCorrect
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-orange-100 text-orange-950 border border-orange-300'
            }`}>
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>🎉 Hoan hô! Em đã trả lời rất chính xác!</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-5 h-5 text-orange-600 shrink-0" />
                  <span>💡 Chưa hoàn toàn chính xác. Em xem lời giải chi tiết dưới đây để hiểu bài nhé:</span>
                </>
              )}
            </div>
          )}

          {question.explanation && (
            <div>
              <div className="font-extrabold text-amber-900 flex items-center gap-2 mb-2 text-base">
                <span className="text-xl">📖</span> Lời giải chi tiết & Ghi nhớ kiến thức:
              </div>
              <p className="text-sm md:text-base leading-relaxed text-slate-800 bg-white/80 p-4 rounded-2xl border border-amber-200">
                <MathText text={question.explanation} />
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
