import React, { useState } from 'react';
import { StudentSubmission, TeacherUser, GradeLevel, Subject } from '../types/quiz';
import { 
  Trophy, 
  Medal, 
  Award, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Calendar, 
  Clock, 
  User, 
  School, 
  CheckCircle2, 
  Sparkles,
  ArrowUpDown,
  GraduationCap,
  MessageSquare,
  BarChart3,
  Check,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { sound } from '../utils/sound';

interface LeaderboardViewProps {
  submissions: StudentSubmission[];
  currentTeacher: TeacherUser | null;
  onBack: () => void;
  onUpdateFeedback?: (submissionId: string, feedback: string) => void;
  onDeleteByQuizCode?: (quizCode: string) => Promise<void> | void;
  onDeleteSubmission?: (submissionId: string) => Promise<void> | void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  submissions,
  currentTeacher,
  onBack,
  onUpdateFeedback,
  onDeleteByQuizCode,
  onDeleteSubmission,
}) => {
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterQuizCode, setFilterQuizCode] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCodeDeleteDialog, setShowCodeDeleteDialog] = useState<boolean>(false);
  const [codeToDelete, setCodeToDelete] = useState<string>('');
  const [subToDelete, setSubToDelete] = useState<StudentSubmission | null>(null);

  // Editing feedback inline
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // STRICT TEACHER ISOLATION: A logged-in teacher ONLY sees submissions belonging to their account
  const teacherSubmissions = currentTeacher
    ? submissions.filter((s) => {
        const teacherEmailNorm = (currentTeacher.email || '').toLowerCase().trim();
        const subEmailNorm = (s.teacherEmail || '').toLowerCase().trim();
        return subEmailNorm === teacherEmailNorm;
      })
    : submissions;

  // Filter list
  const filteredSubmissions = teacherSubmissions.filter((s) => {
    if (filterGrade !== 'all' && s.grade !== filterGrade) return false;
    if (filterClass !== 'all' && s.className !== filterClass) return false;
    if (filterSubject !== 'all' && s.subject !== filterSubject) return false;
    if (filterQuizCode !== 'all' && s.quizCode !== filterQuizCode) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = s.studentName.toLowerCase().includes(term);
      const matchSchool = s.schoolName.toLowerCase().includes(term);
      const matchQuiz = s.quizTitle.toLowerCase().includes(term);
      if (!matchName && !matchSchool && !matchQuiz) return false;
    }
    return true;
  });

  // Extract distinct classes and quiz codes for dropdowns based strictly on this teacher's classes
  const distinctClasses = Array.from(new Set(teacherSubmissions.map((s) => s.className))).filter(Boolean);
  const distinctQuizCodes = Array.from(new Set(teacherSubmissions.map((s) => s.quizCode))).filter(Boolean);

  // Sort by score DESC, then timeSpentSeconds ASC
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeSpentSeconds - b.timeSpentSeconds;
  });

  // Statistics calculation
  const totalSubmissions = sortedSubmissions.length;
  const avgScore = totalSubmissions > 0
    ? (sortedSubmissions.reduce((acc, curr) => acc + curr.score, 0) / totalSubmissions).toFixed(1)
    : '0';

  // Academic performance distribution
  const countExcellent = sortedSubmissions.filter((s) => s.score >= 9).length; // 9 - 10
  const countGood = sortedSubmissions.filter((s) => s.score >= 8 && s.score < 9).length; // 8 - 8.9
  const countFair = sortedSubmissions.filter((s) => s.score >= 6.5 && s.score < 8).length; // 6.5 - 7.9
  const countAverage = sortedSubmissions.filter((s) => s.score < 6.5).length; // < 6.5

  const percentExcellent = totalSubmissions > 0 ? Math.round((countExcellent / totalSubmissions) * 100) : 0;
  const percentGood = totalSubmissions > 0 ? Math.round((countGood / totalSubmissions) * 100) : 0;
  const percentFair = totalSubmissions > 0 ? Math.round((countFair / totalSubmissions) * 100) : 0;
  const percentAverage = totalSubmissions > 0 ? Math.round((countAverage / totalSubmissions) * 100) : 0;

  const handleExportCSV = () => {
    sound.playClick();
    const headers = ['Thứ hạng', 'Họ và tên', 'Trường', 'Lớp', 'Khối', 'Môn học', 'Mã đề', 'Tên đề thi', 'Điểm số', 'Số câu đúng', 'Thời gian làm bài', 'Đánh giá / Nhận xét của giáo viên', 'Ngày nộp'];
    const rows = sortedSubmissions.map((s, idx) => [
      idx + 1,
      `"${s.studentName}"`,
      `"${s.schoolName}"`,
      `"${s.className}"`,
      `"${s.grade}"`,
      `"${s.subject}"`,
      `"${s.quizCode}"`,
      `"${s.quizTitle}"`,
      s.score,
      `${s.correctCount}/${s.totalQuestions}`,
      `${Math.floor(s.timeSpentSeconds / 60)}p ${s.timeSpentSeconds % 60}s`,
      `"${s.teacherFeedback || ''}"`,
      new Date(s.submittedAt).toLocaleDateString('vi-VN'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Vang_Thong_Ke_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  const handleSaveFeedback = (subId: string) => {
    sound.playSuccess();
    if (onUpdateFeedback) {
      onUpdateFeedback(subId, editingText.trim());
    }
    setEditingSubId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Banner with Teacher Profile */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-amber-100">
              <Trophy className="w-4 h-4 text-amber-200 fill-amber-300" /> Bảng Vàng & Quản Lý Đánh Giá Học Sinh
            </div>
            <h2 className="text-2xl md:text-3xl font-black">
              Thống Kê Thành Tích Làm Bài
            </h2>
            {currentTeacher ? (
              <p className="text-xs md:text-sm text-amber-100 flex items-center gap-2 justify-center md:justify-start">
                <GraduationCap className="w-4 h-4 text-white" />
                <span>Giáo viên quản lý: <strong>{currentTeacher.fullName}</strong> • {currentTeacher.schoolName}</span>
              </p>
            ) : (
              <p className="text-xs md:text-sm text-amber-100">
                Theo dõi kết quả làm bài tập trực tuyến của các lớp được giao đề
              </p>
            )}
          </div>

          {/* Quick stats in banner */}
          <div className="grid grid-cols-3 gap-2 bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/30 text-center min-w-[280px]">
            <div>
              <div className="text-2xl font-black">{totalSubmissions}</div>
              <div className="text-[10px] uppercase font-bold text-amber-100">Lượt nộp bài</div>
            </div>
            <div>
              <div className="text-2xl font-black">{avgScore}</div>
              <div className="text-[10px] uppercase font-bold text-amber-100">Điểm Trung bình</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-200">{countExcellent}</div>
              <div className="text-[10px] uppercase font-bold text-amber-100">Xuất sắc (9-10)</div>
            </div>
          </div>
        </div>
      </div>

      {/* TEACHER ASSESSMENT ANALYTICS CARD */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-amber-200 space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-100">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-amber-600" /> Thống kê & Đánh giá phân loại học lực:
          </span>

          {currentTeacher && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                <span>Bảng vàng riêng của Thầy/Cô: {currentTeacher.fullName}</span>
              </span>
            </div>
          )}
        </div>

        {/* Analytics Distribution Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="text-xs font-black text-amber-900 uppercase">Xuất Sắc (9 - 10)</div>
            <div className="text-2xl font-black text-amber-600 my-1">{countExcellent} <span className="text-xs font-normal text-slate-500">em</span></div>
            <div className="text-[11px] font-bold text-amber-800">{percentExcellent}% tổng số</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="text-xs font-black text-emerald-900 uppercase">Giỏi (8 - 8.9)</div>
            <div className="text-2xl font-black text-emerald-600 my-1">{countGood} <span className="text-xs font-normal text-slate-500">em</span></div>
            <div className="text-[11px] font-bold text-emerald-800">{percentGood}% tổng số</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="text-xs font-black text-blue-900 uppercase">Khá (6.5 - 7.9)</div>
            <div className="text-2xl font-black text-blue-600 my-1">{countFair} <span className="text-xs font-normal text-slate-500">em</span></div>
            <div className="text-[11px] font-bold text-blue-800">{percentFair}% tổng số</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="text-xs font-black text-rose-900 uppercase">Cần Cố Gắng (&lt; 6.5)</div>
            <div className="text-2xl font-black text-rose-600 my-1">{countAverage} <span className="text-xs font-normal text-slate-500">em</span></div>
            <div className="text-[11px] font-bold text-rose-800">{percentAverage}% tổng số</div>
          </div>
        </div>

        {/* Progress bar visual */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${percentExcellent}%` }} className="bg-amber-400" title={`Xuất sắc: ${percentExcellent}%`} />
          <div style={{ width: `${percentGood}%` }} className="bg-emerald-500" title={`Giỏi: ${percentGood}%`} />
          <div style={{ width: `${percentFair}%` }} className="bg-blue-500" title={`Khá: ${percentFair}%`} />
          <div style={{ width: `${percentAverage}%` }} className="bg-rose-400" title={`Cần cố gắng: ${percentAverage}%`} />
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-amber-200 space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-amber-100">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-amber-600" /> Bộ lọc theo khối, lớp, môn, mã đề:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {/* Delete by Quiz Code Action - Only for authenticated teachers */}
            {currentTeacher && onDeleteByQuizCode && distinctQuizCodes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCodeToDelete(filterQuizCode !== 'all' ? filterQuizCode : (distinctQuizCodes[0] || ''));
                  setShowCodeDeleteDialog(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-extrabold text-xs transition-colors cursor-pointer"
                title="Xóa kết quả bài làm theo mã đề trên tài khoản của bạn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {filterQuizCode !== 'all' ? `Xóa Bảng Vàng Mã Đề [${filterQuizCode}]` : 'Xóa Bảng Vàng Theo Mã Đề'}
                </span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Xuất Excel / CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> In Bảng Vàng
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Filter Grade */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Khối Lớp</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 font-bold text-slate-800 bg-white outline-none cursor-pointer"
            >
              <option value="all">Tất cả Khối lớp</option>
              <option value="Lớp 5">Lớp 5</option>
              <option value="Lớp 4">Lớp 4</option>
              <option value="Lớp 3">Lớp 3</option>
              <option value="Lớp 2">Lớp 2</option>
              <option value="Lớp 1">Lớp 1</option>
            </select>
          </div>

          {/* Filter Class */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Lớp Học</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 font-bold text-slate-800 bg-white outline-none cursor-pointer"
            >
              <option value="all">Tất cả Lớp</option>
              {distinctClasses.map((cls) => (
                <option key={cls} value={cls}>Lớp {cls}</option>
              ))}
            </select>
          </div>

          {/* Filter Subject */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Môn Học</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 font-bold text-slate-800 bg-white outline-none cursor-pointer"
            >
              <option value="all">Tất cả Môn học</option>
              <option value="Toán">Toán</option>
              <option value="Tiếng Việt">Tiếng Việt</option>
              <option value="Khoa học">Khoa học</option>
              <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
            </select>
          </div>

          {/* Filter Quiz Code */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Mã Đề Thi</label>
            <select
              value={filterQuizCode}
              onChange={(e) => setFilterQuizCode(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 font-bold text-slate-800 bg-white outline-none cursor-pointer"
            >
              <option value="all">Tất cả Mã đề</option>
              {distinctQuizCodes.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          {/* Search student name */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Tìm Tên Học Sinh</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm học sinh..."
                className="w-full p-2.5 pl-8 rounded-xl border-2 border-slate-200 focus:border-amber-500 font-bold text-slate-800 bg-white outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* TOP 3 HONOR PODIUM */}
      {sortedSubmissions.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 print:hidden">
          {/* 2nd Place */}
          <div className="order-2 md:order-1 bg-gradient-to-b from-slate-100 to-white p-5 rounded-3xl border-2 border-slate-200 text-center flex flex-col items-center justify-between shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-200 text-2xl flex items-center justify-center mb-2 shadow-inner">
              🥈
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-800">
              Á Quân #2
            </span>
            <div className="font-black text-slate-800 text-base mt-2">
              {sortedSubmissions[1].studentName}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Lớp {sortedSubmissions[1].className} • {sortedSubmissions[1].schoolName}
            </div>
            <div className="mt-3 text-3xl font-black text-slate-700">
              {sortedSubmissions[1].score} <span className="text-xs font-bold text-slate-400">điểm</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {sortedSubmissions[1].quizCode} • {Math.floor(sortedSubmissions[1].timeSpentSeconds / 60)} phút
            </div>
          </div>

          {/* 1st Place */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-100 via-amber-50 to-white p-6 rounded-3xl border-3 border-amber-400 text-center flex flex-col items-center justify-between shadow-md relative -translate-y-1">
            <span className="absolute -top-3.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-sm">
              🏆 QUÁN QUÂN #1
            </span>
            <div className="w-16 h-16 rounded-full bg-amber-300 text-3xl flex items-center justify-center my-2 shadow-sm">
              🥇
            </div>
            <div className="font-black text-amber-950 text-lg">
              {sortedSubmissions[0].studentName}
            </div>
            <div className="text-xs text-amber-800 font-bold">
              Lớp {sortedSubmissions[0].className} • {sortedSubmissions[0].schoolName}
            </div>
            <div className="mt-3 text-4xl font-black text-amber-600">
              {sortedSubmissions[0].score} <span className="text-xs font-bold text-amber-800">điểm</span>
            </div>
            <div className="text-[11px] text-amber-900 font-semibold mt-1">
              Đúng {sortedSubmissions[0].correctCount}/{sortedSubmissions[0].totalQuestions} câu • {sortedSubmissions[0].quizCode}
            </div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 bg-gradient-to-b from-amber-50 to-white p-5 rounded-3xl border-2 border-amber-200 text-center flex flex-col items-center justify-between shadow-xs">
            <div className="w-12 h-12 rounded-full bg-orange-200 text-2xl flex items-center justify-center mb-2 shadow-inner">
              🥉
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-900">
              Hạng Ba #3
            </span>
            <div className="font-black text-slate-800 text-base mt-2">
              {sortedSubmissions[2].studentName}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Lớp {sortedSubmissions[2].className} • {sortedSubmissions[2].schoolName}
            </div>
            <div className="mt-3 text-3xl font-black text-orange-600">
              {sortedSubmissions[2].score} <span className="text-xs font-bold text-slate-400">điểm</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {sortedSubmissions[2].quizCode} • {Math.floor(sortedSubmissions[2].timeSpentSeconds / 60)} phút
            </div>
          </div>
        </div>
      )}

      {/* FULL LEADERBOARD TABLE WITH TEACHER ASSESSMENT FEEDBACK */}
      <div className="bg-white rounded-3xl border-2 border-amber-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-amber-50/60 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-black text-amber-950 text-sm">
              Danh Sách Học Sinh & Đánh Giá ({sortedSubmissions.length} lượt nộp)
            </span>
            <p className="text-[11px] text-slate-500">
              Giáo viên có thể trực tiếp viết nhận xét sư phạm cho từng học sinh vào cột bên phải.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-amber-200">
            Sắp xếp theo Điểm ➔ Thời gian
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider border-b border-slate-200">
                <th className="p-3.5 text-center w-12">Hạng</th>
                <th className="p-3.5">Họ và tên học sinh</th>
                <th className="p-3.5">Trường & Lớp</th>
                <th className="p-3.5">Khối & Môn</th>
                <th className="p-3.5">Mã đề thi</th>
                <th className="p-3.5 text-center">Điểm số</th>
                <th className="p-3.5 text-center">Đúng</th>
                <th className="p-3.5 text-center">Thời gian</th>
                <th className="p-3.5 min-w-[200px]">Nhận xét & Đánh giá của Thầy/Cô</th>
                {currentTeacher && onDeleteSubmission && <th className="p-3.5 text-center w-12 print:hidden">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={currentTeacher && onDeleteSubmission ? 10 : 9} className="p-10 text-center text-slate-400 font-semibold">
                    Không tìm thấy bài nộp nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedSubmissions.map((sub, idx) => {
                  const rank = idx + 1;
                  let rankBadge = `${rank}`;
                  if (rank === 1) rankBadge = '🥇 #1';
                  if (rank === 2) rankBadge = '🥈 #2';
                  if (rank === 3) rankBadge = '🥉 #3';

                  let scoreColor = 'text-slate-800 bg-slate-100';
                  if (sub.score === 10) scoreColor = 'text-amber-900 bg-amber-100 font-black';
                  else if (sub.score >= 8) scoreColor = 'text-emerald-900 bg-emerald-100 font-bold';
                  else if (sub.score >= 6.5) scoreColor = 'text-blue-900 bg-blue-100 font-bold';
                  else scoreColor = 'text-red-900 bg-red-100 font-bold';

                  const minutes = Math.floor(sub.timeSpentSeconds / 60);
                  const seconds = sub.timeSpentSeconds % 60;
                  const isEditing = editingSubId === sub.id;

                  return (
                    <tr key={sub.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3.5 text-center font-black text-slate-700">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs ${
                          rank === 1 ? 'bg-amber-300 text-amber-950 font-black' :
                          rank === 2 ? 'bg-slate-200 text-slate-800 font-black' :
                          rank === 3 ? 'bg-orange-200 text-orange-950 font-black' : 'text-slate-500'
                        }`}>
                          {rankBadge}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{sub.studentName}</span>
                          {sub.score === 10 && (
                            <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                              Xuất sắc
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">Lớp {sub.className}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px]">{sub.schoolName}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{sub.subject}</span>
                        <div className="text-[11px] text-slate-500">{sub.grade}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {sub.quizCode}
                        </span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{sub.quizTitle}</div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-xl text-sm ${scoreColor}`}>
                          {sub.score}
                        </span>
                      </td>

                      <td className="p-3.5 text-center font-bold text-slate-700">
                        {sub.correctCount}/{sub.totalQuestions}
                      </td>

                      <td className="p-3.5 text-center text-slate-600 font-semibold">
                        {minutes > 0 ? `${minutes}p ` : ''}{seconds}s
                      </td>

                      {/* Teacher Evaluation & Feedback column */}
                      <td className="p-3.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 animate-fadeIn">
                            <input
                              type="text"
                              autoFocus
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              placeholder="Nhập lời khen hoặc dặn dò..."
                              className="flex-1 px-2.5 py-1 rounded-lg border-2 border-amber-400 text-xs font-semibold text-slate-800 outline-none bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveFeedback(sub.id)}
                              className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                              title="Lưu nhận xét"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="group flex items-start justify-between gap-1.5">
                            <span className={`text-xs leading-relaxed ${sub.teacherFeedback ? 'text-slate-800 font-medium italic' : 'text-slate-400'}`}>
                              {sub.teacherFeedback ? `"${sub.teacherFeedback}"` : 'Chưa có nhận xét'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setEditingSubId(sub.id);
                                setEditingText(sub.teacherFeedback || '');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-700 transition-opacity cursor-pointer shrink-0"
                              title="Viết nhận xét cho học sinh"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Delete individual submission - only allowed if owned by currentTeacher */}
                      {currentTeacher && onDeleteSubmission && (
                        <td className="p-3.5 text-center print:hidden">
                          {(() => {
                            const isMySub = Boolean(
                              sub.teacherEmail &&
                              currentTeacher.email &&
                              sub.teacherEmail.trim().toLowerCase() === currentTeacher.email.trim().toLowerCase()
                            );

                            if (isMySub) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    sound.playClick();
                                    setSubToDelete(sub);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                                  title="Xóa kết quả bài làm này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              );
                            }

                            return (
                              <span
                                className="text-[11px] text-slate-300 font-mono"
                                title="Bảng vàng mặc định hệ thống hoặc lớp khác, không thể xóa"
                              >
                                🔒
                              </span>
                            );
                          })()}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: XÓA THEO MÃ ĐỀ */}
      {showCodeDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-red-300 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Xóa Bảng Vàng Theo Mã Đề</h3>
                <p className="text-xs text-slate-500">Chọn mã đề thi cần xóa toàn bộ kết quả bài nộp của học sinh</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Chọn mã đề cần xóa:</label>
              <select
                value={codeToDelete}
                onChange={(e) => setCodeToDelete(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-slate-200 focus:border-red-500 font-bold text-xs bg-white outline-none cursor-pointer"
              >
                <option value="">-- Bấm chọn mã đề --</option>
                {distinctQuizCodes.map((code) => {
                  const count = teacherSubmissions.filter((s) => s.quizCode === code).length;
                  return (
                    <option key={code} value={code}>
                      Mã đề: {code} ({count} học sinh nộp bài)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Hành động này sẽ xóa toàn bộ điểm số của các em học sinh thuộc mã đề <strong>[{codeToDelete || '...'}]</strong> trên tài khoản của Thầy/Cô. Kết quả sau khi xóa không thể khôi phục.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCodeDeleteDialog(false);
                  setCodeToDelete('');
                }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={!codeToDelete}
                onClick={async () => {
                  if (!codeToDelete) return;
                  sound.playClick();
                  if (onDeleteByQuizCode) {
                    await onDeleteByQuizCode(codeToDelete);
                  }
                  if (filterQuizCode === codeToDelete) {
                    setFilterQuizCode('all');
                  }
                  setShowCodeDeleteDialog(false);
                  setCodeToDelete('');
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Xác Nhận Xóa Mã Đề
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XÓA TỪNG BÀI LÀM */}
      {subToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-red-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl">
              🗑️
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-800">
                Xóa Kết Quả Bài Làm?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Học sinh: <strong>{subToDelete.studentName}</strong> (Lớp {subToDelete.className}) • Mã đề: <strong>{subToDelete.quizCode}</strong> ({subToDelete.score} điểm)
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  sound.playClick();
                  if (onDeleteSubmission) {
                    await onDeleteSubmission(subToDelete.id);
                  }
                  setSubToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition-colors cursor-pointer"
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
