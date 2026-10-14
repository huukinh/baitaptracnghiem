import React, { useState, useRef } from 'react';
import { GradeLevel, Subject, QuestionDifficulty, QuestionType, QuizData } from '../types/quiz';
import { SAMPLE_QUIZZES } from '../data/sampleQuizzes';
import { UploadCloud, FileText, Image as ImageIcon, Sparkles, X, Check, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { sound } from '../utils/sound';

interface QuizCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizGenerated: (quiz: QuizData, saveToBank?: boolean) => void;
}

export const QuizCreatorModal: React.FC<QuizCreatorModalProps> = ({
  isOpen,
  onClose,
  onQuizGenerated,
}) => {
  const [grade, setGrade] = useState<GradeLevel>('Lớp 5');
  const [subject, setSubject] = useState<Subject>('Toán');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('Tổng hợp 4 mức độ');
  const [questionType, setQuestionType] = useState<QuestionType>('all');
  const [topicHint, setTopicHint] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [saveToBank, setSaveToBank] = useState<boolean>(true);

  // Uploaded file state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    mimeType: string;
    base64: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playClick();
    setErrorMessage('');

    // Check size limit: max 20MB
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File tải lên vượt quá 20MB. Vui lòng chọn file nhẹ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setUploadedFile({
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        base64: base64Data,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    sound.playClick();
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    sound.playClick();
    setIsLoading(true);
    setErrorMessage('');
    setLoadingStep('Đang chuẩn bị dữ liệu và tài liệu tải lên...');

    try {
      setTimeout(() => setLoadingStep('Đang phân tích kiến thức theo chuẩn chương trình Tiểu học...'), 1500);
      setTimeout(() => setLoadingStep('Đang soạn thảo các câu hỏi, đáp án và lời giải chi tiết...'), 3500);

      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade,
          subject,
          numQuestions,
          difficulty,
          questionType,
          textContent,
          topicHint,
          fileData: uploadedFile
            ? {
                base64: uploadedFile.base64,
                mimeType: uploadedFile.mimeType,
                fileName: uploadedFile.name,
              }
            : null,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.quiz) {
        throw new Error(data.error || 'Không thể tạo đề trắc nghiệm. Vui lòng thử lại.');
      }

      sound.playSuccess();
      const generatedQuiz: QuizData = {
        ...data.quiz,
        id: `quiz-gen-${Date.now()}`,
        grade: grade,
        subject: subject,
        createdAt: new Date().toISOString(),
      };

      onQuizGenerated(generatedQuiz, saveToBank);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSelectSample = (sample: QuizData) => {
    sound.playSuccess();
    onQuizGenerated(sample);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 p-5 md:p-6 flex items-center justify-between text-amber-950 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center text-2xl">
              ✨
            </span>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-amber-950">
                Tạo Đề Trắc Nghiệm Thông Minh
              </h2>
              <p className="text-xs md:text-sm font-medium text-amber-900">
                Tự động tạo câu hỏi từ file PDF, Word, hình ảnh hoặc chủ đề bài học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6">
          {/* Quick sample banner */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" /> Hoặc chọn nhanh đề mẫu sẵn có:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_QUIZZES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="px-3 py-2 text-left rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50 text-xs font-bold text-slate-800 transition-colors shadow-2xs flex flex-col cursor-pointer"
                >
                  <span className="text-amber-800 font-extrabold">{sample.grade} - {sample.subject}</span>
                  <span className="text-slate-500 font-medium truncate">{sample.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Upload File Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Tải lên tài liệu (PDF, Word .docx, Hình ảnh sách/vở)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {!uploadedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-8 h-8 text-amber-600" />
                </div>
                <div className="font-bold text-slate-800 text-sm md:text-base">
                  Bấm để chọn file hoặc kéo thả file vào đây
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Hỗ trợ định dạng: <strong>PDF, Word (.docx), Ảnh chụp sách bài tập (JPG, PNG)</strong>
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border-2 border-amber-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold">
                    {uploadedFile.mimeType.includes('pdf') ? (
                      <FileText className="w-5 h-5 text-red-600" />
                    ) : uploadedFile.mimeType.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-700" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm truncate max-w-xs md:max-w-md">
                      {uploadedFile.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* 2. Topic / Text Prompt Optional */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Hoặc nhập nội dung / chủ đề bài học trực tiếp (Tuỳ chọn)
            </label>
            <textarea
              rows={2}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Ví dụ: Bài 45: Hình thang và diện tích hình thang; hoặc dán đoạn văn bản cần tạo câu hỏi..."
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm text-slate-800 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* 3. Dropdown Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {/* Grade Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Khối lớp
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeLevel)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-white font-bold text-sm text-slate-800 outline-none cursor-pointer"
              >
                <option value="Lớp 5">Lớp 5 (Chuẩn cuối cấp)</option>
                <option value="Lớp 4">Lớp 4</option>
                <option value="Lớp 3">Lớp 3</option>
                <option value="Lớp 2">Lớp 2</option>
                <option value="Lớp 1">Lớp 1</option>
              </select>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Môn học
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-white font-bold text-sm text-slate-800 outline-none cursor-pointer"
              >
                <option value="Toán">Toán</option>
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="Khoa học">Khoa học</option>
                <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                <option value="Đạo đức">Đạo đức</option>
                <option value="Tin học">Tin học</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
              </select>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Số lượng câu hỏi
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-white font-bold text-sm text-slate-800 outline-none cursor-pointer"
              >
                <option value={5}>5 câu (Khởi động nhanh)</option>
                <option value={10}>10 câu (Tiêu chuẩn)</option>
                <option value={15}>15 câu (Đầy đủ)</option>
                <option value={20}>20 câu (Khảo sát toàn diện)</option>
              </select>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Mức độ câu hỏi
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-white font-bold text-sm text-slate-800 outline-none cursor-pointer"
              >
                <option value="Tổng hợp 4 mức độ">Tổng hợp 4 mức độ (Chuẩn TT 27/22)</option>
                <option value="Mức 1 (Nhận biết)">Mức 1: Nhận biết</option>
                <option value="Mức 2 (Thông hiểu)">Mức 2: Thông hiểu</option>
                <option value="Mức 3 (Vận dụng)">Mức 3: Vận dụng</option>
                <option value="Mức 4 (Vận dụng cao)">Mức 4: Vận dụng cao</option>
              </select>
            </div>

            {/* Question Type Selection */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Dạng trắc nghiệm
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-white font-bold text-sm text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">🌟 Đa dạng đủ các dạng (A,B,C,D + Nối cột + Điền khuyết + Đúng/Sai)</option>
                <option value="multiple_choice">Trắc nghiệm 4 lựa chọn (A, B, C, D)</option>
                <option value="matching">Nối 2 cột (Ghép vế tương ứng)</option>
                <option value="fill_blank">Điền từ / số vào chỗ chấm (...)</option>
                <option value="true_false">Đúng / Sai (Đ / S)</option>
              </select>
            </div>
          </div>

          {/* 4. Option: Lưu bổ sung vào ngân hàng đề */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center text-base shrink-0">
                📚
              </div>
              <div>
                <span className="text-xs font-black text-amber-950 block">
                  Lưu bổ sung vào Ngân hàng đề của trường
                </span>
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Tự động phân loại vào <strong>{grade}</strong> • Môn <strong>{subject}</strong> để tái sử dụng & giao cho các lớp
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={saveToBank}
                onChange={(e) => setSaveToBank(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Hỗ trợ chuẩn phông chữ tiếng Việt & kí hiệu toán học tiểu học
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl font-bold text-slate-700 hover:bg-slate-200 transition-colors text-sm cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-md shadow-amber-300/60 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{loadingStep || 'Đang tạo câu hỏi...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-white/30" />
                  <span>Tạo Đề Trắc Nghiệm Ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
