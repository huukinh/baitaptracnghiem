import React, { useState } from 'react';
import { Classroom, GradeLevel, TeacherUser } from '../types/quiz';
import { Users, School, Plus, Check, X, BookOpen, Trash2 } from 'lucide-react';
import { sound } from '../utils/sound';

interface ClassroomManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Classroom[];
  onAddClass: (newClass: Omit<Classroom, 'id' | 'createdAt'>) => void;
  onSelectClass?: (classroom: Classroom) => void;
  onDeleteClass?: (classId: string) => void;
  currentTeacher?: TeacherUser | null;
}

export const ClassroomManagerModal: React.FC<ClassroomManagerModalProps> = ({
  isOpen,
  onClose,
  classes,
  onAddClass,
  onSelectClass,
  onDeleteClass,
  currentTeacher,
}) => {
  const [schoolName, setSchoolName] = useState(currentTeacher?.schoolName || 'Trường Tiểu học Hoài Nhơn Nam');
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState<GradeLevel>('Lớp 5');
  const [teacherName, setTeacherName] = useState(currentTeacher?.fullName || 'Thầy Nguyễn Hữu Kính');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [classToDelete, setClassToDelete] = useState<Classroom | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !className.trim()) {
      setError('Vui lòng điền đầy đủ tên trường và tên lớp.');
      return;
    }

    sound.playSuccess();
    onAddClass({
      schoolName: schoolName.trim(),
      className: className.trim(),
      grade,
      teacherName: teacherName.trim(),
    });

    setClassName('');
    setShowAddForm(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-amber-300 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-sm">
              🏫
            </div>
            <div>
              <h2 className="text-xl font-black">Quản Lý Lớp Học Của Giáo Viên</h2>
              <p className="text-xs text-amber-100">
                Tạo và quản lý danh sách lớp để giao bài tập cho phụ huynh & học sinh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Action button to open add form */}
          {!showAddForm ? (
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Danh sách lớp học hiện tại ({classes.length} lớp)
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  setShowAddForm(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tạo Lớp Học Mới
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 rounded-3xl bg-amber-50/80 border-2 border-amber-200 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <span className="text-sm font-black text-amber-900 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-amber-600" /> Nhập thông tin lớp học mới
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-bold"
                >
                  Đóng lại
                </button>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-100 text-red-800 text-xs font-bold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Tên Trường Học *</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Ví dụ: Trường Tiểu học Chu Văn An"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-500 outline-none font-bold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Tên Lớp Học *</label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Ví dụ: 5A1, 5A2, 4B..."
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-500 outline-none font-bold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Khối Lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as GradeLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-500 outline-none font-bold text-slate-800 bg-white"
                  >
                    <option value="Lớp 5">Khối Lớp 5</option>
                    <option value="Lớp 4">Khối Lớp 4</option>
                    <option value="Lớp 3">Khối Lớp 3</option>
                    <option value="Lớp 2">Khối Lớp 2</option>
                    <option value="Lớp 1">Khối Lớp 1</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Giáo Viên Phụ Trách</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Họ và tên thầy/cô"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-500 outline-none font-bold text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Lưu Lớp Học
                </button>
              </div>
            </form>
          )}

          {/* Class List */}
          <div className="space-y-3">
            {classes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có lớp học nào. Hãy bấm "Tạo Lớp Học Mới" ở trên nhé!
              </div>
            ) : (
              classes.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center shrink-0">
                      {c.className}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <span>Lớp {c.className}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          {c.grade}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {c.schoolName} {c.teacherName ? `• GV: ${c.teacherName}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {onSelectClass && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onSelectClass(c);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs transition-colors cursor-pointer"
                      >
                        Chọn Lớp Này
                      </button>
                    )}

                    {(() => {
                      const isMyClass = Boolean(
                        currentTeacher?.email &&
                        c.teacherEmail &&
                        c.teacherEmail.trim().toLowerCase() === currentTeacher.email.trim().toLowerCase()
                      );
                      const isSystemClass = !c.teacherEmail;

                      if (isMyClass && onDeleteClass) {
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setClassToDelete(c);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                            title="Xóa lớp học này do bạn tạo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        );
                      }

                      if (isSystemClass) {
                        return (
                          <span
                            className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200"
                            title="Lớp mặc định hệ thống (không thể xóa)"
                          >
                            Hệ thống
                          </span>
                        );
                      }

                      return (
                        <span
                          className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200"
                          title="Lớp của giáo viên khác"
                        >
                          Chỉ xem
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Delete Class Confirmation Dialog */}
      {classToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-red-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl">
              🗑️
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-800">
                Xóa Lớp {classToDelete.className}?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Lớp <strong>{classToDelete.className}</strong> ({classToDelete.schoolName}) sẽ bị xóa khỏi tài khoản của Thầy/Cô.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  if (onDeleteClass) {
                    onDeleteClass(classToDelete.id);
                  }
                  setClassToDelete(null);
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
