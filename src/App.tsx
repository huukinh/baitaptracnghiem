/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QuizData, UserAnswers, UserRole, Classroom, StudentSubmission, TeacherUser } from './types/quiz';
import { SAMPLE_QUIZZES } from './data/sampleQuizzes';
import { QUESTION_BANK } from './data/questionBank';
import { Header } from './components/Header';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResultView } from './components/QuizResultView';
import { PrintA4View } from './components/PrintA4View';
import { QuizCreatorModal } from './components/QuizCreatorModal';
import { ClassroomManagerModal } from './components/ClassroomManagerModal';
import { ShareAssignmentModal } from './components/ShareAssignmentModal';
import { QuestionBankModal } from './components/QuestionBankModal';
import { StudentEntryModal } from './components/StudentEntryModal';
import { LeaderboardView } from './components/LeaderboardView';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { sound } from './utils/sound';
import { 
  UploadCloud, 
  BookOpen, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Share2, 
  Trophy, 
  School, 
  User, 
  GraduationCap,
  Play,
  LogIn
} from 'lucide-react';

export default function App() {
  const [currentQuiz, setCurrentQuiz] = useState<QuizData>(QUESTION_BANK[0]);
  const [quizState, setQuizState] = useState<'taking' | 'result' | 'print' | 'leaderboard'>('taking');
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Teacher authentication state
  const [currentTeacher, setCurrentTeacher] = useState<TeacherUser | null>(() => {
    try {
      const saved = localStorage.getItem('saved_teacher');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isTeacherAuthModalOpen, setIsTeacherAuthModalOpen] = useState<boolean>(false);

  // Student identification
  const [studentName, setStudentName] = useState<string>('');
  const [studentSchool, setStudentSchool] = useState<string>('Trường Tiểu học Hoài Nhơn Nam');
  const [studentClass, setStudentClass] = useState<string>('5A1');
  const [assignmentTeacherEmail, setAssignmentTeacherEmail] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState<boolean>(false);
  const [isStudentEntryModalOpen, setIsStudentEntryModalOpen] = useState<boolean>(false);

  // Custom Quizzes Bank (saved/supplemented by teachers)
  const [customQuizzes, setCustomQuizzes] = useState<QuizData[]>(() => {
    try {
      const saved = localStorage.getItem('saved_custom_quizzes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Classes list - strictly isolated to current teacher when logged in
  const [classes, setClasses] = useState<Classroom[]>([]);

  // Submissions list - strictly isolated to current teacher when logged in
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);

  // Function to refresh data from server based on active teacher
  const refreshServerData = async (teacher?: TeacherUser | null) => {
    const activeTeacher = teacher !== undefined ? teacher : currentTeacher;
    const teacherQuery = activeTeacher?.email
      ? `?teacherEmail=${encodeURIComponent(activeTeacher.email.toLowerCase().trim())}`
      : '';

    try {
      const classRes = await fetch(`/api/classes${teacherQuery}`);
      const classData = await classRes.json();
      if (classData.success && Array.isArray(classData.classes)) {
        setClasses(classData.classes);
        if (classData.classes.length > 0) {
          setStudentClass(classData.classes[0].className);
          setStudentSchool(classData.classes[0].schoolName);
        }
      }
    } catch (e) {
      console.log('Error refreshing classes:', e);
    }

    try {
      const subRes = await fetch(`/api/submissions${teacherQuery}`);
      const subData = await subRes.json();
      if (subData.success && Array.isArray(subData.submissions)) {
        setSubmissions(subData.submissions);
      }
    } catch (e) {
      console.log('Error refreshing submissions:', e);
    }

    try {
      const quizRes = await fetch(`/api/quizzes${teacherQuery}`);
      const quizData = await quizRes.json();
      if (quizData.success && Array.isArray(quizData.quizzes)) {
        setCustomQuizzes(quizData.quizzes);
        localStorage.setItem('saved_custom_quizzes', JSON.stringify(quizData.quizzes));
      }
    } catch (e) {
      console.log('Error refreshing quizzes:', e);
    }
  };

  // 1. Initial Load: Fetch classes & submissions, and parse URL query parameters
  useEffect(() => {
    refreshServerData(currentTeacher);

    // Check URL parameters (e.g. from shared link)
    const urlParams = new URLSearchParams(window.location.search);
    const quizIdParam = urlParams.get('quizId');
    const codeParam = urlParams.get('code');
    const schoolParam = urlParams.get('school');
    const classParam = urlParams.get('class');
    const roleParam = urlParams.get('role');
    const teacherParam = urlParams.get('teacher');

    if (teacherParam) setAssignmentTeacherEmail(decodeURIComponent(teacherParam).trim().toLowerCase());
    if (schoolParam) setStudentSchool(decodeURIComponent(schoolParam));
    if (classParam) setStudentClass(decodeURIComponent(classParam));

    let matchedQuiz: QuizData | undefined;
    if (quizIdParam) {
      matchedQuiz = 
        QUESTION_BANK.find((q) => q.id === quizIdParam) || 
        SAMPLE_QUIZZES.find((q) => q.id === quizIdParam) ||
        customQuizzes.find((q) => q.id === quizIdParam);
    } else if (codeParam) {
      matchedQuiz = 
        QUESTION_BANK.find((q) => q.quizCode === codeParam) ||
        customQuizzes.find((q) => q.quizCode === codeParam);
    }

    if (matchedQuiz) {
      setCurrentQuiz(matchedQuiz);
    }

    if (roleParam === 'student' || schoolParam || classParam) {
      setUserRole('student');
      // Prompt student name modal if entering via link
      setIsStudentEntryModalOpen(true);
    }
  }, []);

  // Toast message auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sound.enabled = nextState;
  };

  const handleTeacherAuthSuccess = (teacher: TeacherUser) => {
    setCurrentTeacher(teacher);
    localStorage.setItem('saved_teacher', JSON.stringify(teacher));
    setStudentSchool(teacher.schoolName);
    setToastMessage(`👋 Chào mừng ${teacher.fullName} đã đăng nhập thành công!`);
    refreshServerData(teacher);
  };

  const handleTeacherLogout = () => {
    setCurrentTeacher(null);
    localStorage.removeItem('saved_teacher');
    sound.playClick();
    setToastMessage('Đã đăng xuất tài khoản giáo viên.');
    refreshServerData(null);
  };

  const handleAddClassroom = async (newClassData: Omit<Classroom, 'id' | 'createdAt'>) => {
    const cleanTeacherEmail = currentTeacher?.email ? currentTeacher.email.toLowerCase().trim() : undefined;
    const payload = {
      ...newClassData,
      teacherName: newClassData.teacherName || currentTeacher?.fullName || 'Thầy Nguyễn Hữu Kính',
      teacherEmail: cleanTeacherEmail,
    };

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.classroom) {
        setClasses((prev) => [data.classroom, ...prev]);
        setStudentSchool(data.classroom.schoolName);
        setStudentClass(data.classroom.className);
        setToastMessage(`🎉 Đã tạo lớp ${data.classroom.className} thành công trên tài khoản!`);
        return;
      }
    } catch {}

    // Local fallback
    const localClass: Classroom = {
      id: `class-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
    };
    setClasses((prev) => [localClass, ...prev]);
    setStudentSchool(localClass.schoolName);
    setStudentClass(localClass.className);
    setToastMessage(`🎉 Đã tạo lớp ${localClass.className} thành công!`);
  };

  const handleDeleteClass = async (classId: string) => {
    const query = currentTeacher?.email
      ? `?teacherEmail=${encodeURIComponent(currentTeacher.email.toLowerCase().trim())}`
      : '';
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    sound.playClick();
    setToastMessage('🗑️ Đã xóa lớp học khỏi danh sách tài khoản.');

    try {
      await fetch(`/api/classes/${classId}${query}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.log('Error deleting class on server:', e);
    }
  };

  const handleDeleteByQuizCode = async (quizCode: string) => {
    const cleanTeacherEmail = currentTeacher?.email ? currentTeacher.email.toLowerCase().trim() : '';
    const query = cleanTeacherEmail
      ? `?quizCode=${encodeURIComponent(quizCode)}&teacherEmail=${encodeURIComponent(cleanTeacherEmail)}`
      : `?quizCode=${encodeURIComponent(quizCode)}`;

    setSubmissions((prev) =>
      prev.filter((s) => {
        const matchCode = (s.quizCode || '').trim().toLowerCase() === quizCode.trim().toLowerCase();
        if (!matchCode) return true;
        if (cleanTeacherEmail) {
          return (s.teacherEmail || '').toLowerCase().trim() !== cleanTeacherEmail;
        }
        return false;
      })
    );
    sound.playClick();
    setToastMessage(`🗑️ Đã xóa sạch bảng vàng thành tích của mã đề [${quizCode}]!`);

    try {
      await fetch(`/api/submissions/by-quiz-code${query}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.log('Error deleting submissions by quiz code:', e);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    const cleanTeacherEmail = currentTeacher?.email ? currentTeacher.email.toLowerCase().trim() : '';
    const query = cleanTeacherEmail ? `?teacherEmail=${encodeURIComponent(cleanTeacherEmail)}` : '';

    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    sound.playClick();
    setToastMessage('🗑️ Đã xóa kết quả bài làm của học sinh.');

    try {
      await fetch(`/api/submissions/${submissionId}${query}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.log('Error deleting submission on server:', e);
    }
  };

  const handleSaveQuizToBank = async (quiz: QuizData) => {
    const codePrefix = {
      'Toán': 'TOAN',
      'Tiếng Việt': 'TV',
      'Khoa học': 'KH',
      'Lịch sử và Địa lí': 'LS-DL',
      'Đạo đức': 'DD',
      'Tin học': 'TH',
      'Tiếng Anh': 'TA',
    }[quiz.subject] || 'DE';
    const gradeNum = quiz.grade.replace(/\D/g, '') || '5';
    const randomNum = Math.floor(10 + Math.random() * 90);

    const quizToSave: QuizData = {
      ...quiz,
      isCustom: true,
      quizCode: quiz.quizCode || `${codePrefix}${gradeNum}-${randomNum}`,
      authorName: currentTeacher?.fullName || 'Thầy Nguyễn Hữu Kính',
      authorEmail: currentTeacher?.email ? currentTeacher.email.toLowerCase().trim() : '',
      createdAt: quiz.createdAt || new Date().toISOString(),
    };

    setCustomQuizzes((prev) => {
      const filtered = prev.filter((q) => q.id !== quizToSave.id);
      const updated = [quizToSave, ...filtered];
      localStorage.setItem('saved_custom_quizzes', JSON.stringify(updated));
      return updated;
    });

    setCurrentQuiz(quizToSave);
    setToastMessage(`🎉 Đã lưu bổ sung đề vào Ngân hàng đề (${quizToSave.grade} - ${quizToSave.subject})!`);

    try {
      await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: quizToSave }),
      });
    } catch (e) {
      console.log('Error saving quiz to backend:', e);
    }
  };

  const handleDeleteCustomQuiz = async (quizId: string) => {
    const cleanTeacherEmail = currentTeacher?.email ? currentTeacher.email.toLowerCase().trim() : '';
    const query = cleanTeacherEmail ? `?teacherEmail=${encodeURIComponent(cleanTeacherEmail)}` : '';

    setCustomQuizzes((prev) => {
      const updated = prev.filter((q) => q.id !== quizId);
      localStorage.setItem('saved_custom_quizzes', JSON.stringify(updated));
      return updated;
    });

    setToastMessage('Đã xóa đề khỏi Ngân hàng đề.');

    try {
      await fetch(`/api/quizzes/${quizId}${query}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.log('Error deleting quiz on server:', e);
    }
  };

  const handleQuizGenerated = (newQuiz: QuizData, saveToBank: boolean = true) => {
    const codePrefix = {
      'Toán': 'TOAN',
      'Tiếng Việt': 'TV',
      'Khoa học': 'KH',
      'Lịch sử và Địa lí': 'LS-DL',
      'Đạo đức': 'DD',
      'Tin học': 'TH',
      'Tiếng Anh': 'TA',
    }[newQuiz.subject] || 'DE';
    const gradeNum = newQuiz.grade.replace(/\D/g, '') || '5';
    const randomNum = Math.floor(10 + Math.random() * 90);

    const quizWithCode: QuizData = {
      ...newQuiz,
      quizCode: newQuiz.quizCode || `${codePrefix}${gradeNum}-${randomNum}`,
      isCustom: true,
      authorName: currentTeacher?.fullName || 'Giáo viên biên soạn',
      authorEmail: currentTeacher?.email || '',
    };

    setCurrentQuiz(quizWithCode);
    setUserAnswers({});
    setTimeSpentSeconds(0);
    setQuizState('taking');

    if (saveToBank) {
      handleSaveQuizToBank(quizWithCode);
    } else {
      setToastMessage(`✨ Đã tạo đề thành công cho ${quizWithCode.grade} môn ${quizWithCode.subject}!`);
    }
  };

  const handleFinishQuiz = async (answers: UserAnswers, timeSpent: number) => {
    setUserAnswers(answers);
    setTimeSpentSeconds(timeSpent);
    setQuizState('result');

    // Calculate score
    let correctCount = 0;
    currentQuiz.questions.forEach((q) => {
      const userAns = answers[q.id];
      if (q.type === 'multiple_choice') {
        if (userAns && userAns === q.correctAnswer) correctCount++;
      } else if (q.type === 'matching' && q.matchingPairs) {
        if (userAns && typeof userAns === 'object') {
          let matchAll = true;
          q.matchingPairs.forEach((p) => {
            if (userAns[p.id] !== p.right) matchAll = false;
          });
          if (matchAll) correctCount++;
        }
      } else if (q.type === 'fill_blank' && q.acceptableAnswers) {
        if (userAns && typeof userAns === 'string') {
          const clean = userAns.trim().toLowerCase();
          if (q.acceptableAnswers.some((a) => a.trim().toLowerCase() === clean)) correctCount++;
        }
      } else if (q.type === 'true_false' && q.tfStatements) {
        if (userAns && typeof userAns === 'object') {
          let matchAll = true;
          q.tfStatements.forEach((s) => {
            if (userAns[s.id] !== s.isTrue) matchAll = false;
          });
          if (matchAll) correctCount++;
        }
      }
    });

    const totalQuestions = currentQuiz.questions.length;
    const calculatedScore = Number(((correctCount / totalQuestions) * 10).toFixed(1));

    const finalStudentName = studentName.trim() || (userRole === 'student' ? 'Học sinh tiểu học' : 'Giáo viên làm thử');

    // Find class teacher email if matches
    const matchedClass = classes.find(
      (c) => c.className === studentClass && c.schoolName === studentSchool
    );

    const submissionTeacherEmail =
      assignmentTeacherEmail ||
      matchedClass?.teacherEmail ||
      (currentTeacher ? currentTeacher.email : undefined) ||
      currentQuiz.authorEmail ||
      undefined;

    const newSub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      quizId: currentQuiz.id,
      quizCode: currentQuiz.quizCode || 'TOAN5-01',
      quizTitle: currentQuiz.title,
      studentName: finalStudentName,
      schoolName: studentSchool || 'Trường Tiểu học Hoài Nhơn Nam',
      className: studentClass || '5A1',
      grade: currentQuiz.grade,
      subject: currentQuiz.subject,
      score: calculatedScore,
      totalQuestions,
      correctCount,
      timeSpentSeconds: timeSpent,
      teacherEmail: submissionTeacherEmail,
      submittedAt: new Date().toISOString(),
      answers,
    };

    // Update local submissions immediately
    setSubmissions((prev) => [newSub, ...prev]);

    // Send to backend
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub),
      });
    } catch (e) {
      console.log('Failed to post submission to server:', e);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateFeedback = async (submissionId: string, feedback: string) => {
    try {
      await fetch(`/api/submissions/${submissionId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
    } catch (e) {
      console.log('Failed to update feedback on server:', e);
    }

    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, teacherFeedback: feedback } : s))
    );
  };

  const handleRetry = () => {
    setUserAnswers({});
    setTimeSpentSeconds(0);
    setQuizState('taking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPrint = (quizToPrint?: QuizData) => {
    if (quizToPrint) setCurrentQuiz(quizToPrint);
    setQuizState('print');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchStudentQuizWithDetails = (quiz: QuizData, schoolName: string, className: string) => {
    setCurrentQuiz(quiz);
    setStudentSchool(schoolName);
    setStudentClass(className);
    setUserRole('student');
    setUserAnswers({});
    setTimeSpentSeconds(0);
    setQuizState('taking');
    setIsStudentEntryModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/40 text-slate-800">
      {/* Top Navigation */}
      <Header
        userRole={userRole}
        onToggleRole={(role) => {
          setUserRole(role);
          if (role === 'student' && !studentName) {
            setIsStudentEntryModalOpen(true);
          }
        }}
        currentTeacher={currentTeacher}
        onOpenAuthModal={() => setIsTeacherAuthModalOpen(true)}
        onLogoutTeacher={handleTeacherLogout}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenPrintView={() => handleOpenPrint()}
        onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
        onOpenClassrooms={() => setIsClassroomModalOpen(true)}
        onOpenLeaderboard={() => setQuizState('leaderboard')}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        currentGrade={currentQuiz.grade}
        studentName={studentName}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white font-extrabold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-amber-400/80 animate-fadeIn">
          <span className="text-amber-400 text-base">✨</span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {/* Banner Bar for Teachers vs Students */}
        {quizState !== 'print' && quizState !== 'leaderboard' && (
          <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-amber-400/20 via-orange-300/20 to-amber-200/30 border border-amber-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-sm shadow-amber-300 shrink-0">
                {userRole === 'teacher' ? '🎓' : '🎒'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    {currentQuiz.grade} • Môn {currentQuiz.subject}
                  </span>
                  <span className="px-2 py-0.2 rounded-md bg-amber-200/80 text-[11px] font-mono font-bold text-amber-950">
                    Mã đề: {currentQuiz.quizCode || 'DE5'}
                  </span>
                  {currentQuiz.isCustom && (
                    <span className="px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-black text-white shadow-2xs">
                      ✨ GV biên soạn
                    </span>
                  )}
                </div>
                <div className="text-sm font-extrabold text-slate-800 line-clamp-1 mt-0.5">
                  {currentQuiz.title}
                </div>
                {userRole === 'student' ? (
                  <div className="text-xs text-emerald-800 font-bold mt-0.5 flex items-center gap-2">
                    <span>Học sinh: <strong>{studentName || 'Chưa nhập tên'}</strong></span>
                    <span>• {studentClass} ({studentSchool})</span>
                    <button
                      onClick={() => setIsStudentEntryModalOpen(true)}
                      className="text-[10px] underline text-blue-700 font-bold hover:text-blue-900 cursor-pointer"
                    >
                      (Đổi tên)
                    </button>
                  </div>
                ) : (
                  currentTeacher ? (
                    <div className="text-xs text-amber-950 font-bold mt-0.5 flex items-center gap-2">
                      <span>GV: <strong>{currentTeacher.fullName}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span>{currentTeacher.schoolName}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-800 font-semibold mt-0.5 flex items-center gap-1.5">
                      <span>Thầy/Cô chưa đăng nhập.</span>
                      <button
                        onClick={() => setIsTeacherAuthModalOpen(true)}
                        className="text-amber-900 font-black underline hover:text-amber-950 cursor-pointer"
                      >
                        Đăng nhập ngay
                      </button>
                      <span>để quản lý lớp học và bảng điểm riêng.</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Role-Specific Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {userRole === 'teacher' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Chia Sẻ Cho Phụ Huynh / Học Sinh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQuestionBankOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs shadow-2xs transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span>Ngân Hàng Đề ({QUESTION_BANK.length + customQuizzes.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Tải File Tạo Đề AI</span>
                  </button>
                </>
              )}

              {userRole === 'student' && (
                <button
                  type="button"
                  onClick={() => setQuizState('leaderboard')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Trophy className="w-4 h-4 fill-white/20" />
                  <span>Xem Bảng Vàng Lớp</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* View Switch */}
        {quizState === 'taking' && (
          <QuizPlayer
            quiz={currentQuiz}
            onFinishQuiz={handleFinishQuiz}
            onOpenPrint={() => handleOpenPrint()}
            onNewQuiz={() => setIsCreateModalOpen(true)}
            isSavedInBank={customQuizzes.some((q) => q.id === currentQuiz.id) || QUESTION_BANK.some((q) => q.id === currentQuiz.id)}
            onSaveToBank={handleSaveQuizToBank}
            userRole={userRole}
          />
        )}

        {quizState === 'result' && (
          <QuizResultView
            quiz={currentQuiz}
            userAnswers={userAnswers}
            timeSpentSeconds={timeSpentSeconds}
            onRetry={handleRetry}
            onNewQuiz={() => setIsCreateModalOpen(true)}
            onOpenPrint={() => handleOpenPrint()}
            onOpenLeaderboard={() => setQuizState('leaderboard')}
            isSavedInBank={customQuizzes.some((q) => q.id === currentQuiz.id) || QUESTION_BANK.some((q) => q.id === currentQuiz.id)}
            onSaveToBank={handleSaveQuizToBank}
            onOpenShare={(q) => {
              setCurrentQuiz(q);
              setIsShareModalOpen(true);
            }}
            userRole={userRole}
          />
        )}

        {quizState === 'print' && (
          <PrintA4View
            quiz={currentQuiz}
            onBack={() => setQuizState('taking')}
          />
        )}

        {quizState === 'leaderboard' && (
          <LeaderboardView
            submissions={submissions}
            currentTeacher={currentTeacher}
            onBack={() => setQuizState('taking')}
            onUpdateFeedback={handleUpdateFeedback}
            onDeleteByQuizCode={handleDeleteByQuizCode}
            onDeleteSubmission={handleDeleteSubmission}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-amber-200/60 bg-white/80 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <span>🎒 Trắc Nghiệm Tiểu Học Thông Minh</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-600">Chuẩn GDPT (Lớp 1 đến Lớp 5)</span>
          </div>

          {/* Logo NHK with hover tooltip */}
          <div
            className="relative group flex items-center gap-2.5 cursor-pointer py-1"
            title=" Nguyễn Hữu  Kính- Giáo viên Trường Tiểu học Hoài Nhơn Nam"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white font-black tracking-wider text-xs flex items-center justify-center shadow-md shadow-amber-300/60 border-2 border-white ring-2 ring-amber-300 hover:scale-105 transition-all">
              NHK
            </div>
            <div className="text-left">
              <span className="text-[11px] font-black text-slate-800 block leading-tight">Biên soạn & Thiết kế</span>
              <span className="text-[10px] font-bold text-amber-800">Thầy Nguyễn Hữu Kính</span>
            </div>

            {/* Hover Tooltip Balloon */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50 transition-all duration-200 animate-fadeIn">
              <div className="bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-2xl shadow-xl whitespace-nowrap border border-amber-400/50 flex items-center gap-1.5">
                <span className="text-amber-300 text-sm">🎓</span>
                <span> Nguyễn Hữu  Kính- Giáo viên Trường Tiểu học Hoài Nhơn Nam</span>
              </div>
              <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1 border-r border-b border-amber-400/50"></div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>Chế độ: <strong>{userRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}</strong></span>
            {currentTeacher && <span>• GV: <strong>{currentTeacher.fullName}</strong></span>}
            <span>• Ngân hàng đề: <strong>{QUESTION_BANK.length + customQuizzes.length} đề</strong></span>
          </div>
        </div>
      </footer>

      {/* MODALS */}

      {/* 1. Teacher Authentication Modal */}
      <TeacherAuthModal
        isOpen={isTeacherAuthModalOpen}
        onClose={() => setIsTeacherAuthModalOpen(false)}
        onAuthSuccess={handleTeacherAuthSuccess}
      />

      {/* 2. AI Quiz Creator Modal */}
      <QuizCreatorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onQuizGenerated={handleQuizGenerated}
      />

      {/* 3. Classroom Manager Modal */}
      <ClassroomManagerModal
        isOpen={isClassroomModalOpen}
        onClose={() => setIsClassroomModalOpen(false)}
        classes={classes}
        onAddClass={handleAddClassroom}
        onDeleteClass={handleDeleteClass}
        currentTeacher={currentTeacher}
        onSelectClass={(c) => {
          setStudentSchool(c.schoolName);
          setStudentClass(c.className);
        }}
      />

      {/* 4. Share Assignment Modal */}
      <ShareAssignmentModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quiz={currentQuiz}
        classes={classes}
        currentTeacher={currentTeacher}
        onOpenCreateClass={() => {
          setIsShareModalOpen(false);
          setIsClassroomModalOpen(true);
        }}
        onLaunchStudentQuizWithDetails={handleLaunchStudentQuizWithDetails}
      />

      {/* 5. Question Bank Modal */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        customQuizzes={customQuizzes}
        onDeleteCustomQuiz={handleDeleteCustomQuiz}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        currentTeacher={currentTeacher}
        onSelectQuiz={(selectedQuiz) => {
          setCurrentQuiz(selectedQuiz);
          setUserAnswers({});
          setTimeSpentSeconds(0);
          setQuizState('taking');
        }}
        onShareQuiz={(selectedQuiz) => {
          setCurrentQuiz(selectedQuiz);
          setIsQuestionBankOpen(false);
          setIsShareModalOpen(true);
        }}
        onPrintQuiz={(selectedQuiz) => {
          handleOpenPrint(selectedQuiz);
        }}
      />

      {/* 6. Student Entry Modal (Khi học sinh vào làm bài) */}
      <StudentEntryModal
        isOpen={isStudentEntryModalOpen}
        quiz={currentQuiz}
        schoolName={studentSchool}
        className={studentClass}
        onStartQuiz={(name) => {
          setStudentName(name);
          setIsStudentEntryModalOpen(false);
          setUserAnswers({});
          setTimeSpentSeconds(0);
          setQuizState('taking');
        }}
        onCancel={() => setIsStudentEntryModalOpen(false)}
      />
    </div>
  );
}
