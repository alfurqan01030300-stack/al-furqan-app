import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Video,
  MessageSquare,
  Wallet,
  LogOut,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  AcademySettings,
  AttendanceRecord,
  AttendanceStatus,
  ScheduleAppointment,
  Student,
  Teacher,
  TeacherRating,
} from '../types';
import { cleanWhatsAppNumber, getTodayArabicDay, getTodayDateStr } from '../utils/storage';

interface TeacherPortalViewProps {
  teachers: Teacher[];
  students: Student[];
  schedules: ScheduleAppointment[];
  attendance: AttendanceRecord[];
  teacherRatings: TeacherRating[];
  settings: AcademySettings;
  selectedTeacherId: string;
  onSelectTeacher: (teacherId: string) => void;
  onMarkAttendance: (
    student: Student,
    status: AttendanceStatus,
    schedule?: ScheduleAppointment
  ) => void;
  onAddStar: (student: Student) => { reachedTen: boolean; newStars: number };
}

export const TeacherPortalView: React.FC<TeacherPortalViewProps> = ({
  teachers,
  students,
  schedules,
  attendance,
  teacherRatings,
  settings,
  selectedTeacherId,
  onSelectTeacher,
  onMarkAttendance,
  onAddStar,
}) => {
  const [starAlert, setStarAlert] = useState<string | null>(null);
  const todayStr = getTodayDateStr();
  const todayArabic = getTodayArabicDay();
  const currentMonth = todayStr.slice(0, 7);
  const currency = settings.currency || 'ر.س';

  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || null;

  // Login selector screen when no teacher is selected
  if (!activeTeacher) {
    return (
      <div className="max-w-2xl mx-auto py-8 animate-fadeIn">
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#D4AF37]/25">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B38728] text-[#07241B] flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-amiri text-white">بوابة المعلم (جدول اليوم)</h2>
              <p className="text-xs text-[#D4AF37]">
                اختر حسابك لعرض حصصك المقررة اليوم ({todayArabic}) فقط، وتسجيل الحضور والنجوم وحساب الراتب
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {teachers.map((t) => {
              const todayCount = schedules.filter(
                (s) => s.teacherId === t.id && s.day === todayArabic
              ).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTeacher(t.id)}
                  className="w-full text-right bg-[#07241B]/90 hover:bg-[#145A43] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-2xl p-4 flex items-center justify-between gap-3 transition cursor-pointer group"
                >
                  <div>
                    <h3 className="text-base font-bold font-amiri text-white group-hover:text-[#F3E5AB]">
                      {t.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{t.specialization}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40">
                      {todayCount} حصص اليوم
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Strictly ONLY TODAY's sessions for this teacher!
  const myTodaySchedules = schedules.filter(
    (s) =>
      (s.teacherId === activeTeacher.id || s.teacherName === activeTeacher.name) &&
      s.day === todayArabic
  );

  // Automatic Salary calculation: sessions taught by this teacher this month * sessionRate
  const sessionRate = activeTeacher.sessionRate ?? settings.defaultSessionRate ?? 40;
  const monthlyTaughtRecords = attendance.filter(
    (a) =>
      a.teacherId === activeTeacher.id &&
      a.date.startsWith(currentMonth) &&
      a.status === 'present'
  );
  const calculatedSalary = monthlyTaughtRecords.length * sessionRate;

  // Parent ratings for this teacher
  const myRatings = teacherRatings.filter((r) => r.teacherId === activeTeacher.id);
  const avgRating =
    myRatings.length > 0
      ? (myRatings.reduce((acc, r) => acc + r.rating, 0) / myRatings.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      {/* Teacher Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B3D2E] border-2 border-[#D4AF37]/40 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#145A43] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40">
              جدول حصص اليوم فقط ({todayArabic} • {todayStr})
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-amiri text-white mt-1">
              مرحباً {activeTeacher.name}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectTeacher('')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold cursor-pointer transition"
        >
          <LogOut className="w-4 h-4 text-[#D4AF37]" />
          <span>تبديل المعلم</span>
        </button>
      </div>

      {/* 10-Star Celebration Alert */}
      {starAlert && (
        <div className="bg-gradient-to-r from-amber-500/20 via-[#D4AF37]/25 to-emerald-500/20 border-2 border-[#D4AF37] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <Award className="w-7 h-7 text-[#D4AF37] shrink-0" />
            <div>
              <h4 className="text-sm font-extrabold text-[#F3E5AB]">🎉 إنجاز رائع — يستحق شهادة!</h4>
              <p className="text-xs text-white">{starAlert}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStarAlert(null)}
            className="px-3 py-1 rounded-lg bg-[#07241B] text-xs text-[#F3E5AB] cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Teacher KPIs: Today's Sessions, Monthly Salary, Parent Rating */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-2xl p-4 shadow">
          <span className="text-xs text-slate-300 flex items-center gap-1.5 mb-1">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <span>حصصك المجدولة اليوم ({todayArabic})</span>
          </span>
          <div className="text-2xl font-black font-amiri text-white">
            {myTodaySchedules.length} حصص
          </div>
        </div>

        <div className="bg-[#0B3D2E] border border-emerald-500/40 rounded-2xl p-4 shadow">
          <span className="text-xs text-emerald-300 flex items-center gap-1.5 mb-1">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>مرتب الشهر التلقائي ({currentMonth})</span>
          </span>
          <div className="text-2xl font-black font-amiri text-emerald-300">
            {calculatedSalary} {currency}
          </div>
          <span className="text-[11px] text-slate-400">
            {monthlyTaughtRecords.length} حصة منجزة × {sessionRate} {currency}/حصة
          </span>
        </div>

        <div className="bg-[#0B3D2E] border border-amber-500/40 rounded-2xl p-4 shadow">
          <span className="text-xs text-amber-300 flex items-center gap-1.5 mb-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>تقييم أولياء الأمور</span>
          </span>
          <div className="text-2xl font-black font-amiri text-white">
            {avgRating ? `${avgRating} / 5 ⭐` : 'لا توجد تقييمات بعد'}
          </div>
          <span className="text-[11px] text-slate-400">({myRatings.length} تقييم مسجل)</span>
        </div>
      </div>

      {/* Today's Sessions List ONLY */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-amiri text-[#F3E5AB] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#D4AF37]" />
          <span>حصص النهاردة ({todayArabic}) — يظهر لك طلاب حصص اليوم فقط</span>
        </h3>

        {myTodaySchedules.length === 0 ? (
          <div className="bg-[#0B3D2E]/60 border border-dashed border-[#D4AF37]/30 rounded-3xl p-10 text-center space-y-2">
            <Calendar className="w-12 h-12 text-[#D4AF37]/50 mx-auto" />
            <p className="text-base font-bold font-amiri text-white">
              لا توجد لديك حصص مجدولة ليوم {todayArabic}
            </p>
            <p className="text-xs text-slate-400">
              يتم عرض الحصص الخاصة بك والمجدولة في يوم {todayArabic} فقط للحفاظ على تركيز المعلم.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTodaySchedules.map((sch) => {
              const student = students.find((s) => s.id === sch.studentId);
              const todayAttendance = attendance.find(
                (a) =>
                  a.studentId === sch.studentId &&
                  a.date === todayStr &&
                  (!a.scheduleId || a.scheduleId === sch.id)
              );

              const parentPhoneClean = cleanWhatsAppNumber(
                student?.parentPhone || student?.phone || ''
              );
              const absenceWhatsAppText = encodeURIComponent(
                `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${sch.studentName})،\nنحيطكم علماً بأن الطالب تغيّب اليوم عن حلقة القرآن الكريم (${sch.day} - ${sch.time}) مع ${activeTeacher.name}.\nنرجو التواصل للاطمئنان عليه.\n${settings.academyName}`
              );

              return (
                <div
                  key={sch.id}
                  className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-5 shadow-xl space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40">
                        {sch.time}
                      </span>
                      <h4 className="text-lg font-bold font-amiri text-white mt-2">
                        الطالب: {sch.studentName}
                      </h4>
                      <p className="text-xs text-slate-300">
                        {student?.currentSurah ? `السورة الحالية: ${student.currentSurah}` : sch.courseType}
                      </p>
                    </div>

                    {student && (
                      <div className="text-left bg-[#07241B] px-3 py-2 rounded-xl border border-[#D4AF37]/25">
                        <span className="text-[10px] text-slate-400 block">النجوم الحالية</span>
                        <span className="text-sm font-extrabold text-[#D4AF37]">
                          {student.stars || 0} / 10 ⭐
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Attendance Buttons */}
                  {student ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => onMarkAttendance(student, 'present', sch)}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            todayAttendance?.status === 'present'
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                              : 'bg-[#07241B] text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/20'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>حضر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onMarkAttendance(student, 'absent', sch)}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            todayAttendance?.status === 'absent'
                              ? 'bg-red-600 text-white border-red-400 shadow'
                              : 'bg-[#07241B] text-red-300 border-red-500/30 hover:bg-red-600/20'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>غاب</span>
                        </button>
                      </div>

                      {/* Absence Alert + WhatsApp parent ready button */}
                      {todayAttendance?.status === 'absent' && (
                        <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-3 space-y-2">
                          <p className="text-xs font-bold text-red-200">
                            ⚠️ تم تسجيل غياب الطالب اليوم ({todayStr})
                          </p>
                          <a
                            href={`https://wa.me/${parentPhoneClean}?text=${absenceWhatsAppText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-[#07241B] text-xs font-extrabold transition"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>إرسال رسالة غياب جاهزة لولي الأمر (واتساب)</span>
                          </a>
                        </div>
                      )}

                      {/* +1 Star Reward Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const res = onAddStar(student);
                          if (res.reachedTen) {
                            setStarAlert(
                              `الطالب (${student.name}) أتم 10 نجوم ويستحق شهادة تقدير! تم تصفير النجوم لتبدأ دورة مكافآت جديدة.`
                            );
                          }
                        }}
                        className="w-full gold-gradient-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold cursor-pointer transition active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 text-[#07241B]" />
                        <span>إعطاء نجمة تفوق للطالب (+1 ⭐)</span>
                      </button>
                    </div>
                  ) : null}

                  {sch.sessionUrl && (
                    <a
                      href={sch.sessionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-400/30 text-xs font-bold transition"
                    >
                      <Video className="w-4 h-4" />
                      <span>فتح رابط الحلقة المباشرة</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
