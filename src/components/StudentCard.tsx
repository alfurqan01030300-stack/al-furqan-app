import React from 'react';
import {
  User,
  BookOpen,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Star,
  Clock,
} from 'lucide-react';
import { Student } from '../types';
import { getDaysUntilDate } from '../utils/storage';

interface StudentCardProps {
  student: Student;
  onClick: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, onClick }) => {
  const isPaid = student.feeStatus === 'paid';
  const stars = student.stars ?? 0;
  const completedJuz = student.completedJuz ?? 0;
  const progressPercent = Math.min(100, Math.round((completedJuz / 30) * 100));
  const daysUntilDue = getDaysUntilDate(student.nextPaymentDate);
  const paymentDueSoon = daysUntilDue !== null && daysUntilDue <= 3;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative bg-gradient-to-b from-[#104A39]/80 to-[#0B3D2E]/90 hover:from-[#145A43] hover:to-[#0E4937] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-2xl p-5 shadow-lg hover:shadow-[0_8px_30px_rgba(212,175,55,0.25)] transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Student Avatar & Basic Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#07241B] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-inner group-hover:scale-105 transition">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white font-amiri group-hover:text-[#F3E5AB] transition truncate">
              {student.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
              {student.age && <span>السن: {student.age}</span>}
              <span className="inline-flex items-center gap-1 text-[#D4AF37] font-bold">
                <Star className="w-3 h-3 fill-[#D4AF37]" />
                {stars}/10
              </span>
            </div>
          </div>
        </div>

        {/* Fee Status Badge */}
        <div className="shrink-0">
          {isPaid ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>دَفَعَ</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>لم يدفع</span>
            </span>
          )}
        </div>
      </div>

      {/* Course & Current Surah */}
      <div className="bg-[#07241B]/60 rounded-xl p-2.5 border border-[#D4AF37]/15 my-2.5 space-y-2">
        <div className="flex items-center gap-2 text-xs text-[#F3E5AB] font-medium">
          <BookOpen className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span className="truncate">{student.course}</span>
        </div>

        {/* Mini Memorization Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
            <span>الحفظ: {completedJuz} / 30 جزء</span>
            <span className="text-[#D4AF37] font-semibold truncate max-w-[130px]">
              {student.currentSurah || 'سورة الفاتحة'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#0B3D2E] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-[#F3E5AB] to-[#D4AF37]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3-day payment renewal reminder badge */}
      {paymentDueSoon && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-200 bg-amber-500/20 border border-amber-400/40 rounded-lg px-2.5 py-1 mb-2">
          <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>
            {daysUntilDue! < 0
              ? `تأخر التجديد (${student.nextPaymentDate})`
              : daysUntilDue === 0
              ? 'موعد التجديد اليوم!'
              : `متبقي ${daysUntilDue} أيام على التجديد`}
          </span>
        </div>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#D4AF37]/15 text-xs">
        <span className="text-slate-400 truncate">
          ولي الأمر: <strong className="text-slate-200">{student.parentName || '-'}</strong>
        </span>

        <div className="flex items-center gap-1 text-[#D4AF37] font-semibold group-hover:translate-x-[-4px] transition shrink-0">
          <span>فتح الملف</span>
          <ChevronLeft className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
