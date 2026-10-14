import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support large payloads for PDF and image uploads (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

// Healthcheck
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', hasApiKey: !!apiKey });
});

// Extract text from DOCX base64 if needed
async function extractDocxText(base64Data: string): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (err) {
    console.error('Error extracting docx text:', err);
    throw new Error('Không thể đọc nội dung file Word (.docx). Vui lòng thử lại.');
  }
}

// API endpoint to generate quizzes
app.post('/api/generate-quiz', async (req: Request, res: Response) => {
  try {
    const {
      grade = 'Lớp 5',
      subject = 'Toán',
      numQuestions = 10,
      difficulty = 'Tổng hợp 4 mức độ',
      questionType = 'all', // 'multiple_choice' | 'matching' | 'fill_blank' | 'true_false' | 'all'
      textContent = '',
      fileData = null, // { base64: string, mimeType: string, fileName: string }
      topicHint = '',
    } = req.body;

    let extractedText = textContent || '';
    const contents: any[] = [];

    // Check if docx
    if (fileData && fileData.base64) {
      const isDocx =
        fileData.mimeType.includes('word') ||
        fileData.mimeType.includes('officedocument') ||
        fileData.fileName?.endsWith('.docx');

      if (isDocx) {
        const docxText = await extractDocxText(fileData.base64);
        extractedText = (extractedText ? extractedText + '\n\n' : '') + docxText;
      } else if (fileData.mimeType.startsWith('image/') || fileData.mimeType === 'application/pdf') {
        // Direct multimodal inlineData to Gemini
        contents.push({
          inlineData: {
            data: fileData.base64,
            mimeType: fileData.mimeType,
          },
        });
      }
    }

    const typeRequirement = {
      multiple_choice: 'Tất cả các câu hỏi đều là dạng Trắc nghiệm 4 lựa chọn (A, B, C, D) có 1 đáp án đúng duy nhất.',
      matching: 'Tất cả các câu hỏi đều là dạng Nối 2 cột (Ghép vế cột A với vế tương ứng ở cột B, 3-4 cặp nối/câu).',
      fill_blank: 'Tất cả các câu hỏi đều là dạng Điền từ/số vào chỗ chấm (...).',
      true_false: 'Tất cả các câu hỏi đều là dạng Đúng / Sai (Đ/S) với 2-4 nhận định cho mỗi câu.',
      all: 'ĐA DẠNG ĐỦ CÁC DẠNG TRẮC NGHIỆM: Trắc nghiệm 4 lựa chọn (A, B, C, D), Nối cột (matching), Điền vào chỗ chấm (fill_blank), và Đúng/Sai (true_false). Phân bổ hợp lý, sinh động cho học sinh.',
    }[questionType as 'multiple_choice' | 'matching' | 'fill_blank' | 'true_false' | 'all'] || 'Đa dạng các dạng trắc nghiệm phù hợp tiểu học.';

    const systemPrompt = `Bạn là chuyên gia sư phạm tiểu học và giáo viên giỏi theo chương trình Giáo dục Phổ thông Việt Nam (sách Kết nối tri thức, Chân trời sáng tạo, Cánh diều).
Nhiệm vụ của bạn là tạo một bộ đề bài tập trắc nghiệm chất lượng cao, chuẩn mực tiếng Việt, sinh động, phù hợp tâm lý lứa tuổi học sinh tiểu học.

YÊU CẦU ĐẶC BIỆT:
1. Đối tượng: Học sinh ${grade}.
2. Môn học: ${subject}.
3. Số lượng câu hỏi: Đúng ${numQuestions} câu hỏi.
4. Mức độ câu hỏi: ${difficulty} (Mức 1: Nhận biết, Mức 2: Thông hiểu, Mức 3: Vận dụng, Mức 4: Vận dụng cao theo Thông tư 27/22 BGDĐT).
5. Dạng câu hỏi: ${typeRequirement}
6. Định dạng Tiếng Việt và Toán học:
   - Sử dụng tiếng Việt chuẩn xác, từ ngữ trong sáng, không viết tắt cẩu thả.
   - Các biểu thức toán học, số đo, phân số, diện tích cần viết chuẩn, rõ ràng, dễ đọc cho học sinh tiểu học (ví dụ: phân số viết dạng 3/4, diện tích viết cm², m², thể tích dm³, phép tính dùng dấu × và ÷ hoặc + -). Không sử dụng mã LaTeX phức tạp khiến học sinh khó đọc; biểu diễn dễ hiểu như "1/2", "3,5 m²", "x × 4 = 28".
7. Lời giải và giải thích: Mỗi câu hỏi PHẢI có phần giải thích chi tiết (explanation) ân cần, dễ hiểu như lời cô giáo giảng bài ("Em hãy nhớ lại: ...", "Cách tính: ...").
${topicHint ? `8. Yêu cầu/chủ đề bổ sung: ${topicHint}` : ''}

CẤU TRÚC JSON PHẢI TRẢ VỀ (CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CÓ TEXT THỪA NGOÀI JSON):
{
  "title": "Tên bài kiểm tra/chủ đề sinh động (ví dụ: Bài tập trắc nghiệm Ôn tập Toán Lớp 5)",
  "grade": "${grade}",
  "subject": "${subject}",
  "totalQuestions": ${numQuestions},
  "durationMinutes": ${Math.max(15, numQuestions * 2)},
  "summary": "Tóm tắt ngắn gọn mục tiêu kiến thức của bài tập",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "matching" | "fill_blank" | "true_false",
      "level": "Mức 1" | "Mức 2" | "Mức 3" | "Mức 4",
      "question": "Nội dung câu hỏi rõ ràng, sư phạm",
      "points": 1,
      // NẾU type == 'multiple_choice':
      "options": [
        {"id": "A", "text": "Lựa chọn A"},
        {"id": "B", "text": "Lựa chọn B"},
        {"id": "C", "text": "Lựa chọn C"},
        {"id": "D", "text": "Lựa chọn D"}
      ],
      "correctAnswer": "A", // hoặc "B", "C", "D"

      // NẾU type == 'matching' (nối cột):
      "matchingPairs": [
        {"id": "m1", "left": "Vế cột A thứ 1", "right": "Vế cột B tương ứng thứ 1"},
        {"id": "m2", "left": "Vế cột A thứ 2", "right": "Vế cột B tương ứng thứ 2"},
        {"id": "m3", "left": "Vế cột A thứ 3", "right": "Vế cột B tương ứng thứ 3"}
      ],

      // NẾU type == 'fill_blank':
      "blankText": "Đoạn văn hoặc phép tính có chỗ trống biểu thị bằng [...] ví dụ: Muốn tính chu vi hình vuông ta lấy [...] nhân với 4.",
      "acceptableAnswers": ["độ dài một cạnh", "cạnh", "một cạnh"],

      // NẾU type == 'true_false':
      "tfStatements": [
        {"id": "tf1", "statement": "Nhận định thứ nhất", "isTrue": true},
        {"id": "tf2", "statement": "Nhận định thứ hai", "isTrue": false}
      ],

      "hint": "Gợi ý nhỏ nếu học sinh chưa nghĩ ra",
      "explanation": "Lời giải chi tiết từng bước, lý do vì sao chọn đáp án đó, nhắc lại công thức/quy tắc ngữ pháp/kiến thức liên quan."
    }
  ]
}`;

    const promptText = `Dựa trên tài liệu / nội dung sau đây (nếu không có tài liệu đính kèm, hãy biên soạn một bộ câu hỏi chuẩn chương trình ${grade} môn ${subject}):
${extractedText ? `NỘI DUNG TÀI LIỆU:\n"""\n${extractedText}\n"""` : `Hãy tạo bộ câu hỏi bám sát chuẩn kiến thức kĩ năng ${grade} môn ${subject}.`}

Hãy xuất file JSON đúng theo cấu trúc đã yêu cầu ở trên.`;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '{}';
    let parsedQuiz;
    try {
      parsedQuiz = JSON.parse(jsonText);
    } catch (e) {
      // If there are markdown formatting ticks
      const clean = jsonText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedQuiz = JSON.parse(clean);
    }

    res.json({
      success: true,
      quiz: parsedQuiz,
    });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Có lỗi xảy ra khi tạo câu hỏi trắc nghiệm. Vui lòng thử lại.',
    });
  }
});

// Data store with persistent JSON file storage
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson<T>(filename: string, defaultValue: T): T {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
  }
  return defaultValue;
}

function saveJson<T>(filename: string, data: T): void {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
}

interface TeacherAccount {
  id: string;
  fullName: string;
  schoolName: string;
  email: string;
  password: string;
  createdAt: string;
}

interface ClassroomData {
  id: string;
  schoolName: string;
  className: string;
  grade: string;
  teacherName?: string;
  teacherEmail?: string;
  createdAt: string;
}

interface SubmissionData {
  id: string;
  quizId: string;
  quizCode: string;
  quizTitle: string;
  studentName: string;
  schoolName: string;
  className: string;
  grade: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeSpentSeconds: number;
  submittedAt: string;
  teacherEmail?: string;
  teacherFeedback?: string;
  answers?: any;
}

const defaultTeachers: TeacherAccount[] = [
  {
    id: 'teacher-1',
    fullName: 'Thầy Nguyễn Hữu Kính',
    schoolName: 'Trường Tiểu học Hoài Nhơn Nam',
    email: 'thaykinh2022@gmail.com',
    password: '123',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'teacher-2',
    fullName: 'Thầy Nguyễn Hữu Kính',
    schoolName: 'Trường Tiểu học Hoài Nhơn Nam',
    email: 'nguyenhuukinh@gmail.com',
    password: '123',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'teacher-3',
    fullName: 'Cô Trần Thị Mai',
    schoolName: 'Trường Tiểu học Kim Đồng',
    email: 'mai.tran@kimdong.edu.vn',
    password: '123',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'teacher-4',
    fullName: 'Thầy Hoàng Văn Thắng',
    schoolName: 'Trường Tiểu học Lê Quý Đôn',
    email: 'thang.hoang@lequydon.edu.vn',
    password: '123',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

let teachers: TeacherAccount[] = loadJson<TeacherAccount[]>('teachers.json', defaultTeachers);
// Ensure all default teachers exist in teachers list
defaultTeachers.forEach((dt) => {
  if (!teachers.some((t) => t.email.toLowerCase().trim() === dt.email.toLowerCase().trim())) {
    teachers.push(dt);
  }
});
saveJson('teachers.json', teachers);

const defaultClassrooms: ClassroomData[] = [
  {
    id: 'class-1',
    schoolName: 'Trường Tiểu học Hoài Nhơn Nam',
    className: '5A1',
    grade: 'Lớp 5',
    teacherName: 'Thầy Nguyễn Hữu Kính',
    teacherEmail: 'thaykinh2022@gmail.com',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'class-2',
    schoolName: 'Trường Tiểu học Kim Đồng',
    className: '5B',
    grade: 'Lớp 5',
    teacherName: 'Cô Trần Thị Mai',
    teacherEmail: 'mai.tran@kimdong.edu.vn',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'class-3',
    schoolName: 'Trường Tiểu học Lê Quý Đôn',
    className: '4A',
    grade: 'Lớp 4',
    teacherName: 'Thầy Hoàng Văn Thắng',
    teacherEmail: 'thang.hoang@lequydon.edu.vn',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'class-4',
    schoolName: 'Trường Tiểu học Hoài Nhơn Nam',
    className: '5A2',
    grade: 'Lớp 5',
    teacherName: 'Thầy Nguyễn Hữu Kính',
    teacherEmail: 'thaykinh2022@gmail.com',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

let classrooms: ClassroomData[] = loadJson<ClassroomData[]>('classrooms.json', defaultClassrooms);
defaultClassrooms.forEach((dc) => {
  if (!classrooms.some((c) => c.id === dc.id)) {
    classrooms.push(dc);
  }
});
saveJson('classrooms.json', classrooms);

const defaultSubmissions: SubmissionData[] = [
  {
    id: 'sub-1',
    quizId: 'bank-g5-math-1',
    quizCode: 'TOAN5-01',
    quizTitle: 'Đề 1: Ôn tập Phân số, Hỗn số và Bảng đơn vị đo - Toán 5',
    studentName: 'Nguyễn Gia Huy',
    schoolName: 'Trường Tiểu học Chu Văn An',
    className: '5A1',
    grade: 'Lớp 5',
    subject: 'Toán',
    score: 10,
    totalQuestions: 5,
    correctCount: 5,
    timeSpentSeconds: 420,
    teacherEmail: 'thaykinh2022@gmail.com',
    teacherFeedback: 'Em làm bài rất cẩn thận, tính toán phân số chính xác tuyệt đối. Khen ngợi em!',
    submittedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'sub-2',
    quizId: 'bank-g5-math-1',
    quizCode: 'TOAN5-01',
    quizTitle: 'Đề 1: Ôn tập Phân số, Hỗn số và Bảng đơn vị đo - Toán 5',
    studentName: 'Trần Bảo An',
    schoolName: 'Trường Tiểu học Chu Văn An',
    className: '5A1',
    grade: 'Lớp 5',
    subject: 'Toán',
    score: 10,
    totalQuestions: 5,
    correctCount: 5,
    timeSpentSeconds: 480,
    teacherEmail: 'thaykinh2022@gmail.com',
    teacherFeedback: 'Bảo An nắm rất chắc công thức đổi hỗn số ra phân số.',
    submittedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'sub-3',
    quizId: 'bank-g5-math-1',
    quizCode: 'TOAN5-01',
    quizTitle: 'Đề 1: Ôn tập Phân số, Hỗn số và Bảng đơn vị đo - Toán 5',
    studentName: 'Lê Tuấn Kiệt',
    schoolName: 'Trường Tiểu học Chu Văn An',
    className: '5A1',
    grade: 'Lớp 5',
    subject: 'Toán',
    score: 8,
    totalQuestions: 5,
    correctCount: 4,
    timeSpentSeconds: 540,
    teacherEmail: 'thaykinh2022@gmail.com',
    teacherFeedback: 'Em cần chú ý kĩ câu chuyển đổi đơn vị đo diện tích ha sang m² nhé.',
    submittedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'sub-4',
    quizId: 'bank-g5-tv-1',
    quizCode: 'TV5-01',
    quizTitle: 'Đề 1: Từ đồng nghĩa, Từ trái nghĩa và Từ đồng âm - Tiếng Việt 5',
    studentName: 'Vũ Đình Trọng',
    schoolName: 'Trường Tiểu học Chu Văn An',
    className: '5A1',
    grade: 'Lớp 5',
    subject: 'Tiếng Việt',
    score: 10,
    totalQuestions: 5,
    correctCount: 5,
    timeSpentSeconds: 380,
    teacherEmail: 'thaykinh2022@gmail.com',
    teacherFeedback: 'Vốn từ ngữ phong phú, hiểu rõ từ đồng nghĩa và từ đồng âm.',
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'sub-5',
    quizId: 'bank-g5-tv-1',
    quizCode: 'TV5-01',
    quizTitle: 'Đề 1: Từ đồng nghĩa, Từ trái nghĩa và Từ đồng âm - Tiếng Việt 5',
    studentName: 'Đỗ Ngọc Hân',
    schoolName: 'Trường Tiểu học Kim Đồng',
    className: '5B',
    grade: 'Lớp 5',
    subject: 'Tiếng Việt',
    score: 8,
    totalQuestions: 5,
    correctCount: 4,
    timeSpentSeconds: 610,
    teacherEmail: 'mai.tran@kimdong.edu.vn',
    submittedAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
  },
  {
    id: 'sub-6',
    quizId: 'bank-g5-kh-1',
    quizCode: 'KH5-01',
    quizTitle: 'Đề 1: Sự sinh sản và Sức khỏe con người - Khoa học 5',
    studentName: 'Bùi Minh Khang',
    schoolName: 'Trường Tiểu học Chu Văn An',
    className: '5A1',
    grade: 'Lớp 5',
    subject: 'Khoa học',
    score: 10,
    totalQuestions: 5,
    correctCount: 5,
    timeSpentSeconds: 390,
    teacherEmail: 'thaykinh2022@gmail.com',
    teacherFeedback: 'Xuất sắc! Em ghi nhớ rất tốt kiến thức vệ sinh phòng bệnh.',
    submittedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'sub-7',
    quizId: 'bank-g4-math-1',
    quizCode: 'TOAN4-01',
    quizTitle: 'Số có nhiều chữ số & Phép tính cơ bản - Toán 4',
    studentName: 'Hoàng Thảo My',
    schoolName: 'Trường Tiểu học Lê Quý Đôn',
    className: '4A',
    grade: 'Lớp 4',
    subject: 'Toán',
    score: 10,
    totalQuestions: 5,
    correctCount: 5,
    timeSpentSeconds: 430,
    teacherEmail: 'thang.hoang@lequydon.edu.vn',
    submittedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'sub-8',
    quizId: 'bank-g5-math-1',
    quizCode: 'TOAN5-01',
    quizTitle: 'Đề 1: Ôn tập Phân số, Hỗn số và Bảng đơn vị đo - Toán 5',
    studentName: 'Lê Minh Quân',
    schoolName: 'Trường Tiểu học Hoài Nhơn Nam',
    className: '5A',
    grade: 'Lớp 5',
    subject: 'Toán',
    score: 10,
    totalQuestions: 5,
    correctCount: 5,
    timeSpentSeconds: 380,
    teacherEmail: 'nguyenhuukinh@gmail.com',
    teacherFeedback: 'Minh Quân làm bài rất thông minh và nhanh nhẹn!',
    submittedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
];

let submissions: SubmissionData[] = loadJson<SubmissionData[]>('submissions.json', defaultSubmissions);
defaultSubmissions.forEach((ds) => {
  if (!submissions.some((s) => s.id === ds.id)) {
    submissions.push(ds);
  }
});
saveJson('submissions.json', submissions);

// TEACHER AUTHENTICATION APIS
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { fullName, schoolName, email, password } = req.body;

  if (!fullName || !schoolName || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng điền đầy đủ Họ và tên, Trường học, Email và Mật khẩu.',
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = String(password).trim();
  const cleanFullName = String(fullName).trim();
  const cleanSchoolName = String(schoolName).trim();

  // Fresh load from disk to ensure sync
  teachers = loadJson<TeacherAccount[]>('teachers.json', teachers);

  const existing = teachers.find((t) => t.email.toLowerCase().trim() === cleanEmail);
  if (existing) {
    // If account exists, update password and information, then log in immediately
    existing.fullName = cleanFullName || existing.fullName;
    existing.schoolName = cleanSchoolName || existing.schoolName;
    existing.password = cleanPassword;
    saveJson('teachers.json', teachers);

    const { password: _, ...profile } = existing;
    return res.json({
      success: true,
      teacher: profile,
      message: 'Cập nhật tài khoản giáo viên và đăng nhập thành công!',
    });
  }

  const newTeacher: TeacherAccount = {
    id: `teacher-${Date.now()}`,
    fullName: cleanFullName,
    schoolName: cleanSchoolName,
    email: cleanEmail,
    password: cleanPassword,
    createdAt: new Date().toISOString(),
  };

  teachers.push(newTeacher);
  saveJson('teachers.json', teachers);

  // Return teacher profile (without password)
  const { password: _, ...profile } = newTeacher;
  res.json({ success: true, teacher: profile, message: 'Đăng ký tài khoản thành công!' });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng nhập Email đăng nhập.',
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = password ? String(password).trim() : '123';

  // Fresh load from disk to ensure sync across devices/restarts
  teachers = loadJson<TeacherAccount[]>('teachers.json', teachers);

  let found = teachers.find((t) => t.email.toLowerCase().trim() === cleanEmail);

  if (found) {
    // If password provided and differs, update stored password so user is never locked out
    if (cleanPassword && found.password !== cleanPassword && cleanPassword !== '123') {
      found.password = cleanPassword;
      saveJson('teachers.json', teachers);
    }
  } else {
    // If email not found, automatically register new teacher account so they can log in seamlessly on any device!
    let inferredName = 'Thầy Nguyễn Hữu Kính';
    let inferredSchool = 'Trường Tiểu học Hoài Nhơn Nam';

    if (cleanEmail.includes('kinh')) {
      inferredName = 'Thầy Nguyễn Hữu Kính';
      inferredSchool = 'Trường Tiểu học Hoài Nhơn Nam';
    } else {
      const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const formatted = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      inferredName = `Thầy/Cô ${formatted}`;
    }

    found = {
      id: `teacher-${Date.now()}`,
      fullName: inferredName,
      schoolName: inferredSchool,
      email: cleanEmail,
      password: cleanPassword,
      createdAt: new Date().toISOString(),
    };
    teachers.push(found);
    saveJson('teachers.json', teachers);
  }

  const { password: _, ...profile } = found;
  res.json({ success: true, teacher: profile, message: 'Đăng nhập thành công!' });
});

// Teacher password reset API
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword, fullName, schoolName } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng cung cấp Email và Mật khẩu mới.',
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = String(newPassword).trim();

  if (cleanPassword.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Mật khẩu mới cần tối thiểu 3 ký tự.',
    });
  }

  teachers = loadJson<TeacherAccount[]>('teachers.json', teachers);
  let teacher = teachers.find((t) => t.email.toLowerCase().trim() === cleanEmail);
  if (!teacher) {
    teacher = {
      id: `teacher-${Date.now()}`,
      fullName: fullName ? String(fullName).trim() : 'Thầy Nguyễn Hữu Kính',
      schoolName: schoolName ? String(schoolName).trim() : 'Trường Tiểu học Hoài Nhơn Nam',
      email: cleanEmail,
      password: cleanPassword,
      createdAt: new Date().toISOString(),
    };
    teachers.push(teacher);
  } else {
    teacher.password = cleanPassword;
    if (fullName) teacher.fullName = String(fullName).trim();
    if (schoolName) teacher.schoolName = String(schoolName).trim();
  }
  saveJson('teachers.json', teachers);

  const { password: _, ...profile } = teacher;
  res.json({ success: true, teacher: profile, message: 'Đặt lại mật khẩu và đăng nhập thành công!' });
});

// List teachers (public profiles without password)
app.get('/api/auth/teachers', (_req: Request, res: Response) => {
  teachers = loadJson<TeacherAccount[]>('teachers.json', teachers);
  const list = teachers.map((t) => ({
    id: t.id,
    fullName: t.fullName,
    schoolName: t.schoolName,
    email: t.email,
  }));
  res.json({ success: true, teachers: list });
});

// Update Teacher Feedback on a Submission
app.patch('/api/submissions/:id/feedback', (req: Request, res: Response) => {
  const { id } = req.params;
  const { feedback } = req.body;

  submissions = loadJson<SubmissionData[]>('submissions.json', submissions);
  const sub = submissions.find((s) => s.id === id);
  if (!sub) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy bài làm.' });
  }

  sub.teacherFeedback = feedback;
  saveJson('submissions.json', submissions);
  res.json({ success: true, submission: sub });
});

// Classes API
app.get('/api/classes', (req: Request, res: Response) => {
  const { teacherEmail } = req.query;
  classrooms = loadJson<ClassroomData[]>('classrooms.json', classrooms);

  if (teacherEmail && teacherEmail !== 'all') {
    const cleanEmail = String(teacherEmail).trim().toLowerCase();
    const teacherClasses = classrooms.filter(
      (c) => (c.teacherEmail || '').trim().toLowerCase() === cleanEmail
    );
    return res.json({ success: true, classes: teacherClasses });
  }

  res.json({ success: true, classes: classrooms });
});

app.post('/api/classes', (req: Request, res: Response) => {
  const { schoolName, className, grade = 'Lớp 5', teacherName = '', teacherEmail = '' } = req.body;
  if (!schoolName || !className) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập tên trường và tên lớp.' });
  }

  classrooms = loadJson<ClassroomData[]>('classrooms.json', classrooms);

  const newClass: ClassroomData = {
    id: `class-${Date.now()}`,
    schoolName: schoolName.trim(),
    className: className.trim(),
    grade,
    teacherName: teacherName.trim(),
    teacherEmail: teacherEmail ? teacherEmail.trim().toLowerCase() : undefined,
    createdAt: new Date().toISOString(),
  };

  classrooms.unshift(newClass);
  saveJson('classrooms.json', classrooms);
  res.json({ success: true, classroom: newClass });
});

app.delete('/api/classes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { teacherEmail } = req.query;

  if (!teacherEmail) {
    return res.status(401).json({ success: false, error: 'Bạn cần đăng nhập tài khoản giáo viên để xóa lớp học.' });
  }

  const cleanEmail = String(teacherEmail).trim().toLowerCase();
  classrooms = loadJson<ClassroomData[]>('classrooms.json', classrooms);

  const index = classrooms.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy lớp học.' });
  }

  const targetClass = classrooms[index];
  // Không cho phép xóa lớp mặc định của hệ thống
  if (!targetClass.teacherEmail) {
    return res.status(403).json({ success: false, error: 'Không thể xóa lớp mặc định của hệ thống.' });
  }

  // Không cho phép xóa lớp của giáo viên khác
  if (targetClass.teacherEmail.trim().toLowerCase() !== cleanEmail) {
    return res.status(403).json({ success: false, error: 'Bạn chỉ có quyền xóa lớp học do chính mình tạo.' });
  }

  classrooms.splice(index, 1);
  saveJson('classrooms.json', classrooms);
  res.json({ success: true, message: 'Đã xóa lớp học thành công.' });
});

// Submissions API
app.get('/api/submissions', (req: Request, res: Response) => {
  const { grade, className, subject, quizCode, teacherEmail } = req.query;

  submissions = loadJson<SubmissionData[]>('submissions.json', submissions);
  let filtered = [...submissions];

  if (teacherEmail && teacherEmail !== 'all') {
    const cleanTeacherEmail = String(teacherEmail).trim().toLowerCase();
    // Strict match so teachers only see their own classes' submissions
    filtered = filtered.filter(
      (s) => s.teacherEmail && s.teacherEmail.toLowerCase().trim() === cleanTeacherEmail
    );
  }
  if (grade && grade !== 'all') {
    filtered = filtered.filter((s) => s.grade === grade);
  }
  if (className && className !== 'all') {
    filtered = filtered.filter((s) => s.className === className);
  }
  if (subject && subject !== 'all') {
    filtered = filtered.filter((s) => s.subject === subject);
  }
  if (quizCode && quizCode !== 'all') {
    filtered = filtered.filter((s) => s.quizCode === quizCode);
  }

  // Sort by score DESC, then timeSpentSeconds ASC
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeSpentSeconds - b.timeSpentSeconds;
  });

  res.json({ success: true, submissions: filtered });
});

// Delete submissions by quizCode (Reset leaderboard for a quiz)
app.delete('/api/submissions/by-quiz-code', (req: Request, res: Response) => {
  const { quizCode, teacherEmail } = req.query;
  if (!quizCode) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mã đề cần xóa.' });
  }
  if (!teacherEmail) {
    return res.status(401).json({ success: false, error: 'Bạn chưa đăng nhập. Không có quyền xóa bảng vàng thành tích.' });
  }

  submissions = loadJson<SubmissionData[]>('submissions.json', submissions);
  const cleanCode = String(quizCode).trim().toLowerCase();
  const cleanTeacherEmail = String(teacherEmail).trim().toLowerCase();

  const initialCount = submissions.length;
  submissions = submissions.filter((s) => {
    const matchCode = (s.quizCode || '').trim().toLowerCase() === cleanCode;
    if (!matchCode) return true; // Keep other quizzes

    // Only delete submissions belonging to this teacher!
    // Cannot delete system submissions or submissions of other teachers
    const isOwner = (s.teacherEmail || '').trim().toLowerCase() === cleanTeacherEmail;
    return !isOwner; // Keep if not owner
  });

  const deletedCount = initialCount - submissions.length;
  saveJson('submissions.json', submissions);
  res.json({ success: true, deletedCount, quizCode });
});

// Delete single submission
app.delete('/api/submissions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { teacherEmail } = req.query;

  if (!teacherEmail) {
    return res.status(401).json({ success: false, error: 'Bạn cần đăng nhập tài khoản giáo viên để xóa kết quả này.' });
  }

  const cleanTeacherEmail = String(teacherEmail).trim().toLowerCase();
  submissions = loadJson<SubmissionData[]>('submissions.json', submissions);
  const index = submissions.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy bài làm.' });
  }

  const sub = submissions[index];
  // Không cho phép xóa kết quả hệ thống hoặc của giáo viên khác
  if (!sub.teacherEmail || sub.teacherEmail.trim().toLowerCase() !== cleanTeacherEmail) {
    return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa kết quả bảng vàng của lớp khác hoặc hệ thống.' });
  }

  submissions.splice(index, 1);
  saveJson('submissions.json', submissions);
  res.json({ success: true });
});

app.post('/api/submissions', (req: Request, res: Response) => {
  const {
    quizId,
    quizCode = '',
    quizTitle = '',
    studentName,
    schoolName,
    className,
    grade = 'Lớp 5',
    subject = 'Toán',
    score = 0,
    totalQuestions = 0,
    correctCount = 0,
    timeSpentSeconds = 0,
    teacherEmail = '',
    answers = {},
  } = req.body;

  if (!studentName) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp họ và tên học sinh.' });
  }

  submissions = loadJson<SubmissionData[]>('submissions.json', submissions);

  let finalTeacherEmail = teacherEmail ? String(teacherEmail).trim().toLowerCase() : undefined;
  if (!finalTeacherEmail) {
    classrooms = loadJson<ClassroomData[]>('classrooms.json', classrooms);
    const cleanClassName = (className || '').trim().toLowerCase();
    const matchedClass = classrooms.find(
      (c) => c.className.toLowerCase().trim() === cleanClassName
    );
    if (matchedClass && matchedClass.teacherEmail) {
      finalTeacherEmail = matchedClass.teacherEmail.toLowerCase().trim();
    }
  }

  const newSubmission: SubmissionData = {
    id: `sub-${Date.now()}`,
    quizId,
    quizCode: quizCode || `DE-${Math.floor(100 + Math.random() * 900)}`,
    quizTitle,
    studentName: studentName.trim(),
    schoolName: (schoolName || 'Trường Tiểu học').trim(),
    className: (className || '5A1').trim(),
    grade,
    subject,
    score: Number(score),
    totalQuestions: Number(totalQuestions),
    correctCount: Number(correctCount),
    timeSpentSeconds: Number(timeSpentSeconds),
    teacherEmail: finalTeacherEmail,
    submittedAt: new Date().toISOString(),
    answers,
  };

  submissions.unshift(newSubmission);
  saveJson('submissions.json', submissions);
  res.json({ success: true, submission: newSubmission });
});

// Custom quizzes API (saved to bank by teachers)
let customQuizzes: any[] = loadJson<any[]>('quizzes.json', []);

app.get('/api/quizzes', (req: Request, res: Response) => {
  const { teacherEmail } = req.query;
  customQuizzes = loadJson<any[]>('quizzes.json', customQuizzes);

  if (teacherEmail && teacherEmail !== 'all') {
    const cleanEmail = String(teacherEmail).trim().toLowerCase();
    // Teacher only sees custom quizzes created on their own account
    const myQuizzes = customQuizzes.filter(
      (q) => (q.authorEmail || '').trim().toLowerCase() === cleanEmail
    );
    return res.json({ success: true, quizzes: myQuizzes });
  }

  res.json({ success: true, quizzes: customQuizzes });
});

app.post('/api/quizzes', (req: Request, res: Response) => {
  const { quiz } = req.body;
  if (!quiz || !quiz.title || !quiz.grade || !quiz.subject) {
    return res.status(400).json({ success: false, error: 'Thông tin đề thi không hợp lệ.' });
  }

  const cleanedQuiz = {
    ...quiz,
    authorEmail: quiz.authorEmail ? String(quiz.authorEmail).trim().toLowerCase() : undefined,
  };

  customQuizzes = loadJson<any[]>('quizzes.json', customQuizzes);
  const existingIndex = customQuizzes.findIndex((q) => q.id === cleanedQuiz.id);
  if (existingIndex >= 0) {
    customQuizzes[existingIndex] = cleanedQuiz;
  } else {
    customQuizzes.unshift(cleanedQuiz);
  }

  saveJson('quizzes.json', customQuizzes);
  res.json({ success: true, quiz: cleanedQuiz, totalCustom: customQuizzes.length });
});

app.delete('/api/quizzes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { teacherEmail } = req.query;

  if (!teacherEmail) {
    return res.status(401).json({ success: false, error: 'Bạn cần đăng nhập tài khoản giáo viên để xóa đề thi.' });
  }

  const cleanEmail = String(teacherEmail).trim().toLowerCase();
  customQuizzes = loadJson<any[]>('quizzes.json', customQuizzes);
  const index = customQuizzes.findIndex((q) => q.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi.' });
  }

  const q = customQuizzes[index];
  if (q.authorEmail && q.authorEmail.trim().toLowerCase() !== cleanEmail) {
    return res.status(403).json({ success: false, error: 'Bạn chỉ có quyền xóa đề thi do chính mình tạo.' });
  }

  customQuizzes.splice(index, 1);
  saveJson('quizzes.json', customQuizzes);
  res.json({ success: true, message: 'Đã xóa đề thi thành công.' });
});

// Configure Vite or Static Files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
