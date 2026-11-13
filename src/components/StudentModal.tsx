import React, { useState, useEffect } from 'react';
import { X, User, Phone, BookOpen, CreditCard, FileText, Check, UserCheck } from 'lucide-react';
import { FeeStatus, Student, Teacher } from '../types';
import { addDaysToDateStr, getTodayDateStr } from '../utils/storage';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Partial<Student>) => void;
  studentToEdit?: Student | null;
  teachers: Teacher[];
  defaultSubscriptionAmount?: number;
}

const COMMON_COURSES = [
  'حفظ القرآن كاملاً مع أحكام التجويد',
  'جزء عم وتبارك مع القاعدة النورانية',
  'إتقان التلاوة وتثبيت الأجزاء الخمسة الأولى',
  'القاعدة النورانية وتأسيس الأطفال',
  'أحكام التجويد ومخارج الحروف ومنظومة الجزرية',
  'حفظ وتفسير الجزء الثلاثين (عم)',
  'المراجعة الشاملة وتأهيل الإجازة بالسند',
];

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  studentToEdit,
  teachers,
  defaultSubscriptionAmount = 250,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<string | number>('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState(COMMON_COURSES[0]);
  const [customCourse, setCustomCourse] = useState('');
  const [feeStatus, setFeeStatus] = useState<FeeStatus>('unpaid');
  const [notes, setNotes] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [assignedTeacherId, setAssignedTeacherId] = useState('');
  const [completedJuz, setCompletedJuz] = useState<number>(0);
  const [currentSurah, setCurrentSurah] = useState('سورة الفاتحة');
  const [subscriptionAmount, setSubscriptionAmount] = useState<number>(defaultSubscriptionAmount);
  const [nextPaymentDate, setNextPaymentDate] = useState(addDaysToDateStr(getTodayDateStr(), 30));

  const isEditing = Boolean(studentToEdit);

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.name || '');
      setAge(studentToEdit.age || '');
      setPhone(studentToEdit.phone || '');
      if (COMMON_COURSES.includes(studentToEdit.course)) {
        setCourse(studentToEdit.course);
        setCustomCourse('');
      } else {
        setCourse('other');
        setCustomCourse(studentToEdit.course || '');
      }
      setFeeStatus(studentToEdit.feeStatus || 'unpaid');
      setNotes(studentToEdit.notes || '');
      setParentName(studentToEdit.parentName || '');
      setParentPhone(studentToEdit.parentPhone || studentToEdit.phone || '');
      setAssignedTeacherId(studentToEdit.assignedTeacherId || '');
      setCompletedJuz(studentToEdit.completedJuz ?? 0);
      setCurrentSurah(studentToEdit.currentSurah || 'سورة الفاتحة');
      setSubscriptionAmount(studentToEdit.subscriptionAmount ?? defaultSubscriptionAmount);
      setNextPaymentDate(studentToEdit.nextPaymentDate || addDaysToDateStr(getTodayDateStr(), 30));
    } else {
      setName('');
      setAge('');
      setPhone('');
      setCourse(COMMON_COURSES[0]);
      setCustomCourse('');
      setFeeStatus('unpaid');
      setNotes('');
      setParentName('');
      setParentPhone('');
      setAssignedTeacherId(teachers.length > 0 ? teachers[0].id : '');
      setCompletedJuz(0);
      setCurrentSurah('سورة النبأ');
      setSubscriptionAmount(defaultSubscriptionAmount);
      setNextPaymentDate(addDaysToDateStr(getTodayDateStr(), 30));
    }
  }, [studentToEdit, isOpen, teachers, defaultSubscriptionAmount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCourse = course === 'other' ? customCourse.trim() || 'كورس تحفيظ القرآن' : course;

    onSave({
      name: name.trim(),
      age: age ? Number(age) : '',
      phone: phone.trim(),
      course: finalCourse,
      feeStatus,
      notes: notes.trim(),
      parentName: parentName.trim() || name.trim(),
      parentPhone: parentPhone.trim() || phone.trim(),
      assignedTeacherId,
      completedJuz: Math.max(0, Math.min(30, Number(completedJuz) || 0)),
      currentSurah: currentSurah.trim() || 'سورة الفاتحة',
      subscriptionAmount: Number(subscriptionAmount) || defaultSubscriptionAmount,
      nextPaymentDate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-[#0B3D2E] border border-[#D4AF37]/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          boxShadow: '0 0 35px rgba(212, 175, 55, 0.25), 0 25px 50px rgba(0,0,0,0.8)',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/25 bg-[#07241B]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#145A43] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-amiri">
                {isEditing ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h3>
              <p className="text-xs text-[#D4AF37]/80">
                {isEditing ? `تعديل ملف: ${studentToEdit?.name}` : 'تسجيل طالب جديد في حلقات التحفيظ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
              اسم الطالب <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: عبد الله بن خالد الشمري"
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
              />
              <User className="w-4 h-4 text-[#D4AF37]/60 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                السن (العمر)
              </label>
              <input
                type="number"
                min="3"
                max="99"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="مثال: 12"
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                رقم الهاتف / الواتساب
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: +966501234567"
                  dir="ltr"
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-right focus:outline-none focus:border-[#D4AF37]"
                />
                <Phone className="w-4 h-4 text-[#D4AF37]/60 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Memorization Tracking Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#07241B]/60 p-3.5 rounded-xl border border-[#D4AF37]/20">
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                الأجزاء المحفوظة (من 30)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={completedJuz}
                onChange={(e) => setCompletedJuz(Number(e.target.value))}
                className="w-full bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                السورة الحالية
              </label>
              <input
                type="text"
                value={currentSurah}
                onChange={(e) => setCurrentSurah(e.target.value)}
                placeholder="مثال: سورة الكهف"
                className="w-full bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Subscription & Next Payment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#07241B]/60 p-3.5 rounded-xl border border-[#D4AF37]/20">
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                قيمة الاشتراك الشهري
              </label>
              <input
                type="number"
                min="0"
                value={subscriptionAmount}
                onChange={(e) => setSubscriptionAmount(Number(e.target.value))}
                className="w-full bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                ميعاد التجديد القادم
              </label>
              <input
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
                className="w-full bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
              الكورس القرآني <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              >
                {COMMON_COURSES.map((c) => (
                  <option key={c} value={c} className="bg-[#0B3D2E] text-white">
                    {c}
                  </option>
                ))}
                <option value="other" className="bg-[#0B3D2E] text-white">
                  + كورس مخصص آخر...
                </option>
              </select>
              <BookOpen className="w-4 h-4 text-[#D4AF37]/60 absolute left-3 top-3 pointer-events-none" />
            </div>

            {course === 'other' && (
              <input
                type="text"
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                placeholder="اكتب اسم الكورس المخصص..."
                className="mt-2 w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
              حالة الرسوم الشهرية <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFeeStatus('paid')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold cursor-pointer transition border ${
                  feeStatus === 'paid'
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-400'
                    : 'bg-[#07241B] text-slate-400 border-white/10 hover:border-emerald-500/40'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>دَفَعَ (مسدد)</span>
              </button>

              <button
                type="button"
                onClick={() => setFeeStatus('unpaid')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold cursor-pointer transition border ${
                  feeStatus === 'unpaid'
                    ? 'bg-amber-600/30 text-amber-300 border-amber-400'
                    : 'bg-[#07241B] text-slate-400 border-white/10 hover:border-amber-500/40'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>لم يدفع بعد</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold text-[#D4AF37] mb-2">
              بيانات ولي الأمر (للدخول والمتابعة عبر الواتساب)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  اسم ولي الأمر
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="مثال: خالد العتيبي"
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  رقم واتساب ولي الأمر
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="مثال: +966501112233"
                  dir="ltr"
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-white placeholder-slate-400 text-right focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {teachers.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                المعلم المشرف على الطالب
              </label>
              <div className="relative">
                <select
                  value={assignedTeacherId}
                  onChange={(e) => setAssignedTeacherId(e.target.value)}
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="" className="bg-[#0B3D2E] text-slate-300">
                    -- اختر المعلم المشرف --
                  </option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0B3D2E] text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
                <UserCheck className="w-4 h-4 text-[#D4AF37]/60 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
              ملاحظات إضافية
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: يحفظ جزء عم، يحتاج تركيز على أحكام المد..."
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
              />
              <FileText className="w-4 h-4 text-[#D4AF37]/60 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D4AF37]/25">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-medium transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl gold-gradient-btn font-bold text-sm shadow-md cursor-pointer transition"
            >
              {isEditing ? 'حفظ التعديلات' : 'إضافة الطالب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
