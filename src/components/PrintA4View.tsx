import React, { useState } from 'react';
import { QuizData } from '../types/quiz';
import { MathText } from './MathText';
import { exportQuizToWord } from '../utils/exportWord';
import { Printer, Download, Eye, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/sound';

interface PrintA4ViewProps {
  quiz: QuizData;
  onBack: () => void;
}

export const PrintA4View: React.FC<PrintA4ViewProps> = ({ quiz, onBack }) => {
  const [includeAnswers, setIncludeAnswers] = useState<boolean>(false);

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  const handleExportWord = () => {
    sound.playClick();
    exportQuizToWord(quiz, includeAnswers);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 md:px-6">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại làm bài
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Answer Key */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIncludeAnswers(!includeAnswers);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold border-2 transition-all cursor-pointer ${
              includeAnswers
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                : 'bg-slate-50 border-slate-300 text-slate-700'
            }`}
          >
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>{includeAnswers ? 'Đang bật: Kèm Đáp Án & Lời Giải' : 'Chế độ: Đề Bài Học Sinh Làm'}</span>
          </button>

          {/* Export to Word Button */}
          <button
            type="button"
            onClick={handleExportWord}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Tải File Word (.doc)
          </button>

          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs md:text-sm shadow-md shadow-amber-300 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> In Trang A4 / Lưu PDF
          </button>
        </div>
      </div>

      {/* A4 Document Preview Sheet */}
      <div
        id="printable-a4-sheet"
        className="max-w-[210mm] mx-auto bg-white p-8 md:p-12 shadow-lg border border-slate-300 text-black font-serif print:p-0 print:border-none print:shadow-none print:max-w-none"
        style={{ minHeight: '297mm' }}
      >
        {/* Header School / Info */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-black text-center mb-6">
          <div className="text-left space-y-1">
            <div className="font-bold text-xs uppercase">TRƯỜNG TIỂU HỌC: .................................................</div>
            <div className="font-bold text-xs uppercase">LỚP: .................... KHỐI: {quiz.grade.toUpperCase()}</div>
          </div>
          <div className="text-right space-y-1">
            <div className="font-bold text-xs uppercase">BÀI TẬP TRẮC NGHIỆM ĐỊNH KỲ</div>
            <div className="font-bold text-xs uppercase">
              MÔN: <span className="underline">{quiz.subject.toUpperCase()}</span>
            </div>
            <div className="text-[11px] italic text-slate-700">
              Thời gian làm bài: {quiz.durationMinutes} phút
            </div>
          </div>
        </div>

        {/* Student Name & Score Table */}
        <div className="border border-black grid grid-cols-3 mb-6 divide-x divide-black text-xs">
          <div className="p-2 space-y-2 col-span-2">
            <div>
              <strong>Họ và tên học sinh:</strong> ............................................................................
            </div>
            <div>
              <strong>Ngày làm bài:</strong> {new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-black text-center">
            <div className="p-2 flex flex-col justify-between">
              <span className="font-bold">ĐIỂM</span>
              <span className="h-8"></span>
            </div>
            <div className="p-2 flex flex-col justify-between">
              <span className="font-bold">LỜI PHÊ</span>
              <span className="h-8"></span>
            </div>
          </div>
        </div>

        {/* Quiz Title */}
        <div className="text-center mb-6">
          <h2 className="text-base md:text-lg font-bold uppercase tracking-wide">
            {quiz.title}
          </h2>
          {includeAnswers && (
            <div className="text-xs font-bold text-emerald-800 uppercase mt-1">
              (HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT DÀNH CHO GIÁO VIÊN / PHỤ HUYNH)
            </div>
          )}
        </div>

        {/* Questions list */}
        <div className="space-y-6 text-sm leading-relaxed">
          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="break-inside-avoid">
              {/* Question header */}
              <div className="font-bold mb-1.5 flex items-start gap-1">
                <span>Câu {idx + 1} ({q.level}):</span>
                <span className="font-normal flex-1">
                  <MathText text={q.question} />
                </span>
              </div>

              {/* Multiple Choice Options */}
              {q.type === 'multiple_choice' && q.options && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-4 pt-1">
                  {q.options.map((opt) => (
                    <div key={opt.id} className="flex items-start gap-2">
                      <span className={`font-bold ${includeAnswers && opt.id === q.correctAnswer ? 'text-emerald-700 underline font-black' : ''}`}>
                        {opt.id}.
                      </span>
                      <span className={includeAnswers && opt.id === q.correctAnswer ? 'font-bold text-emerald-900' : ''}>
                        <MathText text={opt.text} />
                        {includeAnswers && opt.id === q.correctAnswer && (
                          <span className="text-xs text-emerald-700 font-bold ml-1.5">[✓ Đáp án]</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Matching */}
              {q.type === 'matching' && q.matchingPairs && (
                <div className="pl-2 pt-1">
                  <table className="w-full border border-black border-collapse text-xs my-2">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1.5 text-left w-1/2">Cột A</th>
                        <th className="border border-black p-1.5 text-left w-1/2">Cột B</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.matchingPairs.map((pair, pIdx) => (
                        <tr key={pair.id}>
                          <td className="border border-black p-1.5">
                            <strong>{pIdx + 1}.</strong> <MathText text={pair.left} />
                          </td>
                          <td className="border border-black p-1.5">
                            <strong>{String.fromCharCode(65 + pIdx)}.</strong> <MathText text={pair.right} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!includeAnswers ? (
                    <div className="italic text-xs text-slate-700 mt-1">
                      Em ghép nối: 1 - ..... ; 2 - ..... ; 3 - ..... ; 4 - .....
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-800 font-bold mt-1">
                      Đáp án nối đúng: {q.matchingPairs.map((_, pIdx) => `${pIdx + 1} nối với ${String.fromCharCode(65 + pIdx)}`).join(' ; ')}
                    </div>
                  )}
                </div>
              )}

              {/* Fill Blank */}
              {q.type === 'fill_blank' && q.blankText && (
                <div className="pl-4 pt-1">
                  <div className="p-2 border-l-2 border-black bg-slate-50 italic text-xs">
                    <MathText text={q.blankText} highlightBlank={true} />
                  </div>
                  {includeAnswers && q.acceptableAnswers && (
                    <div className="text-xs text-emerald-800 font-bold mt-1">
                      Từ/số cần điền: <u>{q.acceptableAnswers.join(' hoặc ')}</u>
                    </div>
                  )}
                </div>
              )}

              {/* True/False */}
              {q.type === 'true_false' && q.tfStatements && (
                <div className="pl-2 pt-1">
                  <table className="w-full border border-black border-collapse text-xs my-2">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1.5 text-left">Ý kiến / Phát biểu</th>
                        <th className="border border-black p-1.5 text-center w-14">Đúng</th>
                        <th className="border border-black p-1.5 text-center w-14">Sai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.tfStatements.map((tf, tIdx) => (
                        <tr key={tf.id}>
                          <td className="border border-black p-1.5">
                            {String.fromCharCode(97 + tIdx)}) <MathText text={tf.statement} />
                          </td>
                          <td className="border border-black p-1.5 text-center font-bold">
                            {includeAnswers && tf.isTrue ? '✓ Đ' : ''}
                          </td>
                          <td className="border border-black p-1.5 text-center font-bold">
                            {includeAnswers && !tf.isTrue ? '✓ S' : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Explanation (if Answer Key enabled) */}
              {includeAnswers && q.explanation && (
                <div className="mt-2 p-2 bg-emerald-50/70 border-l-2 border-emerald-600 text-xs text-emerald-950">
                  <strong className="text-emerald-900">Giải thích chi tiết:</strong>{' '}
                  <MathText text={q.explanation} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-black text-center text-xs italic">
          --- Chúc các em học sinh làm bài thật tốt! ---
        </div>
      </div>
    </div>
  );
};
