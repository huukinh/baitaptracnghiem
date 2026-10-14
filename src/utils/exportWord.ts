import { QuizData } from '../types/quiz';

/**
 * Generates an A4-ready Microsoft Word document (.doc) with Vietnamese standard styling.
 */
export function exportQuizToWord(quiz: QuizData, includeAnswers: boolean = false) {
  const dateStr = new Date().toLocaleDateString('vi-VN');

  let questionsHtml = '';

  quiz.questions.forEach((q, idx) => {
    let contentHtml = '';

    if (q.type === 'multiple_choice' && q.options) {
      contentHtml = `
        <table style="width: 100%; margin-top: 6px; border-collapse: collapse;">
          <tr>
            ${q.options.slice(0, 2).map(opt => `
              <td style="width: 50%; padding: 4px 8px; vertical-align: top;">
                <strong>${opt.id}.</strong> ${opt.text}
                ${includeAnswers && opt.id === q.correctAnswer ? ' <span style="color: #15803d; font-weight: bold;">(✓ Đáp án đúng)</span>' : ''}
              </td>
            `).join('')}
          </tr>
          ${q.options.length > 2 ? `
          <tr>
            ${q.options.slice(2, 4).map(opt => `
              <td style="width: 50%; padding: 4px 8px; vertical-align: top;">
                <strong>${opt.id}.</strong> ${opt.text}
                ${includeAnswers && opt.id === q.correctAnswer ? ' <span style="color: #15803d; font-weight: bold;">(✓ Đáp án đúng)</span>' : ''}
              </td>
            `).join('')}
          </tr>
          ` : ''}
        </table>
      `;
    } else if (q.type === 'matching' && q.matchingPairs) {
      contentHtml = `
        <table style="width: 100%; margin-top: 6px; border: 1px solid #94a3b8; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #94a3b8; padding: 6px; width: 50%; text-align: left;">Cột A</th>
              <th style="border: 1px solid #94a3b8; padding: 6px; width: 50%; text-align: left;">Cột B</th>
            </tr>
          </thead>
          <tbody>
            ${q.matchingPairs.map((pair, pIdx) => `
              <tr>
                <td style="border: 1px solid #94a3b8; padding: 6px;"><strong>${pIdx + 1}.</strong> ${pair.left}</td>
                <td style="border: 1px solid #94a3b8; padding: 6px;"><strong>${String.fromCharCode(65 + pIdx)}.</strong> ${pair.right}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${!includeAnswers ? '<p style="margin: 6px 0 0 0; font-style: italic; color: #475569;">Ghép nối: 1 - ..... ; 2 - ..... ; 3 - ..... ; 4 - .....</p>' : ''}
      `;
    } else if (q.type === 'fill_blank' && q.blankText) {
      contentHtml = `
        <p style="margin: 6px 0; padding: 6px 10px; background-color: #f8fafc; border-left: 3px solid #3b82f6;">
          ${q.blankText.replace(/\[\.\.\.\]/g, '................................')}
        </p>
      `;
    } else if (q.type === 'true_false' && q.tfStatements) {
      contentHtml = `
        <table style="width: 100%; margin-top: 6px; border: 1px solid #94a3b8; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #94a3b8; padding: 6px; text-align: left;">Ý kiến / Phát biểu</th>
              <th style="border: 1px solid #94a3b8; padding: 6px; width: 60px; text-align: center;">Đúng</th>
              <th style="border: 1px solid #94a3b8; padding: 6px; width: 60px; text-align: center;">Sai</th>
            </tr>
          </thead>
          <tbody>
            ${q.tfStatements.map((tf, tIdx) => `
              <tr>
                <td style="border: 1px solid #94a3b8; padding: 6px;">${String.fromCharCode(97 + tIdx)}) ${tf.statement}</td>
                <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">
                  ${includeAnswers && tf.isTrue ? '<strong style="color: #15803d;">Đ</strong>' : ''}
                </td>
                <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">
                  ${includeAnswers && !tf.isTrue ? '<strong style="color: #dc2626;">S</strong>' : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    let explanationHtml = '';
    if (includeAnswers && q.explanation) {
      explanationHtml = `
        <div style="margin-top: 6px; padding: 8px; background-color: #eff6ff; border-left: 3px solid #2563eb; font-size: 11pt;">
          <strong style="color: #1d4ed8;">Lời giải chi tiết:</strong> ${q.explanation}
        </div>
      `;
    }

    questionsHtml += `
      <div style="margin-bottom: 16px; page-break-inside: avoid;">
        <p style="margin: 0; font-weight: bold;">
          Câu ${idx + 1} (${q.level}): <span style="font-weight: normal;">${q.question}</span>
        </p>
        ${contentHtml}
        ${explanationHtml}
      </div>
    `;
  });

  const docHtml = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${quiz.title}</title>
      <style>
        @page {
          size: A4;
          margin: 2cm 1.5cm 2cm 2cm;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.4;
          color: #000;
        }
        table {
          font-size: 12pt;
        }
      </style>
    </head>
    <body>
      <table style="width: 100%; margin-bottom: 15px; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; vertical-align: top; text-align: center;">
            <strong>TRƯỜNG TIỂU HỌC: ..................................</strong><br>
            <strong>LỚP: ................. KHỐI: ${quiz.grade.toUpperCase()}</strong>
          </td>
          <td style="width: 50%; vertical-align: top; text-align: center;">
            <strong>BÀI TẬP TRẮC NGHIỆM ĐỊNH KỲ</strong><br>
            MÔN: <strong>${quiz.subject.toUpperCase()}</strong><br>
            <em>Thời gian làm bài: ${quiz.durationMinutes} phút</em>
          </td>
        </tr>
      </table>

      <table style="width: 100%; margin-bottom: 15px; border: 1px solid #000; border-collapse: collapse;">
        <tr>
          <td style="width: 60%; padding: 8px; border: 1px solid #000; vertical-align: top;">
            Họ và tên học sinh: .............................................................<br>
            Ngày làm bài: ${dateStr}
          </td>
          <td style="width: 20%; padding: 8px; border: 1px solid #000; text-align: center; vertical-align: middle;">
            <strong>ĐIỂM</strong><br><br>
          </td>
          <td style="width: 20%; padding: 8px; border: 1px solid #000; text-align: center; vertical-align: middle;">
            <strong>LỜI PHÊ CỦA THẦY/CÔ</strong><br><br>
          </td>
        </tr>
      </table>

      <h3 style="text-align: center; margin: 15px 0; text-transform: uppercase;">
        ${quiz.title}
        ${includeAnswers ? '<br><span style="font-size: 11pt; color: #166534; font-weight: normal;">(ĐÁP ÁN & HƯỚNG DẪN CHẤM CHI TIẾT)</span>' : ''}
      </h3>

      ${questionsHtml}

      <div style="margin-top: 30px; text-align: center; font-style: italic;">
        --- HẾT ---
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${quiz.title.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}_${includeAnswers ? 'DapAn' : 'DeBai'}.doc`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
