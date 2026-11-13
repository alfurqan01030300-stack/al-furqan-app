import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Edit3,
  UserPlus,
  Phone,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Send,
  MessageSquare,
  Sparkles,
  Calendar,
  Award,
  History,
  Trash2,
  Check,
  Star,
  XCircle,
  Receipt,
  CreditCard,
  Clock,
  Save,
} from 'lucide-react';
import {
  AcademySettings,
  AttendanceRecord,
  AttendanceStatus,
  CertificateRecord,
  FollowUpReport,
  PaymentRecord,
  Student,
  StudentLevel,
  Teacher,
} from '../types';
import { cleanWhatsAppNumber, getDaysUntilDate, getTodayDateStr } from '../utils/storage';

interface StudentProfileProps {
  student: Student;
  onBack: () => void;
  onEditStudent: () => void;
  onAddNewStudent: () => void;
  onUpdateStudent: (updated: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  teachers: Teacher[];
  academyName: string;
  settings: AcademySettings;
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  onMarkAttendance: (student: Student, status: AttendanceStatus) => void;
  onAddStar: (student: Student) => { reachedTen: boolean; newStars: number };
  onRecordPayment: (student: Student, amount?: number, notes?: string) => void;
  onViewReceipt: (payment: PaymentRecord) => void;
  onOpenCertificateModal: (student: Student, cert?: CertificateRecord) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  student,
  onBack,
  onEditStudent,
  onAddNewStudent,
  onUpdateStudent,
  onDeleteStudent,
  teachers,
  academyName,
  settings,
  attendance,
  payments,
  onMarkAttendance,
  onAddStar,
  onRecordPayment,
  onViewReceipt,
  onOpenCertificateModal,
}) => {
  const todayStr = getTodayDateStr();
  const currency = settings.currency || 'ر.س';

  // Memorization progress local editor state synced with student
  const [completedJuz, setCompletedJuz] = useState<number>(student.completedJuz ?? 0);
  const [currentSurah, setCurrentSurah] = useState<string>(student.currentSurah || 'سورة الفاتحة');
  const [progressSaved, setProgressSaved] = useState(false);

  // Payment input state
  const [payAmount, setPayAmount] = useState<number>(
    student.subscriptionAmount || settings.defaultSubscriptionAmount || 250
  );
  const [payNotes, setPayNotes] = useState('اشتراك الحلقات القرآنية الشهري');

  // Star celebration banner
  const [starAwardAlert, setStarAwardAlert] = useState<string | null>(null);

  // Follow-up form state
  const [reportDate, setReportDate] = useState(todayStr);
  const [newMemorization, setNewMemorization] = useState('سورة البقرة من الآية 1 إلى الآية 15');
  const [nearRevision, setNearRevision] = useState('سورة آل عمران');
  const [farRevision, setFarRevision] = useState('جزء عم كاملاً');
  const [level, setLevel] = useState<StudentLevel>('excellent');
  const [teacherNote, setTeacherNote] = useState(
    'طالب مجتهد، نرجو الاستمرار في المراجعة اليومية لتثبيت الحفظ.'
  );
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [saveReportSuccess, setSaveReportSuccess] = useState(false);

  useEffect(() => {
    setCompletedJuz(student.completedJuz ?? 0);
    setCurrentSurah(student.currentSurah || 'سورة الفاتحة');
    setPayAmount(student.subscriptionAmount || settings.defaultSubscriptionAmount || 250);
  }, [student.id, student.completedJuz, student.currentSurah, student.subscriptionAmount, settings.defaultSubscriptionAmount]);

  const remainingJuz = Math.max(0, 30 - completedJuz);
  const progressPercent = Math.min(100, Math.round((completedJuz / 30) * 100));
  const stars = student.stars ?? 0;

  const studentAttendance = attendance.filter((a) => a.studentId === student.id);
  const todayAttendance = studentAttendance.find((a) => a.date === todayStr);
  const studentPayments = payments.filter((p) => p.studentId === student.id);

  const daysUntilDue = getDaysUntilDate(student.nextPaymentDate);
  const isPaymentSoonOrOverdue = daysUntilDue !== null && daysUntilDue <= 3;

  const assignedTeacher = teachers.find((t) => t.id === student.assignedTeacherId);
  const teacherNameString = assignedTeacher ? assignedTeacher.name : 'إدارة حلقات التحفيظ';
  const parentPhoneClean = cleanWhatsAppNumber(student.parentPhone || student.phone);

  const handleSaveMemorizationProgress = () => {
    onUpdateStudent({
      ...student,
      completedJuz: Math.max(0, Math.min(30, Number(completedJuz) || 0)),
      currentSurah: currentSurah.trim() || 'سورة الفاتحة',
    });
    setProgressSaved(true);
    setTimeout(() => setProgressSaved(false), 2500);
  };

  const handleToggleFeeStatus = () => {
    const newStatus = student.feeStatus === 'paid' ? 'unpaid' : 'paid';
    onUpdateStudent({
      ...student,
      feeStatus: newStatus,
    });
  };

  const getLevelArabic = (lvl: StudentLevel) => {
    switch (lvl) {
      case 'excellent':
        return 'ممتاز (متقن للأحكام والتلاوة) ⭐⭐⭐⭐⭐';
      case 'medium':
        return 'متوسط (يحتاج مزيداً من التكرار) ⭐⭐⭐';
      case 'weak':
        return 'يحتاج إلى متابعة واهتمام أكثر ⭐';
    }
  };

  const generateFormalMessage = () => {
    return `🌿 *تقرير متابعة حفظ وتلاوة القرآن الكريم* 🌿
*${academyName}*
═════════════════════════
👤 *اسم الطالب:* ${student.name}
👨‍👦 *المكرم ولي أمر الطالب:* ${student.parentName || student.name}
📖 *الكورس:* ${student.course}
📊 *التقدم بالقرآن:* أتم ${completedJuz} جزء • السورة الحالية: ${currentSurah}
⭐ *رصيد النجوم:* ${stars} / 10
📅 *التاريخ:* ${reportDate}
═════════════════════════
🌟 *الحفظ الجديد:*
${newMemorization || 'تم الاستماع وتصحيح التلاوة'}

🔄 *الماضي القريب:*
${nearRevision || 'مراجعة مقررة'}

📚 *الماضي البعيد:*
${farRevision || 'تثبيت مستمر'}

📊 *مستوى الطالب اليوم:*
${getLevelArabic(level)}

✍️ *ملاحظة وتوجيه المعلم:*
${teacherNote || 'نسأل الله له التوفيق والسداد'}
─────────────────────────
🌱 قال رسول الله ﷺ: «خَيرُكُم مَن تَعلَّمَ القُرآنَ وعَلَّمَهُ»
مع أطيب تحيات:
${teacherNameString}
*${academyName}*
═════════════════════════`.trim();
  };

  const formalMessage = generateFormalMessage();

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(formalMessage);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = formalMessage;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encodedMessage = encodeURIComponent(formalMessage);
    const url = parentPhoneClean
      ? `https://wa.me/${parentPhoneClean}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const handleSaveReportToHistory = () => {
    const newReport: FollowUpReport = {
      id: `rep-${Date.now()}`,
      date: reportDate,
      newMemorization,
      nearRevision,
      farRevision,
      level,
      teacherNote,
      createdAt: Date.now(),
    };
    const updatedReports = [newReport, ...(student.reports || [])];
    onUpdateStudent({
      ...student,
      reports: updatedReports,
    });
    setSaveReportSuccess(true);
    setTimeout(() => setSaveReportSuccess(false), 2500);
  };

  const absenceWhatsAppMessage = encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${student.name})،\nنحيطكم علماً بأن الطالب تغيّب النهاردة (${todayStr}) عن حلقة تحفيظ القرآن الكريم.\nنرجو التواصل للاطمئنان عليه.\n${academyName}`
  );

  const renewalWhatsAppMessage = encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب الكريم (${student.name})،\nنذكركم بلطف أن موعد تجديد الاشتراك الشهري في ${academyName} قد اقترب (${student.nextPaymentDate}) بمبلغ (${payAmount} ${currency}).\nجزاكم الله خيراً وبارك في أبنائكم.`
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B3D2E]/90 border border-[#D4AF37]/30 rounded-2xl p-4 shadow-md backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs sm:text-sm font-semibold transition cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
          <span>العودة لقائمة الطلاب</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onOpenCertificateModal(student)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-[#F3E5AB] border border-[#D4AF37]/60 text-xs sm:text-sm font-bold shadow transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span>إصدار شهادة إتمام جزء PDF</span>
          </button>

          <button
            type="button"
            onClick={onEditStudent}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/50 text-xs sm:text-sm font-bold shadow transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-[#D4AF37]" />
            <span>تعديل بيانات الطالب</span>
          </button>

          <button
            type="button"
            onClick={onAddNewStudent}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl gold-gradient-btn text-xs sm:text-sm font-bold shadow transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#07241B]" />
            <span>+ إضافة طالب جديد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(`هل أنت متأكد من رغبتك في حذف ملف الطالب "${student.name}"؟`)) {
                onDeleteStudent(student.id);
              }
            }}
            className="p-2 rounded-xl bg-red-900/30 hover:bg-red-800/40 text-red-300 border border-red-500/30 transition cursor-pointer"
            title="حذف الطالب"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Student Details Hero Card */}
      <div className="bg-gradient-to-br from-[#104A39] via-[#0B3D2E] to-[#07241B] border-2 border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#D4AF37]/20">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-[#D4AF37] font-semibold tracking-wider">
                ملف الطالب القرآني
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-300 text-xs">
                تاريخ التسجيل: {student.registeredDate || '2026-09-01'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-amiri tracking-wide">
              {student.name}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left">
              <p className="text-xs text-slate-300 mb-1">حالة الرسوم الشهرية:</p>
              <button
                type="button"
                onClick={handleToggleFeeStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border shadow-lg transition cursor-pointer ${
                  student.feeStatus === 'paid'
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-400 hover:bg-emerald-600/40'
                    : 'bg-amber-600/30 text-amber-300 border-amber-400 hover:bg-amber-600/40 animate-pulse'
                }`}
              >
                {student.feeStatus === 'paid' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>دَفَعَ (مسدد)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>لم يدفع بعد (انقر للتبديل)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 6 Key Grid Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          <div className="bg-[#07241B]/70 rounded-2xl p-4 border border-[#D4AF37]/20">
            <span className="text-xs text-slate-400 block mb-1">السن (العمر):</span>
            <p className="text-base font-bold text-white">
              {student.age ? `${student.age} سنة` : 'غير محدد'}
            </p>
          </div>

          <div className="bg-[#07241B]/70 rounded-2xl p-4 border border-[#D4AF37]/20">
            <span className="text-xs text-slate-400 block mb-1">رقم هاتف الطالب / الواتساب:</span>
            {student.phone ? (
              <a
                href={`https://wa.me/${cleanWhatsAppNumber(student.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="text-base font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-2 font-mono"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                <span>{student.phone}</span>
              </a>
            ) : (
              <p className="text-sm text-slate-400">غير مسجل</p>
            )}
          </div>

          <div className="bg-[#07241B]/70 rounded-2xl p-4 border border-[#D4AF37]/20">
            <span className="text-xs text-slate-400 block mb-1">الكورس القرآني:</span>
            <p className="text-base font-bold text-[#F3E5AB] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>{student.course}</span>
            </p>
          </div>

          <div className="bg-[#07241B]/70 rounded-2xl p-4 border border-[#D4AF37]/20">
            <span className="text-xs text-slate-400 block mb-1">اسم ولي الأمر:</span>
            <p className="text-base font-bold text-white">{student.parentName || student.name}</p>
          </div>

          <div className="bg-[#07241B]/70 rounded-2xl p-4 border border-[#D4AF37]/20">
            <span className="text-xs text-slate-400 block mb-1">رقم واتساب ولي الأمر:</span>
            {student.parentPhone ? (
              <a
                href={`https://wa.me/${cleanWhatsAppNumber(student.parentPhone)}`}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="text-base font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-2 font-mono"
              >
                <MessageSquare className="w-4 h-4 text-[#25D366]" />
                <span>{student.parentPhone}</span>
              </a>
            ) : (
              <p className="text-sm text-slate-400">نفس هاتف الطالب</p>
            )}
          </div>

          <div className="bg-[#07241B]/70 rounded-2xl p-4 border border-[#D4AF37]/20">
            <span className="text-xs text-slate-400 block mb-1">المعلم المشرف:</span>
            <p className="text-sm font-bold text-white">
              {assignedTeacher ? assignedTeacher.name : 'حلقة عامة / غير معين'}
            </p>
          </div>
        </div>
      </div>

      {/* NEW PRO FEATURES GRID: Memorization Progress + Stars & Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Quran Memorization Progress Tracker */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-lg font-bold font-amiri text-white">
                متابعة الحفظ وتقدم القرآن الكريم
              </h3>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40">
              {progressPercent}% مكتمل
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 bg-[#07241B]/80 p-4 rounded-2xl border border-[#D4AF37]/20">
            <div className="w-full h-4 bg-[#0B3D2E] rounded-full overflow-hidden border border-[#D4AF37]/40">
              <div
                className="h-full bg-gradient-to-l from-[#F3E5AB] via-[#D4AF37] to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-bold">
                خلّص: {completedJuz} جزء
              </span>
              <span className="text-[#F3E5AB] font-bold">
                فاضل له: {remainingJuz} جزء
              </span>
            </div>
          </div>

          {/* Editable Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#F3E5AB] font-semibold mb-1">
                عدد الأجزاء المحفوظة (0 - 30):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCompletedJuz((v) => Math.max(0, v - 1))}
                  className="px-3 py-2 rounded-xl bg-[#07241B] border border-[#D4AF37]/30 text-white font-bold cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={completedJuz}
                  onChange={(e) => setCompletedJuz(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-center text-white font-bold"
                />
                <button
                  type="button"
                  onClick={() => setCompletedJuz((v) => Math.min(30, v + 1))}
                  className="px-3 py-2 rounded-xl bg-[#07241B] border border-[#D4AF37]/30 text-white font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#F3E5AB] font-semibold mb-1">
                السورة الحالية التي يقف عندها:
              </label>
              <input
                type="text"
                value={currentSurah}
                onChange={(e) => setCurrentSurah(e.target.value)}
                placeholder="مثال: سورة الكهف"
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveMemorizationProgress}
            className="w-full py-2.5 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/50 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
          >
            {progressSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>تم حفظ تقدم الحفظ في Firestore ✓</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#D4AF37]" />
                <span>حفظ وتحديث تقدم الحفظ</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Stars & Rewards Panel */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                <h3 className="text-lg font-bold font-amiri text-white">
                  نظام النقاط والمكافآت (0 - 10 نجوم)
                </h3>
              </div>
              <span className="text-xs font-extrabold text-[#D4AF37]">
                {stars} / 10 ⭐
              </span>
            </div>

            {/* 10 Stars Visual Row */}
            <div className="bg-[#07241B]/80 p-4 rounded-2xl border border-[#D4AF37]/20 space-y-3">
              <div className="flex items-center justify-center flex-wrap gap-2">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const filled = idx < stars;
                  return (
                    <Star
                      key={idx}
                      className={`w-7 h-7 transition-transform ${
                        filled
                          ? 'text-[#D4AF37] fill-[#D4AF37] scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                          : 'text-slate-600'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>مجموع الدورات المكتملة: <strong className="text-[#F3E5AB]">{student.starCyclesCompleted || 0}</strong></span>
                <span>إجمالي النجوم التاريخي: <strong className="text-emerald-300">{student.totalStarsEarned || stars}</strong></span>
              </div>
            </div>

            {starAwardAlert && (
              <div className="bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border-2 border-[#D4AF37] rounded-2xl p-3.5 text-xs space-y-2 animate-pulse">
                <p className="font-bold text-[#F3E5AB]">🎉 {starAwardAlert}</p>
                <button
                  type="button"
                  onClick={() => onOpenCertificateModal(student)}
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#07241B] font-extrabold cursor-pointer"
                >
                  طباعة / تحميل شهادة الـ 10 نجوم الآن
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              const res = onAddStar(student);
              if (res.reachedTen) {
                setStarAwardAlert(
                  `مبروك! وصل الطالب (${student.name}) إلى 10 نجوم ويستحق شهادة تقدير! تم تصفير النجوم لتبدأ دورة جديدة.`
                );
              }
            }}
            className="w-full gold-gradient-btn py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-[#07241B]" />
            <span>منح نجمة حفظ متميز للطالب (+1 ⭐)</span>
          </button>
        </div>
      </div>

      {/* Attendance & Payments / Receipts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Attendance Quick Log */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
            <h3 className="text-lg font-bold font-amiri text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              <span>الحضور والغياب اليوم ({todayStr})</span>
            </h3>
            {todayAttendance && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  todayAttendance.status === 'present'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {todayAttendance.status === 'present' ? 'حضر اليوم ✓' : 'غاب اليوم ✕'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onMarkAttendance(student, 'present')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                todayAttendance?.status === 'present'
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-[#07241B] text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حضر</span>
            </button>
            <button
              type="button"
              onClick={() => onMarkAttendance(student, 'absent')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                todayAttendance?.status === 'absent'
                  ? 'bg-red-600 text-white border-red-400'
                  : 'bg-[#07241B] text-red-300 border-red-500/30 hover:bg-red-600/20'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>غاب</span>
            </button>
          </div>

          {todayAttendance?.status === 'absent' && (
            <div className="bg-red-900/30 border border-red-500/40 rounded-2xl p-3 space-y-2">
              <p className="text-xs font-bold text-red-200">
                ⚠️ تنبيه: الطالب غاب اليوم — رسالة الواتساب لولي الأمر جاهزة:
              </p>
              <a
                href={`https://wa.me/${parentPhoneClean}?text=${absenceWhatsAppMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-[#07241B] text-xs font-extrabold transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>إرسال رسالة الغياب لولي الأمر (واتساب)</span>
              </a>
            </div>
          )}

          {studentAttendance.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
              {studentAttendance.slice(0, 6).map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between text-xs bg-[#07241B]/70 px-3 py-1.5 rounded-lg"
                >
                  <span className={rec.status === 'present' ? 'text-emerald-300 font-bold' : 'text-red-300 font-bold'}>
                    {rec.status === 'present' ? '✓ حضر الحصة' : '✕ غاب عن الحصة'}
                  </span>
                  <span className="font-mono text-slate-400" dir="ltr">
                    {rec.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4 & 5. Payment Alert, Record Payment & Receipts */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
            <h3 className="text-lg font-bold font-amiri text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#D4AF37]" />
              <span>الاشتراك الشهري وإيصال الدفع</span>
            </h3>
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              التجديد: {student.nextPaymentDate || 'غير محدد'}
            </span>
          </div>

          {/* 3-day payment reminder alert */}
          {isPaymentSoonOrOverdue && (
            <div className="bg-amber-500/15 border border-amber-400/50 rounded-2xl p-3 space-y-2">
              <p className="text-xs font-bold text-amber-200">
                ⏰ تنبيه تجديد الاشتراك:{' '}
                {daysUntilDue! < 0
                  ? `متأخر منذ ${Math.abs(daysUntilDue!)} يوم`
                  : daysUntilDue === 0
                  ? 'موعد التجديد اليوم!'
                  : `متبقي ${daysUntilDue} أيام على موعد الدفع`}
              </p>
              <a
                href={`https://wa.me/${parentPhoneClean}?text=${renewalWhatsAppMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-[#07241B] text-xs font-extrabold transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>إرسال تذكير تجديد الاشتراك لولي الأمر (واتساب)</span>
              </a>
            </div>
          )}

          {/* Record Payment Form */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-[#F3E5AB] font-semibold mb-1">المبلغ ({currency}):</label>
              <input
                type="number"
                min={1}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-[#F3E5AB] font-semibold mb-1">بيان الدفع:</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRecordPayment(student, payAmount, payNotes)}
            className="w-full gold-gradient-btn py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-[#07241B]" />
            <span>تسجيل الدفع الآن وإصدار إيصال شيك</span>
          </button>

          {studentPayments.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
              {studentPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between text-xs bg-[#07241B]/70 px-3 py-2 rounded-xl border border-emerald-500/20"
                >
                  <span className="text-emerald-300 font-bold">
                    {pay.amount} {pay.currency} • {pay.date}
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewReceipt(pay)}
                    className="px-2.5 py-1 rounded-lg bg-[#145A43] text-[#F3E5AB] font-bold cursor-pointer"
                  >
                    عرض / تحميل الإيصال
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Certificates History if any */}
      {student.certificates && student.certificates.length > 0 && (
        <div className="bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold font-amiri text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D4AF37]" />
              <span>الشهادات الصادرة للطالب ({student.certificates.length})</span>
            </h4>
            <button
              type="button"
              onClick={() => onOpenCertificateModal(student)}
              className="text-xs text-[#F3E5AB] underline cursor-pointer"
            >
              + إصدار شهادة جديدة
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {student.certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-[#07241B]/80 border border-[#D4AF37]/30 rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{cert.juzName}</p>
                  <p className="text-[11px] text-slate-400">{cert.completionDate}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCertificateModal(student, cert)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#07241B] font-extrabold cursor-pointer"
                >
                  PDF / طباعة
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PARENT FOLLOW-UP SECTION (استمارة متابعة وإرسال التقرير لولي الأمر) */}
      <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4AF37]/20">
          <div>
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-xl sm:text-2xl font-bold font-amiri text-white">
                استمارة متابعة وإرسال التقرير لولي الأمر
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              املأ استمارة الحفظ اليومية، وشاهد المعاينة الحية فوراً مع إمكانية الإرسال بضغطة زر إلى واتساب ولي الأمر
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-[#07241B] px-3 py-1.5 rounded-xl border border-[#D4AF37]/20">
            <span className="text-slate-400">المستلم:</span>
            <span className="font-bold text-[#F3E5AB]">{student.parentName || student.name}</span>
            <span dir="ltr" className="font-mono text-emerald-400 text-[11px]">
              ({student.parentPhone || student.phone || 'بدون رقم'})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>تاريخ التقييم / الحصة</span>
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">حفظ جديد</label>
              <input
                type="text"
                value={newMemorization}
                onChange={(e) => setNewMemorization(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">ماضي قريب</label>
              <input
                type="text"
                value={nearRevision}
                onChange={(e) => setNearRevision(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">ماضي بعيد</label>
              <input
                type="text"
                value={farRevision}
                onChange={(e) => setFarRevision(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-2">
                مستوى الطالب في هذه الحصة:
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setLevel('excellent')}
                  className={`py-3 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                    level === 'excellent'
                      ? 'bg-emerald-600/40 text-emerald-200 border-emerald-400'
                      : 'bg-[#07241B] text-slate-400 border-white/10'
                  }`}
                >
                  <span className="block mb-0.5">⭐⭐⭐⭐⭐</span>
                  <span>ممتاز</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLevel('medium')}
                  className={`py-3 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                    level === 'medium'
                      ? 'bg-blue-600/40 text-blue-200 border-blue-400'
                      : 'bg-[#07241B] text-slate-400 border-white/10'
                  }`}
                >
                  <span className="block mb-0.5">⭐⭐⭐</span>
                  <span>متوسط</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLevel('weak')}
                  className={`py-3 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                    level === 'weak'
                      ? 'bg-amber-600/40 text-amber-200 border-amber-400'
                      : 'bg-[#07241B] text-slate-400 border-white/10'
                  }`}
                >
                  <span className="block mb-0.5">⭐</span>
                  <span>ضعيف</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                ملاحظة وتوجيه المعلم
              </label>
              <textarea
                rows={3}
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveReportToHistory}
              className="w-full py-2.5 px-4 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/40 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {saveReportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>تم حفظ التقرير في سجل الطالب بنجاح!</span>
                </>
              ) : (
                <>
                  <History className="w-4 h-4 text-[#D4AF37]" />
                  <span>حفظ هذا التقرير في سجل الطالب التاريخي</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#F3E5AB] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>معاينة حية لرسالة الواتساب الرسمية:</span>
                </span>
              </div>
              <div className="bg-[#051E16] border border-[#25D366]/40 rounded-2xl p-4 shadow-inner text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap select-text">
                {formalMessage}
              </div>
            </div>

            <div className="space-y-3 mt-4 pt-4 border-t border-[#D4AF37]/20">
              <button
                type="button"
                onClick={handleCopyReport}
                className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 border border-white/20 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>تم نسخ نص التقرير للحافظة!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#D4AF37]" />
                    <span>نسخ التقرير</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow transition cursor-pointer"
              >
                <Send className="w-5 h-5 text-white" />
                <span>إرسال واتساب لولي الأمر</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
