export type FeeStatus = 'paid' | 'unpaid'; // دفع | لم يدفع بعد

export type StudentLevel = 'excellent' | 'medium' | 'weak'; // ممتاز | متوسط | ضعيف

export type AttendanceStatus = 'present' | 'absent'; // حضر | غاب

export type AppRole = 'admin' | 'teacher' | 'parent';

export interface FollowUpReport {
  id: string;
  date: string;
  newMemorization: string; // حفظ جديد
  nearRevision: string;    // ماضي قريب
  farRevision: string;     // ماضي بعيد
  level: StudentLevel;     // مستوى الطالب
  teacherNote: string;     // ملاحظة المعلم
  createdAt: number;
}

export interface CertificateRecord {
  id: string;
  studentId: string;
  studentName: string;
  juzName: string;          // اسم الجزء أو الإنجاز (مثال: جزء عم / تكريم 10 نجوم)
  completionDate: string;   // تاريخ الإتمام
  type: 'juz' | 'stars';
  createdAt: number;
}

export interface Student {
  id: string;
  name: string;             // اسم الطالب
  age: number | string;     // السن
  phone: string;            // رقم الهاتف / الواتساب
  course: string;           // الكورس
  feeStatus: FeeStatus;     // حالة الرسوم: لم يدفع بعد / دفع
  notes: string;            // ملاحظات
  parentName: string;       // اسم ولي الأمر
  parentPhone: string;      // رقم واتساب ولي الأمر
  assignedTeacherId?: string;
  registeredDate: string;
  reports?: FollowUpReport[]; // سجل تقارير المتابعة
  // الميزات الاحترافية الجديدة:
  stars?: number;             // عدد النجوم الحالية (0 إلى 10)
  totalStarsEarned?: number;  // إجمالي النجوم المكتسبة
  starCyclesCompleted?: number; // عدد مرات إتمام 10 نجوم
  completedJuz?: number;      // عدد الأجزاء المحفوظة (0 إلى 30)
  currentSurah?: string;      // السورة الحالية
  subscriptionAmount?: number; // قيمة الاشتراك الشهري
  nextPaymentDate?: string;   // ميعاد تجديد الاشتراك القادم (YYYY-MM-DD)
  lastPaymentDate?: string;   // تاريخ آخر دفع
  certificates?: CertificateRecord[]; // الشهادات الصادرة للطالب
}

export interface Teacher {
  id: string;
  name: string;             // الاسم
  phone: string;            // الهاتف
  specialization: string;   // التخصص
  notes?: string;
  sessionRate?: number;     // سعر الحصة لحساب المرتب تلقائياً
  createdAt: number;
}

export type DayOfWeek = 'السبت' | 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة';

export interface ScheduleAppointment {
  id: string;
  studentId: string;
  studentName: string;      // الطالب
  teacherId: string;
  teacherName: string;      // المعلم
  day: DayOfWeek;           // اليوم
  time: string;             // الوقت
  courseType?: string;      // نوع الحلقة (حفظ فردي / جماعي / تجويد)
  sessionUrl?: string;      // رابط الزووم / التيمز (اختياري)
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  scheduleId?: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  date: string;             // YYYY-MM-DD
  status: AttendanceStatus; // حضر | غاب
  createdAt: number;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  currency: string;
  date: string;             // YYYY-MM-DD
  monthKey: string;         // YYYY-MM
  notes?: string;
  createdAt: number;
}

export interface TeacherRating {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  parentPhone: string;
  rating: number;           // 1 to 5
  comment?: string;
  date: string;
  createdAt: number;
}

export interface AcademySettings {
  academyName: string;      // اسم الأكاديمية
  logoDataUrl: string;      // شعار الأكاديمية (Base64 أو رابط)
  managerWhatsApp: string;  // رقم واتساب مدير الأكاديمية
  slogan?: string;
  email?: string;
  address?: string;
  currency?: string;        // العملة الافتراضية (ج.م / ر.س)
  defaultSessionRate?: number; // سعر الحصة الافتراضي للمعلم
  defaultSubscriptionAmount?: number; // قيمة الاشتراك الافتراضي للطالب
}

export type TrialLessonStatus = 'new' | 'contacted' | 'scheduled' | 'enrolled' | 'cancelled';

export interface TrialLesson {
  id: string;
  studentName: string;      // اسم الطالب
  parentPhone: string;      // رقم تليفون / واتساب ولي الأمر
  stageOrAge: string;       // المرحلة الدراسية أو السن
  notes?: string;           // ملاحظات أو رغبات
  preferredTime?: string;   // الوقت أو اليوم المفضل
  status: TrialLessonStatus; // حالة المتابعة
  createdAt: number;        // تاريخ ووقت الطلب
}
