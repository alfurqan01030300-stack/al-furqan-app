import React, { useState } from 'react';
import {
  GraduationCap,
  UserPlus,
  Phone,
  MessageSquare,
  BookOpen,
  Trash2,
  Edit3,
  X,
  Wallet,
  Star,
} from 'lucide-react';
import {
  AcademySettings,
  AttendanceRecord,
  Student,
  Teacher,
  TeacherRating,
} from '../types';
import { cleanWhatsAppNumber, getTodayDateStr } from '../utils/storage';

interface TeachersSectionProps {
  teachers: Teacher[];
  students: Student[];
  attendance: AttendanceRecord[];
  teacherRatings: TeacherRating[];
  settings: AcademySettings;
  onAddTeacher: (teacher: Omit<Teacher, 'id' | 'createdAt'>) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
}

const COMMON_SPECIALIZATIONS = [
  'إجازة بالقراءات العشر ورواية حفص وشعبة',
  'تأسيس الأطفال والقاعدة النورانية',
  'أحكام التجويد النظري والتطبيقي والجزرية',
  'تحفيظ الكبار والمراجعة والتثبيت',
  'علوم القرآن والتفسير والتدبر',
];

export const TeachersSection: React.FC<TeachersSectionProps> = ({
  teachers,
  students,
  attendance,
  teacherRatings,
  settings,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState(COMMON_SPECIALIZATIONS[0]);
  const [customSpec, setCustomSpec] = useState('');
  const [sessionRate, setSessionRate] = useState<number>(settings.defaultSessionRate || 40);
  const [notes, setNotes] = useState('');

  const currentMonth = getTodayDateStr().slice(0, 7);
  const currency = settings.currency || 'ر.س';

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setName('');
    setPhone('');
    setSpecialization(COMMON_SPECIALIZATIONS[0]);
    setCustomSpec('');
    setSessionRate(settings.defaultSessionRate || 40);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setName(t.name);
    setPhone(t.phone);
    if (COMMON_SPECIALIZATIONS.includes(t.specialization)) {
      setSpecialization(t.specialization);
      setCustomSpec('');
    } else {
      setSpecialization('other');
      setCustomSpec(t.specialization);
    }
    setSessionRate(t.sessionRate ?? settings.defaultSessionRate ?? 40);
    setNotes(t.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalSpec =
      specialization === 'other' ? customSpec.trim() || 'معلم قرآن كريم' : specialization;

    if (editingTeacher) {
      onUpdateTeacher({
        ...editingTeacher,
        name: name.trim(),
        phone: phone.trim(),
        specialization: finalSpec,
        sessionRate: Number(sessionRate) || 0,
        notes: notes.trim(),
      });
    } else {
      onAddTeacher({
        name: name.trim(),
        phone: phone.trim(),
        specialization: finalSpec,
        sessionRate: Number(sessionRate) || 0,
        notes: notes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#145A43] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-amiri text-white">
              هيئة التدريس، الرواتب الشهرية، وتقييم المعلمين ({teachers.length})
            </h2>
            <p className="text-xs text-[#D4AF37]/80">
              حساب المرتب تلقائياً (عدد الحصص المنجزة × سعر الحصة) مع عرض تقييمات أولياء الأمور
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="gold-gradient-btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow cursor-pointer transition active:scale-95"
        >
          <UserPlus className="w-4 h-4 text-[#07241B]" />
          <span>+ إضافة معلم جديد</span>
        </button>
      </div>

      {/* Teachers Cards List */}
      {teachers.length === 0 ? (
        <div className="bg-[#0B3D2E]/50 border border-dashed border-[#D4AF37]/30 rounded-2xl p-12 text-center text-slate-300">
          <GraduationCap className="w-12 h-12 text-[#D4AF37]/50 mx-auto mb-3" />
          <p className="text-base font-bold font-amiri text-white">لا يوجد معلمون مسجلون حالياً</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold mt-3"
          >
            + إضافة معلم جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teachers.map((teacher) => {
            const cleanPhone = cleanWhatsAppNumber(teacher.phone);
            const assignedStudents = students.filter((s) => s.assignedTeacherId === teacher.id);

            const rate = teacher.sessionRate ?? settings.defaultSessionRate ?? 40;
            const monthSessions = attendance.filter(
              (a) =>
                a.teacherId === teacher.id &&
                a.date.startsWith(currentMonth) &&
                a.status === 'present'
            );
            const salary = monthSessions.length * rate;

            const ratings = teacherRatings.filter((r) => r.teacherId === teacher.id);
            const avgRating =
              ratings.length > 0
                ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
                : null;

            return (
              <div
                key={teacher.id}
                className="bg-gradient-to-b from-[#104A39]/90 to-[#0B3D2E] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-2xl p-5 shadow-lg transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#07241B] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white font-amiri truncate">
                          {teacher.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-[#D4AF37] mt-0.5">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="line-clamp-1">{teacher.specialization}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="تعديل بيانات المعلم"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من حذف بيانات المعلم "${teacher.name}"؟`)) {
                            onDeleteTeacher(teacher.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                        title="حذف المعلم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Salary & Session Rate Box */}
                  <div className="bg-[#07241B]/80 rounded-xl p-3 border border-emerald-500/30 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                        مرتب الشهر ({currentMonth}):
                      </span>
                      <span className="text-sm font-black text-white">
                        {salary} {currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>عدد الحصص: {monthSessions.length} حصة</span>
                      <span>سعر الحصة: {rate} {currency}</span>
                    </div>
                  </div>

                  {/* Parent Rating Summary */}
                  <div className="bg-[#07241B]/80 rounded-xl p-3 border border-amber-500/30 mt-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        تقييم أولياء الأمور:
                      </span>
                      <span className="font-bold text-white">
                        {avgRating ? `${avgRating} / 5 ⭐ (${ratings.length})` : 'لم يُقيّم بعد'}
                      </span>
                    </div>
                    {ratings.length > 0 && ratings[0].comment && (
                      <p className="text-[11px] text-slate-300 italic truncate">
                        آخر رأي: "{ratings[0].comment}"
                      </p>
                    )}
                  </div>

                  {teacher.phone && (
                    <div className="bg-[#07241B]/70 rounded-xl p-2.5 border border-[#D4AF37]/15 mt-2.5 flex items-center justify-between text-xs">
                      <span dir="ltr" className="font-mono text-emerald-400 font-bold">
                        {teacher.phone}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`tel:${cleanPhone}`}
                          className="p-1.5 rounded-lg bg-white/10 text-slate-200 hover:bg-white/20 transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between text-xs text-slate-300">
                  <span>الطلاب المشرف عليهم:</span>
                  <span className="font-bold text-[#F3E5AB] bg-[#07241B] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/20">
                    {assignedStudents.length} طلاب
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0B3D2E] border border-[#D4AF37]/50 rounded-2xl shadow-2xl overflow-hidden p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-lg font-bold font-amiri">
                  {editingTeacher ? 'تعديل بيانات المعلم' : 'إضافة معلم جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                  الاسم <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: فضيلة الشيخ / محمد بن علي"
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                    الهاتف / الواتساب <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966551234567"
                    dir="ltr"
                    className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3 py-2.5 text-white text-right focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                    سعر الحصة ({currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sessionRate}
                    onChange={(e) => setSessionRate(Number(e.target.value))}
                    className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                  التخصص القرآني <span className="text-red-400">*</span>
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {COMMON_SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec} className="bg-[#0B3D2E] text-white">
                      {spec}
                    </option>
                  ))}
                  <option value="other" className="bg-[#0B3D2E] text-white">
                    + تخصص آخر...
                  </option>
                </select>

                {specialization === 'other' && (
                  <input
                    type="text"
                    value={customSpec}
                    onChange={(e) => setCustomSpec(e.target.value)}
                    placeholder="اكتب التخصص القرآني..."
                    className="mt-2 w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                  ملاحظات أو مؤهلات
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl gold-gradient-btn font-bold text-xs shadow-md transition"
                >
                  {editingTeacher ? 'حفظ التعديل' : 'إضافة المعلم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
