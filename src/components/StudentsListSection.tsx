import React, { useState } from 'react';
import { Users, UserPlus, Search, CheckCircle2, AlertCircle, Filter, Sparkles } from 'lucide-react';
import { Student } from '../types';
import { StudentCard } from './StudentCard';

interface StudentsListSectionProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onAddNewStudent: () => void;
  onOpenTrialModal?: () => void;
}

export const StudentsListSection: React.FC<StudentsListSectionProps> = ({
  students,
  onSelectStudent,
  onAddNewStudent,
  onOpenTrialModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.course && s.course.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.parentName && s.parentName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'paid') return s.feeStatus === 'paid';
    if (statusFilter === 'unpaid') return s.feeStatus === 'unpaid';
    return true;
  });

  const paidCount = students.filter((s) => s.feeStatus === 'paid').length;
  const unpaidCount = students.filter((s) => s.feeStatus === 'unpaid').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Prominent Large Hero Banner for "حصة تجريبية" */}
      {onOpenTrialModal && (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#145A43] via-[#0B3D2E] to-[#145A43] border-2 border-[#D4AF37] rounded-3xl p-5 sm:p-7 shadow-[0_10px_30px_rgba(212,175,55,0.25)] flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-right">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-[#07241B] flex items-center justify-center font-bold shadow-lg">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#07241B] tracking-wide">
                  عرض خاص ومجاني 100%
                </span>
                <span className="text-xs text-[#F3E5AB]">لجميع الأعمار والمستويات</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-amiri text-white tracking-wide">
                هل ترغب في تجربة حلقة قرآنية مجانية قبل التسجيل؟
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                سجل بيانات الطالب الآن في ثوانٍ معدودة، وسيتم التواصل معك مباشرة لتحديد موعد الحصة التجريبية مع أحد مشايخ أو معلمات الأكاديمية.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTrialModal}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl text-sm sm:text-base font-extrabold text-[#07241B] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#F3E5AB] shadow-[0_6px_25px_rgba(212,175,55,0.5)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.7)] cursor-pointer transition active:scale-95 border-2 border-white/70"
            title="فتح استمارة تسجيل الحصة التجريبية"
          >
            <Sparkles className="w-5 h-5 text-[#07241B]" />
            <span className="tracking-wide">حصة تجريبية (سجل مجاناً الآن)</span>
          </button>
        </div>
      )}

      {/* Top Banner & Add Student Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#145A43] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-amiri text-white">
              قائمة الطلاب وحلقات الحفظ ({students.length})
            </h2>
            <p className="text-xs text-[#D4AF37]/80">
              اضغط على بطاقة أي طالب لفتح ملفه الشخصي ومتابعة التسميع وإرسال التقارير لولي أمره
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenTrialModal && (
            <button
              onClick={onOpenTrialModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-xs bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/50 shadow transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>حصة تجريبية</span>
            </button>
          )}

          {/* Button: + إضافة طالب جديد */}
          <button
            onClick={onAddNewStudent}
            className="gold-gradient-btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow cursor-pointer transition active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-[#07241B]" />
            <span>+ إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0B3D2E]/80 border border-[#D4AF37]/25 rounded-2xl p-4 shadow flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، الكورس، الهاتف، ولي الأمر..."
            className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
          />
          <Search className="w-4 h-4 text-[#D4AF37]/60 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        {/* Payment Status Badges & Quick Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 text-xs text-slate-400 ml-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>حالة الرسوم:</span>
          </div>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#D4AF37] text-[#07241B] font-bold'
                : 'bg-[#07241B] text-slate-300 hover:text-white border border-[#D4AF37]/20'
            }`}
          >
            الكل ({students.length})
          </button>

          <button
            onClick={() => setStatusFilter('paid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'bg-[#07241B] text-emerald-400 hover:text-white border border-emerald-500/30'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>دَفَعَ ({paidCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              statusFilter === 'unpaid'
                ? 'bg-amber-600 text-white font-bold shadow'
                : 'bg-[#07241B] text-amber-400 hover:text-white border border-amber-500/30'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>لم يدفع بعد ({unpaidCount})</span>
          </button>
        </div>
      </div>

      {/* Cards List Only */}
      {filteredStudents.length === 0 ? (
        <div className="bg-[#0B3D2E]/50 border border-dashed border-[#D4AF37]/30 rounded-2xl p-12 text-center text-slate-300">
          <Users className="w-12 h-12 text-[#D4AF37]/50 mx-auto mb-3" />
          <p className="text-base font-bold font-amiri text-white">
            {students.length === 0
              ? 'لا يوجد طلاب مسجلون حالياً (0 طالب)'
              : 'لا يوجد طلاب مطابقين للبحث'}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {students.length === 0
              ? 'ابدأ بإضافة أول طالب بيدك وسيتزامن فوراً على جميع أجهزتك'
              : 'تأكد من كتابة الاسم بصورة صحيحة أو قم بإضافة طالب جديد'}
          </p>
          <button
            onClick={onAddNewStudent}
            className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            + إضافة طالب جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={() => onSelectStudent(student)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
