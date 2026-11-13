/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Award,
  Bell,
  Clock,
  MessageSquare,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { AdminTab, Header } from './components/Header';
import { FooterWhatsApp } from './components/FooterWhatsApp';
import { GoogleLoginScreen } from './components/GoogleLoginScreen';
import { StudentsListSection } from './components/StudentsListSection';
import { StudentProfile } from './components/StudentProfile';
import { StudentModal } from './components/StudentModal';
import { TeachersSection } from './components/TeachersSection';
import { SchedulesSection } from './components/SchedulesSection';
import { SettingsSection } from './components/SettingsSection';
import { TrialLessonModal } from './components/TrialLessonModal';
import { TrialLessonsSection } from './components/TrialLessonsSection';
import { ReportsSection } from './components/ReportsSection';
import { TeacherPortalView } from './components/TeacherPortalView';
import { ParentPortalView } from './components/ParentPortalView';
import { ReceiptModal } from './components/ReceiptModal';
import { CertificateModal } from './components/CertificateModal';

import {
  AcademySettings,
  AppRole,
  AttendanceRecord,
  AttendanceStatus,
  CertificateRecord,
  PaymentRecord,
  ScheduleAppointment,
  Student,
  Teacher,
  TeacherRating,
  TrialLesson,
  TrialLessonStatus,
} from './types';
import {
  DEFAULT_SETTINGS,
  purgeLegacyLocalStorage,
  getTodayDateStr,
  addDaysToDateStr,
  getDaysUntilDate,
  cleanWhatsAppNumber,
} from './utils/storage';
import { PUBLISHED_APP_URL, syncAppIcon } from './utils/pwa';
import { InstallOutcome, useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import { useAppUpdater } from './hooks/useAppUpdater';
import {
  DownloadState,
  INITIAL_DOWNLOAD_STATE,
  executeUniversalDownload,
} from './utils/downloadHelper';
import {
  auth,
  isTemporaryPreviewHost,
  signInWithGoogle,
  signOutGoogle,
  testConnection,
} from './firebase/config';
import {
  subscribeStudents,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  subscribeTeachers,
  saveTeacherToFirestore,
  deleteTeacherFromFirestore,
  subscribeSchedules,
  saveScheduleToFirestore,
  deleteScheduleFromFirestore,
  subscribeSettings,
  saveSettingsToFirestore,
  subscribeTrialLessons,
  saveTrialLessonToFirestore,
  deleteTrialLessonFromFirestore,
  updateTrialLessonStatusInFirestore,
  subscribeAttendance,
  saveAttendanceToFirestore,
  subscribePayments,
  savePaymentToFirestore,
  subscribeTeacherRatings,
  saveTeacherRatingToFirestore,
  clearAllUserDataFromFirestore,
} from './firebase/firestoreService';

// Immediately remove any old demo localStorage data from previous versions
purgeLegacyLocalStorage();

export default function App() {
  // Firebase Google Auth States
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authActionLoading, setAuthActionLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Navigation, Role & View States
  const [appRole, setAppRole] = useState<AppRole>('admin');
  const [currentTab, setCurrentTab] = useState<AdminTab>('students');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedPortalTeacherId, setSelectedPortalTeacherId] = useState<string>('');
  const [loggedParentPhone, setLoggedParentPhone] = useState<string>('');

  // Modal States
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [installFeedback, setInstallFeedback] = useState<InstallOutcome | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<PaymentRecord | null>(null);
  const [certModalState, setCertModalState] = useState<{
    student: Student;
    cert?: CertificateRecord;
  } | null>(null);

  // Toast / Celebration Alert Banner
  const [starCelebration, setStarCelebration] = useState<{
    student: Student;
    cert: CertificateRecord;
  } | null>(null);

  // Universal Download state for Settings JSON backup
  const [exportDownloadState, setExportDownloadState] = useState<DownloadState>(
    INITIAL_DOWNLOAD_STATE
  );

  // App Data States (Strictly 0 / Empty on boot; populated ONLY from signed-in Gmail's Firestore)
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<ScheduleAppointment[]>([]);
  const [settings, setSettings] = useState<AcademySettings>(DEFAULT_SETTINGS);
  const [trialLessons, setTrialLessons] = useState<TrialLesson[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [teacherRatings, setTeacherRatings] = useState<TeacherRating[]>([]);
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'connecting' | 'offline'>(
    'connecting'
  );
  const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);
  const [syncPermissionError, setSyncPermissionError] = useState<string | null>(null);

  // PWA, Connectivity & App Updater Hooks
  const { isInstallable, isInstalled, isIOS, isInAppBrowser, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const {
    hasUpdateAvailable,
    updateStatus,
    updateMessage,
    checkAndUpdateNow,
    applyUpdateReload,
    dismissUpdateMessage,
    currentVersion,
  } = useAppUpdater();

  const handleInstallTrigger = async () => {
    const outcome = await install();
    setInstallFeedback(outcome);
  };

  // Listen to Firebase Auth State (only on official Firebase Hosting domain)
  useEffect(() => {
    purgeLegacyLocalStorage();

    if (isTemporaryPreviewHost()) {
      setAuthUser(null);
      setAuthLoading(false);
      setAuthError(null);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
      setAuthError(null);

      if (!user) {
        // Clear all in-memory state when signed out so nothing is accessible without Gmail
        setStudents([]);
        setTeachers([]);
        setSchedules([]);
        setTrialLessons([]);
        setAttendance([]);
        setPayments([]);
        setTeacherRatings([]);
        setSettings(DEFAULT_SETTINGS);
        setSelectedStudentId(null);
        setHasPendingWrites(false);
        setSyncPermissionError(null);
      }
    });

    return () => unsubAuth();
  }, []);

  const handleGoogleLogin = async () => {
    setAuthActionLoading(true);
    setAuthError(null);
    const result = await signInWithGoogle();
    if (result.errorMessage) {
      setAuthError(result.errorMessage);
    }
    setAuthActionLoading(false);
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    setStudents([]);
    setTeachers([]);
    setSchedules([]);
    setTrialLessons([]);
    setAttendance([]);
    setPayments([]);
    setTeacherRatings([]);
    setSettings(DEFAULT_SETTINGS);
    setSelectedStudentId(null);
    setSelectedPortalTeacherId('');
    setLoggedParentPhone('');
  };

  // Real-time Firestore Sync Listeners (ONLY active when signed in with Google on authorized domain)
  useEffect(() => {
    if (!authUser || isTemporaryPreviewHost()) return;

    const uid = authUser.uid;
    setFirestoreStatus(isOnline ? 'connecting' : 'offline');
    setSyncPermissionError(null);

    if (isOnline) {
      testConnection().then((ok) => {
        if (ok) setFirestoreStatus('connected');
      });
    }

    const handleSyncError = (err: any) => {
      const msg = err?.message || '';
      if (msg.includes('permission-denied') || err?.code === 'permission-denied') {
        setSyncPermissionError(
          'صلاحيات Firestore تحتاج لتحديث قواعد الحماية في Firebase Console للسماح لكل مستخدم بالقراءة والكتابة داخل مساره /users/{userId}.'
        );
      }
      setFirestoreStatus('offline');
    };

    const unsubStudents = subscribeStudents(
      uid,
      (remoteStudents, meta) => {
        setFirestoreStatus(meta.fromCache && !navigator.onLine ? 'offline' : 'connected');
        setHasPendingWrites(meta.hasPendingWrites);
        setStudents(remoteStudents);
      },
      handleSyncError
    );

    const unsubTeachers = subscribeTeachers(
      uid,
      (remoteTeachers) => {
        setTeachers(remoteTeachers);
      },
      handleSyncError
    );

    const unsubSchedules = subscribeSchedules(
      uid,
      (remoteSchedules) => {
        setSchedules(remoteSchedules);
      },
      handleSyncError
    );

    const unsubSettings = subscribeSettings(
      uid,
      (remoteSettings) => {
        setSettings(remoteSettings);
      },
      handleSyncError
    );

    const unsubTrialLessons = subscribeTrialLessons(
      uid,
      (remoteLessons) => {
        setTrialLessons(remoteLessons);
      },
      handleSyncError
    );

    const unsubAttendance = subscribeAttendance(
      uid,
      (remoteAttendance) => {
        setAttendance(remoteAttendance);
      },
      handleSyncError
    );

    const unsubPayments = subscribePayments(
      uid,
      (remotePayments) => {
        setPayments(remotePayments);
      },
      handleSyncError
    );

    const unsubRatings = subscribeTeacherRatings(
      uid,
      (remoteRatings) => {
        setTeacherRatings(remoteRatings);
      },
      handleSyncError
    );

    return () => {
      unsubStudents();
      unsubTeachers();
      unsubSchedules();
      unsubSettings();
      unsubTrialLessons();
      unsubAttendance();
      unsubPayments();
      unsubRatings();
    };
  }, [authUser, isOnline]);

  // Routing guard
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.pathname !== '/' &&
      !window.location.pathname.includes('.')
    ) {
      window.history.replaceState(null, '', '/');
    }
  }, []);

  // Synchronize dynamic PWA icon
  useEffect(() => {
    syncAppIcon(settings.logoDataUrl);
  }, [settings.logoDataUrl]);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || null;
  const newTrialLessonsCount = trialLessons.filter((l) => l.status === 'new').length;

  // Smart Dashboard Alerts Calculations
  const todayStr = getTodayDateStr();
  const todayAbsences = attendance.filter(
    (a) => a.date === todayStr && a.status === 'absent'
  );
  const paymentDueAlerts = students.filter((s) => {
    const days = getDaysUntilDate(s.nextPaymentDate);
    return days !== null && days <= 3;
  });

  // Student Actions (Optimistic local state + Firestore queued offline/realtime write)
  const handleSelectStudent = (student: Student) => {
    setSelectedStudentId(student.id);
  };

  const handleBackToStudents = () => {
    setSelectedStudentId(null);
  };

  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudentData = (studentData: Partial<Student>) => {
    if (!authUser) return;
    const uid = authUser.uid;
    const exists = studentToEdit && students.some((s) => s.id === studentToEdit.id);

    if (exists && studentToEdit) {
      const updatedStudent: Student = { ...studentToEdit, ...studentData };
      setStudents((prev) => prev.map((s) => (s.id === studentToEdit.id ? updatedStudent : s)));
      saveStudentToFirestore(uid, updatedStudent).catch((err) =>
        console.warn('Firestore write warning:', err)
      );
    } else {
      const newStudent: Student = {
        id: studentToEdit?.id || `std-${Date.now()}`,
        name: studentData.name || '',
        age: studentData.age || '',
        phone: studentData.phone || '',
        course: studentData.course || 'حفظ القرآن الكريم',
        feeStatus: studentData.feeStatus || 'unpaid',
        notes: studentData.notes || '',
        parentName: studentData.parentName || studentData.name || '',
        parentPhone: studentData.parentPhone || studentData.phone || '',
        assignedTeacherId: studentData.assignedTeacherId || '',
        registeredDate: todayStr,
        reports: [],
        stars: 0,
        totalStarsEarned: 0,
        starCyclesCompleted: 0,
        completedJuz: studentData.completedJuz ?? 0,
        currentSurah: studentData.currentSurah || 'سورة الفاتحة',
        subscriptionAmount:
          studentData.subscriptionAmount ?? settings.defaultSubscriptionAmount ?? 250,
        nextPaymentDate: studentData.nextPaymentDate || addDaysToDateStr(todayStr, 30),
        certificates: [],
      };
      setStudents((prev) => [newStudent, ...prev]);
      setSelectedStudentId(newStudent.id);
      saveStudentToFirestore(uid, newStudent).catch((err) =>
        console.warn('Firestore write warning:', err)
      );
    }
    setIsStudentModalOpen(false);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    if (!authUser) return;
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    saveStudentToFirestore(authUser.uid, updatedStudent).catch((err) =>
      console.warn('Firestore write warning:', err)
    );
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!authUser) return;
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setSelectedStudentId(null);
    deleteStudentFromFirestore(authUser.uid, studentId).catch((err) =>
      console.warn('Firestore delete warning:', err)
    );
  };

  // Teacher Actions
  const handleAddTeacher = (teacherData: Omit<Teacher, 'id' | 'createdAt'>) => {
    if (!authUser) return;
    const newTeacher: Teacher = {
      ...teacherData,
      id: `tch-${Date.now()}`,
      createdAt: Date.now(),
    };
    setTeachers((prev) => [newTeacher, ...prev]);
    saveTeacherToFirestore(authUser.uid, newTeacher).catch((err) =>
      console.warn('Firestore write warning:', err)
    );
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    if (!authUser) return;
    setTeachers((prev) => prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t)));
    saveTeacherToFirestore(authUser.uid, updatedTeacher).catch((err) =>
      console.warn('Firestore write warning:', err)
    );
  };

  const handleDeleteTeacher = (id: string) => {
    if (!authUser) return;
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    deleteTeacherFromFirestore(authUser.uid, id).catch((err) =>
      console.warn('Firestore delete warning:', err)
    );
  };

  // Schedule Actions
  const handleAddSchedule = (scheduleData: Omit<ScheduleAppointment, 'id'>) => {
    if (!authUser) return;
    const newSchedule: ScheduleAppointment = {
      ...scheduleData,
      id: `sch-${Date.now()}`,
    };
    setSchedules((prev) => [...prev, newSchedule]);
    saveScheduleToFirestore(authUser.uid, newSchedule).catch((err) =>
      console.warn('Firestore write warning:', err)
    );
  };

  const handleDeleteSchedule = (id: string) => {
    if (!authUser) return;
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    deleteScheduleFromFirestore(authUser.uid, id).catch((err) =>
      console.warn('Firestore delete warning:', err)
    );
  };

  // 1. Mark Attendance Handler
  const handleMarkAttendance = (
    student: Student,
    status: AttendanceStatus,
    schedule?: ScheduleAppointment
  ) => {
    if (!authUser) return;
    const teacherId = schedule?.teacherId || student.assignedTeacherId || '';
    const teacherObj = teachers.find((t) => t.id === teacherId);
    const teacherName = schedule?.teacherName || teacherObj?.name || 'معلم الحلقة';
    const recordId = schedule
      ? `att-${student.id}-${todayStr}-${schedule.id}`
      : `att-${student.id}-${todayStr}`;

    const newRecord: AttendanceRecord = {
      id: recordId,
      scheduleId: schedule?.id || '',
      studentId: student.id,
      studentName: student.name,
      teacherId,
      teacherName,
      date: todayStr,
      status,
      createdAt: Date.now(),
    };

    setAttendance((prev) => [newRecord, ...prev.filter((a) => a.id !== recordId)]);
    saveAttendanceToFirestore(authUser.uid, newRecord).catch((err) =>
      console.warn('Attendance Firestore notice:', err)
    );
  };

  // 2. Stars & 10-Star Reset Cycle Handler
  const handleAddStar = (student: Student): { reachedTen: boolean; newStars: number } => {
    const currentStars = student.stars ?? 0;
    const incremented = currentStars + 1;
    const totalEarned = (student.totalStarsEarned ?? currentStars) + 1;

    if (incremented >= 10) {
      const starCert: CertificateRecord = {
        id: `cert-stars-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        juzName: 'وسام التميز والتفوق (إتمام 10 نجوم)',
        completionDate: todayStr,
        type: 'stars',
        createdAt: Date.now(),
      };
      const updatedStudent: Student = {
        ...student,
        stars: 0,
        totalStarsEarned: totalEarned,
        starCyclesCompleted: (student.starCyclesCompleted ?? 0) + 1,
        certificates: [starCert, ...(student.certificates || [])],
      };
      handleUpdateStudent(updatedStudent);
      setStarCelebration({ student: updatedStudent, cert: starCert });
      return { reachedTen: true, newStars: 0 };
    } else {
      const updatedStudent: Student = {
        ...student,
        stars: incremented,
        totalStarsEarned: totalEarned,
      };
      handleUpdateStudent(updatedStudent);
      return { reachedTen: false, newStars: incremented };
    }
  };

  // 5. Record Payment & Open Sleek Receipt Modal
  const handleRecordPayment = (student: Student, amount?: number, notes?: string) => {
    if (!authUser) return;
    const finalAmount =
      amount ?? student.subscriptionAmount ?? settings.defaultSubscriptionAmount ?? 250;
    const currency = settings.currency || 'ر.س';
    const paymentDate = getTodayDateStr();
    const receiptNumber = `FUR-${Date.now().toString().slice(-6)}`;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      studentId: student.id,
      studentName: student.name,
      amount: finalAmount,
      currency,
      date: paymentDate,
      monthKey: paymentDate.slice(0, 7),
      notes: notes || 'اشتراك الحلقات القرآنية الشهري',
      createdAt: Date.now(),
    };

    setPayments((prev) => [newPayment, ...prev]);
    savePaymentToFirestore(authUser.uid, newPayment).catch((err) =>
      console.warn('Payment Firestore notice:', err)
    );

    const updatedStudent: Student = {
      ...student,
      feeStatus: 'paid',
      subscriptionAmount: finalAmount,
      lastPaymentDate: paymentDate,
      nextPaymentDate: addDaysToDateStr(paymentDate, 30),
    };
    handleUpdateStudent(updatedStudent);
    setActiveReceipt(newPayment);
  };

  // 11. Save Certificate Record to Student
  const handleSaveCertificate = (cert: CertificateRecord) => {
    const st = students.find((s) => s.id === cert.studentId);
    if (!st) return;
    const existing = st.certificates || [];
    if (existing.some((c) => c.id === cert.id)) return;
    handleUpdateStudent({
      ...st,
      certificates: [cert, ...existing],
    });
  };

  // 9. Submit Teacher Rating
  const handleSubmitTeacherRating = (ratingData: Omit<TeacherRating, 'id' | 'createdAt'>) => {
    if (!authUser) return;
    const newRating: TeacherRating = {
      ...ratingData,
      id: `rate-${Date.now()}`,
      createdAt: Date.now(),
    };
    setTeacherRatings((prev) => [newRating, ...prev]);
    saveTeacherRatingToFirestore(authUser.uid, newRating).catch((err) =>
      console.warn('Rating Firestore notice:', err)
    );
  };

  // Settings Actions
  const handleSaveSettings = (newSettings: AcademySettings) => {
    if (!authUser) return;
    setSettings(newSettings);
    saveSettingsToFirestore(authUser.uid, newSettings).catch((err) =>
      console.warn('Firestore write warning:', err)
    );
  };

  // Trial Lesson Actions
  const handleSaveTrialLesson = async (data: {
    studentName: string;
    parentPhone: string;
    stageOrAge: string;
    notes?: string;
    preferredTime?: string;
  }) => {
    if (!authUser) return;
    const newLesson: TrialLesson = {
      id: `trial-${Date.now()}`,
      studentName: data.studentName,
      parentPhone: data.parentPhone,
      stageOrAge: data.stageOrAge,
      notes: data.notes || '',
      preferredTime: data.preferredTime || '',
      status: 'new',
      createdAt: Date.now(),
    };
    setTrialLessons((prev) => [newLesson, ...prev]);
    await saveTrialLessonToFirestore(authUser.uid, newLesson);
  };

  const handleUpdateTrialLessonStatus = (id: string, status: TrialLessonStatus) => {
    if (!authUser) return;
    setTrialLessons((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    updateTrialLessonStatusInFirestore(authUser.uid, id, status).catch(console.warn);
  };

  const handleDeleteTrialLesson = (id: string) => {
    if (!authUser) return;
    setTrialLessons((prev) => prev.filter((l) => l.id !== id));
    deleteTrialLessonFromFirestore(authUser.uid, id).catch(console.warn);
  };

  const handleConvertTrialToStudent = (lesson: TrialLesson) => {
    setStudentToEdit({
      id: `std-${Date.now()}`,
      name: lesson.studentName,
      age: lesson.stageOrAge,
      phone: lesson.parentPhone,
      course: 'حفظ القرآن الكريم وتجويده',
      feeStatus: 'unpaid',
      notes: `تم التحويل من طلب حصة تجريبية. ${lesson.notes ? `ملاحظات: ${lesson.notes}` : ''}`,
      parentName: `ولي أمر ${lesson.studentName}`,
      parentPhone: lesson.parentPhone,
      registeredDate: todayStr,
      reports: [],
      stars: 0,
      completedJuz: 0,
      currentSurah: 'سورة الفاتحة',
      subscriptionAmount: settings.defaultSubscriptionAmount ?? 250,
      nextPaymentDate: addDaysToDateStr(todayStr, 30),
    });
    handleUpdateTrialLessonStatus(lesson.id, 'enrolled');
    setIsStudentModalOpen(true);
  };

  // Zero-Reset All User Data (clears Firestore account back to 0)
  const handleResetData = async () => {
    if (!authUser) return;
    purgeLegacyLocalStorage();
    setStudents([]);
    setTeachers([]);
    setSchedules([]);
    setTrialLessons([]);
    setAttendance([]);
    setPayments([]);
    setTeacherRatings([]);
    setSelectedStudentId(null);
    const resetSettings: AcademySettings = {
      ...DEFAULT_SETTINGS,
      email: authUser.email || '',
    };
    setSettings(resetSettings);
    syncAppIcon('');
    await clearAllUserDataFromFirestore(authUser.uid).catch(console.warn);
    await saveSettingsToFirestore(authUser.uid, resetSettings).catch(console.warn);
  };

  const handleManualSync = () => {
    setFirestoreStatus('connecting');
    testConnection().then((ok) => {
      setFirestoreStatus(ok ? 'connected' : 'offline');
    });
  };

  // Universal Blob JSON Backup Download
  const handleExportData = async () => {
    const data = {
      students,
      teachers,
      schedules,
      attendance,
      payments,
      teacherRatings,
      trialLessons,
      settings,
      exportedAt: new Date().toISOString(),
      academy: settings.academyName,
      accountEmail: authUser?.email || '',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const filename = `al-furqan-academy-backup-${todayStr}.json`;
    await executeUniversalDownload(blob, filename, 'application/json', setExportDownloadState);
  };

  const handleImportData = (jsonStr: string) => {
    if (!authUser) return;
    const uid = authUser.uid;
    const parsed = JSON.parse(jsonStr);
    if (parsed.students && Array.isArray(parsed.students)) {
      setStudents(parsed.students);
      parsed.students.forEach((st: Student) => saveStudentToFirestore(uid, st).catch(() => {}));
    }
    if (parsed.teachers && Array.isArray(parsed.teachers)) {
      setTeachers(parsed.teachers);
      parsed.teachers.forEach((tch: Teacher) => saveTeacherToFirestore(uid, tch).catch(() => {}));
    }
    if (parsed.schedules && Array.isArray(parsed.schedules)) {
      setSchedules(parsed.schedules);
      parsed.schedules.forEach((sch: ScheduleAppointment) =>
        saveScheduleToFirestore(uid, sch).catch(() => {})
      );
    }
    if (parsed.settings) {
      setSettings(parsed.settings);
      syncAppIcon(parsed.settings.logoDataUrl);
      saveSettingsToFirestore(uid, parsed.settings).catch(() => {});
    }
  };

  const currency = settings.currency || 'ر.س';

  const installFeedbackToast = installFeedback && (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 left-4 right-4 max-w-xl mx-auto z-50 rounded-2xl p-4 border-2 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md animate-fadeIn ${
        installFeedback === 'accepted' || installFeedback === 'already-installed'
          ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
          : installFeedback === 'in-app-browser' || installFeedback === 'iframe-preview'
          ? 'bg-amber-950/95 border-amber-400 text-amber-100'
          : installFeedback === 'ios-manual' || installFeedback === 'desktop-android-manual'
          ? 'bg-[#0B3D2E]/95 border-[#D4AF37] text-[#F3E5AB]'
          : 'bg-slate-900/95 border-slate-500 text-slate-200'
      }`}
    >
      <div className="space-y-1.5 text-xs sm:text-sm">
        {installFeedback === 'accepted' && (
          <p className="font-extrabold text-emerald-300">تم تثبيت التطبيق بنجاح</p>
        )}
        {installFeedback === 'already-installed' && (
          <p className="font-extrabold text-emerald-300">
            تم تثبيت التطبيق بنجاح ✓ (التطبيق مثبت بالفعل على جهازك)
          </p>
        )}
        {installFeedback === 'in-app-browser' && (
          <p className="font-extrabold text-amber-200">
            افتح الرابط في متصفح Chrome عشان التثبيت يشتغل
          </p>
        )}
        {installFeedback === 'iframe-preview' && (
          <div className="space-y-1.5">
            <p className="font-bold text-amber-200">
              لتثبيت تطبيق الأكاديمية مباشرة (وليس نافذة المعاينة)، افتح رابط التطبيق المنشور في تبويب مستقل ثم اضغط «تثبيت التطبيق»:
            </p>
            <a
              href={PUBLISHED_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#07241B] font-extrabold text-xs hover:bg-[#F3E5AB] transition"
            >
              <span>فتح تطبيق الأكاديمية للتثبيت المباشر ↗</span>
            </a>
          </div>
        )}
        {installFeedback === 'dismissed' && (
          <p className="font-semibold">
            تم إلغاء التثبيت. يمكنك الضغط على الزر مرة أخرى في أي وقت للتثبيت المباشر.
          </p>
        )}
        {installFeedback === 'ios-manual' && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#D4AF37] text-[#07241B] font-extrabold text-xs">
                إضافة إلى الشاشة الرئيسية
              </span>
            </div>
            <p className="text-xs font-bold text-white">
              دوس مشاركة ثم إضافة إلى الشاشة الرئيسية
            </p>
          </>
        )}
        {installFeedback === 'desktop-android-manual' && (
          <p className="text-xs sm:text-sm font-semibold text-[#F3E5AB]">
            لتثبيت التطبيق مباشرة على الكمبيوتر أو أندرويد: افتح الرابط في متصفح Chrome أو Edge واضغط أيقونة التثبيت في شريط العنوان أو قائمة المتصفح (تثبيت التطبيق).
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setInstallFeedback(null)}
        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer"
        aria-label="إغلاق"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  // Loading Splash while Firebase Auth checks active session
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07241B] text-white bg-islamic-pattern gap-4">
        <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
        <p className="text-sm font-bold text-[#F3E5AB]">جاري التحقق من حساب جوجل والمزامنة...</p>
      </div>
    );
  }

  // Mandatory Gmail Login Gate (Zero data access without Gmail sign-in; blocked on temporary preview domains)
  const isTemporaryHost = isTemporaryPreviewHost();
  if (!authUser || isTemporaryHost) {
    const loginInstallLabel = isInstalled
      ? 'التطبيق مثبت ✓'
      : isIOS && !isInAppBrowser
      ? 'إضافة إلى الشاشة الرئيسية'
      : 'تثبيت التطبيق';

    return (
      <>
        <GoogleLoginScreen
          onGoogleLogin={handleGoogleLogin}
          isLoading={authActionLoading}
          errorMessage={authError}
          isTemporaryHost={isTemporaryHost}
          onInstallApp={handleInstallTrigger}
          installLabel={loginInstallLabel}
        />
        {installFeedbackToast}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#07241B] text-slate-100 bg-islamic-pattern selection:bg-[#D4AF37]/30 selection:text-white font-sans">
      {/* Top Header with Logo, Role Switcher, Tabs, Trial Button, Update & Install Buttons */}
      <Header
        appRole={appRole}
        onRoleChange={(role) => setAppRole(role)}
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'students') {
            setSelectedStudentId(null);
          }
        }}
        settings={settings}
        onOpenInstallModal={handleInstallTrigger}
        onOpenTrialModal={() => setIsTrialModalOpen(true)}
        isOnline={isOnline}
        isInstalled={isInstalled}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
        isInstallable={isInstallable}
        firestoreStatus={firestoreStatus}
        newTrialLessonsCount={newTrialLessonsCount}
        onCheckUpdate={checkAndUpdateNow}
        hasUpdateAvailable={hasUpdateAvailable}
        updateStatus={updateStatus}
        userEmail={authUser.email}
        userPhotoUrl={authUser.photoURL}
        hasPendingWrites={hasPendingWrites}
        onSignOut={handleSignOut}
      />

      {/* Subtle Auto-Update Notification Bar when new version is published */}
      {hasUpdateAvailable && updateStatus !== 'updating' && (
        <div className="no-print bg-gradient-to-r from-amber-500/20 via-[#D4AF37]/25 to-emerald-500/20 border-b border-[#D4AF37]/50 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm">
            <button
              type="button"
              onClick={applyUpdateReload}
              className="flex items-center gap-2 font-extrabold text-[#F3E5AB] hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#D4AF37]" />
              <span>فيه تحديث جديد، دوس هنا للتحديث</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        {syncPermissionError && (
          <div
            role="alert"
            className="bg-red-950/80 border border-red-400/50 rounded-2xl p-4 text-xs text-red-100 flex items-center justify-between gap-3"
          >
            <span>{syncPermissionError}</span>
            <button
              type="button"
              onClick={() => setSyncPermissionError(null)}
              className="p-1 rounded-lg bg-white/10 text-white cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Manual App Update Status Toast */}
        {updateStatus !== 'idle' && updateMessage && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed top-24 left-4 right-4 max-w-md mx-auto z-50 rounded-2xl p-3.5 border-2 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md animate-fadeIn ${
              updateStatus === 'updating'
                ? 'bg-amber-950/95 border-[#D4AF37] text-[#F3E5AB]'
                : updateStatus === 'up-to-date'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
                : 'bg-[#0B3D2E]/95 border-[#D4AF37]/60 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
              <RefreshCw
                className={`w-4 h-4 text-[#D4AF37] shrink-0 ${
                  updateStatus === 'checking' || updateStatus === 'updating' ? 'animate-spin' : ''
                }`}
              />
              <span>{updateMessage}</span>
            </div>
            {updateStatus === 'up-to-date' && (
              <button
                type="button"
                onClick={dismissUpdateMessage}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Direct PWA Install Feedback Banner */}
        {installFeedbackToast}

        {/* Global 10-Star Celebration Banner */}
        {starCelebration && (
          <div className="bg-gradient-to-r from-amber-500/25 via-[#D4AF37]/25 to-emerald-500/20 border-2 border-[#D4AF37] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-[#D4AF37] shrink-0" />
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-[#F3E5AB]">
                  🎉 مبروك! الطالب ({starCelebration.student.name}) أتم 10 نجوم ويستحق شهادة!
                </h4>
                <p className="text-xs text-slate-200">
                  تم تصفير النجوم تلقائياً لتبدأ دورة مكافآت جديدة، وإصدار شهادة وسام التميز في سجله.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCertModalState({
                    student: starCelebration.student,
                    cert: starCelebration.cert,
                  });
                  setStarCelebration(null);
                }}
                className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                عرض / تحميل الشهادة PDF
              </button>
              <button
                type="button"
                onClick={() => setStarCelebration(null)}
                className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Smart Alerts Strip (Admin Mode Only) */}
        {appRole === 'admin' &&
          (todayAbsences.length > 0 ||
            paymentDueAlerts.length > 0 ||
            newTrialLessonsCount > 0) && (
            <div className="bg-[#0B3D2E]/90 border border-[#D4AF37]/40 rounded-2xl p-4 shadow-lg space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#F3E5AB]">
                <Bell className="w-4 h-4 text-[#D4AF37]" />
                <span>تنبيهات الأكاديمية الفورية</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {/* Absence Alerts */}
                {todayAbsences.map((abs) => {
                  const st = students.find((s) => s.id === abs.studentId);
                  const phone = cleanWhatsAppNumber(st?.parentPhone || st?.phone || '');
                  const msg = encodeURIComponent(
                    `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${abs.studentName})،\nنحيطكم علماً بأن الطالب غاب النهاردة (${abs.date}) عن حلقة القرآن الكريم.\nنرجو التواصل للاطمئنان عليه.\n${settings.academyName}`
                  );
                  return (
                    <div
                      key={abs.id}
                      className="bg-red-900/25 border border-red-500/40 rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-red-200 block truncate">
                          ⚠️ غياب اليوم: {abs.studentName}
                        </span>
                        <span className="text-[11px] text-slate-300">{abs.teacherName}</span>
                      </div>
                      <a
                        href={`https://wa.me/${phone}?text=${msg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] text-[#07241B] font-extrabold text-[11px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>واتساب غياب</span>
                      </a>
                    </div>
                  );
                })}

                {/* 3-day Payment Alerts */}
                {paymentDueAlerts.map((st) => {
                  const days = getDaysUntilDate(st.nextPaymentDate) ?? 0;
                  const phone = cleanWhatsAppNumber(st.parentPhone || st.phone || '');
                  const amount =
                    st.subscriptionAmount || settings.defaultSubscriptionAmount || 250;
                  const msg = encodeURIComponent(
                    `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${st.name})،\nنذكركم بلطف باقتراب موعد تجديد الاشتراك (${st.nextPaymentDate}) بمبلغ (${amount} ${currency}).\n${settings.academyName}`
                  );
                  return (
                    <div
                      key={`pay-alert-${st.id}`}
                      className="bg-amber-900/25 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-amber-200 flex items-center gap-1 truncate">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">تجديد: {st.name}</span>
                        </span>
                        <span className="text-[11px] text-slate-300">
                          {days < 0
                            ? `تأخر ${Math.abs(days)} يوم`
                            : days === 0
                            ? 'الموعد اليوم!'
                            : `متبقي ${days} أيام`}
                        </span>
                      </div>
                      <a
                        href={`https://wa.me/${phone}?text=${msg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] text-[#07241B] font-extrabold text-[11px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>تذكير دفع</span>
                      </a>
                    </div>
                  );
                })}

                {/* New Trial Lessons Alert */}
                {newTrialLessonsCount > 0 && (
                  <div className="bg-emerald-900/30 border border-emerald-400/50 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{newTrialLessonsCount} طلبات حصة تجريبية جديدة</span>
                      </span>
                      <span className="text-[11px] text-slate-300">
                        تنتظر التواصل وتحديد الموعد
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('trialLessons')}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#07241B] font-extrabold text-[11px] cursor-pointer"
                    >
                      عرض الطلبات
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ROLE 1: ADMIN DASHBOARD */}
        {appRole === 'admin' && (
          <>
            {currentTab === 'students' && (
              <>
                {currentStudent ? (
                  <StudentProfile
                    student={currentStudent}
                    onBack={handleBackToStudents}
                    onEditStudent={() => handleOpenEditStudent(currentStudent)}
                    onAddNewStudent={handleOpenAddStudent}
                    onUpdateStudent={handleUpdateStudent}
                    onDeleteStudent={handleDeleteStudent}
                    teachers={teachers}
                    academyName={settings.academyName}
                    settings={settings}
                    attendance={attendance}
                    payments={payments}
                    onMarkAttendance={handleMarkAttendance}
                    onAddStar={handleAddStar}
                    onRecordPayment={handleRecordPayment}
                    onViewReceipt={(pay) => setActiveReceipt(pay)}
                    onOpenCertificateModal={(st, cert) => setCertModalState({ student: st, cert })}
                  />
                ) : (
                  <StudentsListSection
                    students={students}
                    onSelectStudent={handleSelectStudent}
                    onAddNewStudent={handleOpenAddStudent}
                    onOpenTrialModal={() => setIsTrialModalOpen(true)}
                  />
                )}
              </>
            )}

            {currentTab === 'schedules' && (
              <SchedulesSection
                schedules={schedules}
                students={students}
                teachers={teachers}
                attendance={attendance}
                academyName={settings.academyName}
                onAddSchedule={handleAddSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onMarkAttendance={handleMarkAttendance}
                onAddStar={handleAddStar}
              />
            )}

            {currentTab === 'teachers' && (
              <TeachersSection
                teachers={teachers}
                students={students}
                attendance={attendance}
                teacherRatings={teacherRatings}
                settings={settings}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsSection
                students={students}
                payments={payments}
                settings={settings}
                onViewReceipt={(pay) => setActiveReceipt(pay)}
                onRecordPayment={(st, amt) => handleRecordPayment(st, amt)}
              />
            )}

            {currentTab === 'trialLessons' && (
              <TrialLessonsSection
                trialLessons={trialLessons}
                onUpdateStatus={handleUpdateTrialLessonStatus}
                onDeleteLesson={handleDeleteTrialLesson}
                onConvertToStudent={handleConvertTrialToStudent}
                onOpenNewTrialModal={() => setIsTrialModalOpen(true)}
                academyName={settings.academyName}
                managerWhatsApp={settings.managerWhatsApp}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsSection
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onResetData={handleResetData}
                onExportData={handleExportData}
                exportDownloadState={exportDownloadState}
                onImportData={handleImportData}
                onOpenInstallModal={handleInstallTrigger}
                firestoreStatus={firestoreStatus}
                onSyncFirestore={handleManualSync}
                onCheckUpdate={checkAndUpdateNow}
                hasUpdateAvailable={hasUpdateAvailable}
                updateStatus={updateStatus}
                updateMessage={updateMessage}
                currentVersion={currentVersion}
                userEmail={authUser.email}
                onSignOut={handleSignOut}
              />
            )}
          </>
        )}

        {/* ROLE 2: TEACHER PORTAL (Today's Sessions Only) */}
        {appRole === 'teacher' && (
          <TeacherPortalView
            teachers={teachers}
            students={students}
            schedules={schedules}
            attendance={attendance}
            teacherRatings={teacherRatings}
            settings={settings}
            selectedTeacherId={selectedPortalTeacherId}
            onSelectTeacher={setSelectedPortalTeacherId}
            onMarkAttendance={handleMarkAttendance}
            onAddStar={handleAddStar}
          />
        )}

        {/* ROLE 3: PARENT PORTAL (Phone Number Only) */}
        {appRole === 'parent' && (
          <ParentPortalView
            students={students}
            teachers={teachers}
            attendance={attendance}
            payments={payments}
            teacherRatings={teacherRatings}
            settings={settings}
            loggedParentPhone={loggedParentPhone}
            onLoginParent={(phone) => setLoggedParentPhone(phone)}
            onLogoutParent={() => setLoggedParentPhone('')}
            onSubmitTeacherRating={handleSubmitTeacherRating}
            onOpenCertificate={(st, cert) => setCertModalState({ student: st, cert })}
            onViewReceipt={(pay) => setActiveReceipt(pay)}
          />
        )}
      </main>

      {/* Student Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudentData}
        studentToEdit={studentToEdit}
        teachers={teachers}
        defaultSubscriptionAmount={settings.defaultSubscriptionAmount}
      />

      {/* Trial Lesson Modal */}
      <TrialLessonModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        onSubmit={handleSaveTrialLesson}
        managerWhatsApp={settings.managerWhatsApp}
      />

      {/* Receipt Modal (Print & PDF/PNG Blob Download) */}
      <ReceiptModal
        payment={activeReceipt}
        academyName={settings.academyName}
        logoUrl={settings.logoDataUrl}
        onClose={() => setActiveReceipt(null)}
      />

      {/* Certificate Modal (Print & PDF/PNG Blob Download) */}
      <CertificateModal
        student={certModalState?.student || null}
        initialCertificate={certModalState?.cert}
        academyName={settings.academyName}
        logoUrl={settings.logoDataUrl}
        onClose={() => setCertModalState(null)}
        onSaveCertificate={handleSaveCertificate}
      />

      {/* WhatsApp Button Footer */}
      <FooterWhatsApp
        managerWhatsApp={settings.managerWhatsApp}
        academyName={settings.academyName}
        onOpenInstallModal={handleInstallTrigger}
        isInstalled={isInstalled}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
      />
    </div>
  );
}
