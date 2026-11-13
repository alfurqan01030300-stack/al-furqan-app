import React, { useState } from 'react';
import {
  Phone,
  LogIn,
  LogOut,
  BookOpen,
  Star,
  Calendar,
  CreditCard,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import {
  AcademySettings,
  AttendanceRecord,
  CertificateRecord,
  PaymentRecord,
  Student,
  Teacher,
  TeacherRating,
} from '../types';
import { getDaysUntilDate, getTodayDateStr, normalizePhoneForMatch } from '../utils/storage';

interface ParentPortalViewProps {
  students: Student[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  teacherRatings: TeacherRating[];
  settings: AcademySettings;
  loggedParentPhone: string;
  onLoginParent: (phone: string) => void;
  onLogoutParent: () => void;
  onSubmitTeacherRating: (rating: Omit<TeacherRating, 'id' | 'createdAt'>) => void;
  onOpenCertificate: (student: Student, cert?: CertificateRecord) => void;
  onViewReceipt: (payment: PaymentRecord) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  students,
  teachers,
  attendance,
  payments,
  teacherRatings,
  settings,
  loggedParentPhone,
  onLoginParent,
  onLogoutParent,
  onSubmitTeacherRating,
  onOpenCertificate,
  onViewReceipt,
}) => {
  const [phoneInput, setPhoneInput] = useState(loggedParentPhone || '');
  const [loginError, setLoginError] = useState('');
  const [ratingByTeacher, setRatingByTeacher] = useState<Record<string, number>>({});
  const [commentByTeacher, setCommentByTeacher] = useState<Record<string, string>>({});
  const [ratingSubmittedFor, setRatingSubmittedFor] = useState<Record<string, boolean>>({});

  const currency = settings.currency || 'ر.س';

  const normalizedLogged = normalizePhoneForMatch(loggedParentPhone);
  const myChildren = normalizedLogged
    ? students.filter(
        (s) =>
          normalizePhoneForMatch(s.parentPhone) === normalizedLogged ||
          normalizePhoneForMatch(s.phone) === normalizedLogged
      )
    : [];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const norm = normalizePhoneForMatch(phoneInput);
    if (norm.length < 6) {
      setLoginError('يرجى إدخال رقم هاتف صحيح مكون من 6 أرقام على الأقل.');
      return;
    }
    const matched = students.filter(
      (s) =>
        normalizePhoneForMatch(s.parentPhone) === norm ||
        normalizePhoneForMatch(s.phone) === norm
    );
    if (matched.length === 0) {
      setLoginError('لم يتم العثور على طالب مسجل بهذا الرقم. تأكد من إدخال رقم ولي الأمر المسجل بالأكاديمية.');
      return;
    }
    setLoginError('');
    onLoginParent(phoneInput.trim());
  };

  if (!loggedParentPhone || myChildren.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-8 animate-fadeIn">
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B38728] text-[#07241B] flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold font-amiri text-white">بوابة ولي الأمر</h2>
            <p className="text-xs text-[#D4AF37]">
              ادخل برقم هاتفك المسجل فقط لمتابعة مستوى ابنك، الحضور والغياب، الاشتراكات، وتقييم المعلم
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                رقم هاتف ولي الأمر فقط
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="مثال: +966501112233 أو 0501112233"
                  className="w-full bg-[#07241B] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-white text-right font-mono focus:outline-none focus:border-[#D4AF37]"
                />
                <Phone className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3.5" />
              </div>
            </div>

            {loginError && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full gold-gradient-btn py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition active:scale-95"
            >
              <LogIn className="w-4 h-4 text-[#07241B]" />
              <span>دخول ومتابعة ملف الابن</span>
            </button>
          </form>

          {/* Quick sample phone chips so parent/tester can verify easily */}
          {students.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-[11px] text-slate-400 text-center">
                أرقام مسجلة للتجربة السريعة:
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {students.slice(0, 3).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      const ph = st.parentPhone || st.phone;
                      setPhoneInput(ph);
                      onLoginParent(ph);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#07241B] hover:bg-[#145A43] border border-[#D4AF37]/30 text-[11px] text-[#F3E5AB] font-mono cursor-pointer transition"
                  >
                    {st.name.split(' ')[0]}: {st.parentPhone || st.phone}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B3D2E] border-2 border-[#D4AF37]/40 rounded-3xl p-5 shadow-xl">
        <div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
            حساب ولي الأمر الموثق • يظهر أبناؤك فقط
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-amiri text-white mt-1">
            أهلاً بك يا ولي أمر {myChildren[0].parentName || myChildren[0].name}
          </h2>
          <p className="text-xs text-[#D4AF37] font-mono" dir="ltr">
            {loggedParentPhone}
          </p>
        </div>

        <button
          type="button"
          onClick={onLogoutParent}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold cursor-pointer transition"
        >
          <LogOut className="w-4 h-4 text-[#D4AF37]" />
          <span>تسجيل خروج</span>
        </button>
      </div>

      {/* Child Cards (ONLY matched children) */}
      {myChildren.map((child) => {
        const completedJuz = child.completedJuz ?? 0;
        const remainingJuz = Math.max(0, 30 - completedJuz);
        const progressPercent = Math.min(100, Math.round((completedJuz / 30) * 100));
        const stars = child.stars ?? 0;
        const childAttendance = attendance.filter((a) => a.studentId === child.id).slice(0, 10);
        const childPayments = payments.filter((p) => p.studentId === child.id);
        const daysUntilDue = getDaysUntilDate(child.nextPaymentDate);
        const assignedTeacher = teachers.find((t) => t.id === child.assignedTeacherId);
        const teacherKey = `${child.id}-${assignedTeacher?.id || 'general'}`;
        const chosenRating = ratingByTeacher[teacherKey] ?? 5;

        return (
          <div
            key={child.id}
            className="bg-[#0B3D2E] border-2 border-[#D4AF37]/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6"
          >
            {/* Child Identity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/20">
              <div>
                <h3 className="text-2xl font-bold font-amiri text-white">{child.name}</h3>
                <p className="text-xs text-[#F3E5AB] mt-0.5">{child.course}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-[#07241B] border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37]">
                  النجوم الحالية: {stars} / 10 ⭐
                </span>
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    child.feeStatus === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}
                >
                  {child.feeStatus === 'paid' ? 'الاشتراك: مسدد ✓' : 'الاشتراك: مستحق السداد'}
                </span>
              </div>
            </div>

            {/* 3-day payment notice */}
            {daysUntilDue !== null && daysUntilDue <= 3 && (
              <div className="bg-amber-500/15 border border-amber-400/50 rounded-2xl p-3.5 text-xs text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {daysUntilDue < 0
                    ? `تنبيه: موعد تجديد اشتراك (${child.name}) فات منذ ${Math.abs(daysUntilDue)} يوم (${child.nextPaymentDate}).`
                    : daysUntilDue === 0
                    ? `تنبيه: موعد تجديد اشتراك (${child.name}) اليوم (${child.nextPaymentDate}).`
                    : `تنبيه: متبقي ${daysUntilDue} أيام على موعد تجديد الاشتراك (${child.nextPaymentDate}).`}
                </span>
              </div>
            )}

            {/* Memorization Progress Bar */}
            <div className="bg-[#07241B]/80 border border-[#D4AF37]/25 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                  <span>مستوى الحفظ في القرآن الكريم</span>
                </div>
                <span className="text-xs font-bold text-[#F3E5AB]">
                  السورة الحالية: {child.currentSurah || 'سورة الفاتحة'}
                </span>
              </div>

              <div className="w-full h-4 bg-[#0B3D2E] rounded-full overflow-hidden border border-[#D4AF37]/30">
                <div
                  className="h-full bg-gradient-to-l from-[#F3E5AB] via-[#D4AF37] to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>
                  أتم حفظ: <strong className="text-emerald-300">{completedJuz} جزء</strong> ({progressPercent}%)
                </span>
                <span>
                  المتبقي: <strong className="text-[#F3E5AB]">{remainingJuz} جزء</strong> من 30 جزءاً
                </span>
              </div>
            </div>

            {/* Grid: Attendance Log + Certificates & Receipts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Attendance Log */}
              <div className="bg-[#07241B]/70 border border-[#D4AF37]/20 rounded-2xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>سجل الحضور والغياب</span>
                </h4>

                {childAttendance.length === 0 ? (
                  <p className="text-xs text-slate-400">لم تُسجل حصص حضور أو غياب بعد.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {childAttendance.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between text-xs bg-[#0B3D2E]/80 px-3 py-2 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center gap-2">
                          {rec.status === 'present' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className={rec.status === 'present' ? 'text-emerald-300 font-bold' : 'text-red-300 font-bold'}>
                            {rec.status === 'present' ? 'حضر الحلقة' : 'غاب عن الحلقة'}
                          </span>
                        </div>
                        <span className="font-mono text-slate-400" dir="ltr">
                          {rec.date}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certificates & Payment Receipts */}
              <div className="bg-[#07241B]/70 border border-[#D4AF37]/20 rounded-2xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  <span>الشهادات وإيصالات الدفع</span>
                </h4>

                {child.certificates && child.certificates.length > 0 ? (
                  <div className="space-y-2">
                    {child.certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between gap-2 bg-[#0B3D2E] px-3 py-2 rounded-xl border border-[#D4AF37]/30 text-xs"
                      >
                        <span className="font-bold text-white truncate">{cert.juzName}</span>
                        <button
                          type="button"
                          onClick={() => onOpenCertificate(child, cert)}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-[#D4AF37] text-[#07241B] font-extrabold cursor-pointer"
                        >
                          تحميل الشهادة
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">لم تصدر شهادات إتمام لهذا الطالب بعد.</p>
                )}

                {childPayments.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    {childPayments.slice(0, 3).map((pay) => (
                      <div
                        key={pay.id}
                        className="flex items-center justify-between gap-2 bg-[#0B3D2E] px-3 py-2 rounded-xl border border-emerald-500/30 text-xs"
                      >
                        <span className="text-emerald-300 font-bold">
                          إيصال {pay.amount} {currency} ({pay.date})
                        </span>
                        <button
                          type="button"
                          onClick={() => onViewReceipt(pay)}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-200 font-bold cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>عرض</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>
                    موعد التجديد القادم: <strong className="text-white">{child.nextPaymentDate || 'غير محدد'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 1-5 Star Teacher Rating Widget */}
            {assignedTeacher && (
              <div className="bg-gradient-to-l from-[#145A43]/60 to-[#07241B] border border-[#D4AF37]/35 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                      <span>تقييم معلم الحلقة: {assignedTeacher.name}</span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      رأيك يهمنا لتحسين جودة التحفيظ — اختر من 1 إلى 5 نجوم بعد الحصة
                    </p>
                  </div>

                  {/* Interactive 1-5 Stars */}
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() =>
                          setRatingByTeacher((prev) => ({ ...prev, [teacherKey]: starNum }))
                        }
                        className="p-1 cursor-pointer transition hover:scale-110"
                        title={`${starNum} نجوم`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            starNum <= chosenRating
                              ? 'text-[#D4AF37] fill-[#D4AF37]'
                              : 'text-slate-500'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={commentByTeacher[teacherKey] || ''}
                    onChange={(e) =>
                      setCommentByTeacher((prev) => ({ ...prev, [teacherKey]: e.target.value }))
                    }
                    placeholder="أضف تعليقاً أو كلمة شكر للمعلم (اختياري)..."
                    className="flex-1 bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onSubmitTeacherRating({
                        teacherId: assignedTeacher.id,
                        teacherName: assignedTeacher.name,
                        studentId: child.id,
                        studentName: child.name,
                        parentPhone: loggedParentPhone,
                        rating: chosenRating,
                        comment: (commentByTeacher[teacherKey] || '').trim(),
                        date: getTodayDateStr(),
                      });
                      setRatingSubmittedFor((prev) => ({ ...prev, [teacherKey]: true }));
                      setCommentByTeacher((prev) => ({ ...prev, [teacherKey]: '' }));
                    }}
                    className="gold-gradient-btn px-5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Send className="w-3.5 h-3.5 text-[#07241B]" />
                    <span>
                      {ratingSubmittedFor[teacherKey] ? 'تم إرسال التقييم ✓' : 'إرسال التقييم'}
                    </span>
                  </button>
                </div>

                {/* Previous ratings count notice */}
                {teacherRatings.filter((r) => r.studentId === child.id).length > 0 && (
                  <p className="text-[11px] text-emerald-300">
                    ✓ تم تسجيل {teacherRatings.filter((r) => r.studentId === child.id).length} تقييم سابق لهذا المعلم في قاعدة البيانات.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
