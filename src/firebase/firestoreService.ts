import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './config';
import {
  AcademySettings,
  AttendanceRecord,
  AttendanceStatus,
  PaymentRecord,
  ScheduleAppointment,
  Student,
  Teacher,
  TeacherRating,
  TrialLesson,
  TrialLessonStatus,
} from '../types';
import { DEFAULT_SETTINGS } from '../utils/storage';

function assertAuthenticatedUid(uid: string): string {
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('Authentication required: cannot access or store data without Gmail login.');
  }
  return uid;
}

export interface SyncMeta {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

// ---------------- Normalizers ----------------
export function normalizeStudentDoc(id: string, data: Record<string, any>): Student {
  return {
    id,
    name: data.name || data.studentName || data.fullName || '',
    age: data.age !== undefined && data.age !== null ? String(data.age) : '',
    phone: data.phone || data.mobile || data.parentPhone || '',
    course: data.course || data.level || 'حفظ القرآن الكريم',
    feeStatus: data.feeStatus === 'paid' ? 'paid' : 'unpaid',
    notes: data.notes || '',
    parentName: data.parentName || data.name || '',
    parentPhone: data.parentPhone || data.phone || '',
    assignedTeacherId: data.assignedTeacherId || '',
    registeredDate: data.registeredDate || new Date().toISOString().split('T')[0],
    stars: typeof data.stars === 'number' ? data.stars : 0,
    totalStarsEarned:
      typeof data.totalStarsEarned === 'number'
        ? data.totalStarsEarned
        : typeof data.stars === 'number'
        ? data.stars
        : 0,
    starCyclesCompleted: typeof data.starCyclesCompleted === 'number' ? data.starCyclesCompleted : 0,
    completedJuz: typeof data.completedJuz === 'number' ? data.completedJuz : 0,
    currentSurah: data.currentSurah || 'سورة الفاتحة',
    subscriptionAmount: typeof data.subscriptionAmount === 'number' ? data.subscriptionAmount : 250,
    nextPaymentDate: data.nextPaymentDate || '',
    lastPaymentDate: data.lastPaymentDate || '',
    certificates: Array.isArray(data.certificates) ? data.certificates : [],
    reports: Array.isArray(data.reports)
      ? data.reports.map((r: any, idx: number) => ({
          id: r.id || `rep-${idx}`,
          date: r.date || new Date().toISOString().split('T')[0],
          newMemorization: r.newMemorization || '',
          nearRevision: r.nearRevision || '',
          farRevision: r.farRevision || '',
          level:
            r.level === 'excellent' || r.level === 'medium' || r.level === 'weak'
              ? r.level
              : 'excellent',
          teacherNote: r.teacherNote || '',
          createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
        }))
      : [],
  };
}

export function normalizeTeacherDoc(id: string, data: Record<string, any>): Teacher {
  return {
    id,
    name: data.name || data.fullName || '',
    phone: data.phone || '',
    specialization: data.specialization || 'تحفيظ القرآن الكريم',
    notes: data.notes || '',
    sessionRate: typeof data.sessionRate === 'number' ? data.sessionRate : 40,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
}

export function normalizeScheduleDoc(id: string, data: Record<string, any>): ScheduleAppointment {
  return {
    id,
    studentId: data.studentId || '',
    studentName: data.studentName || '',
    teacherId: data.teacherId || '',
    teacherName: data.teacherName || '',
    day: data.day || 'السبت',
    time: data.time || '04:30 مساءً',
    courseType: data.courseType || 'حلقة قرآنية',
    sessionUrl: data.sessionUrl || '',
    notes: data.notes || '',
  };
}

export function normalizeTrialLessonDoc(id: string, data: Record<string, any>): TrialLesson {
  return {
    id,
    studentName: data.studentName || data.name || '',
    parentPhone: data.parentPhone || data.phone || '',
    stageOrAge: data.stageOrAge || data.age || '',
    notes: data.notes || '',
    preferredTime: data.preferredTime || '',
    status: ['new', 'contacted', 'scheduled', 'enrolled', 'cancelled'].includes(data.status)
      ? (data.status as TrialLessonStatus)
      : 'new',
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
}

// ---------------- Students Realtime Sync (Scoped to Gmail UID) ----------------
export function subscribeStudents(
  uid: string,
  onData: (students: Student[], meta: SyncMeta) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = `users/${uid}/students`;
  try {
    return onSnapshot(
      collection(db, 'users', uid, 'students'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeStudentDoc(docSnap.id, docSnap.data()));
        });
        onData(list, {
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveStudentToFirestore(uid: string, student: Student): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/students/${student.id}`;
  try {
    const payload = {
      ownerUid: uid,
      name: student.name,
      age: student.age,
      phone: student.phone,
      course: student.course,
      feeStatus: student.feeStatus,
      notes: student.notes || '',
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      assignedTeacherId: student.assignedTeacherId || '',
      registeredDate: student.registeredDate,
      reports: student.reports || [],
      stars: student.stars ?? 0,
      totalStarsEarned: student.totalStarsEarned ?? 0,
      starCyclesCompleted: student.starCyclesCompleted ?? 0,
      completedJuz: student.completedJuz ?? 0,
      currentSurah: student.currentSurah || '',
      subscriptionAmount: student.subscriptionAmount ?? 250,
      nextPaymentDate: student.nextPaymentDate || '',
      lastPaymentDate: student.lastPaymentDate || '',
      certificates: student.certificates || [],
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, 'users', uid, 'students', student.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteStudentFromFirestore(uid: string, studentId: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/students/${studentId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'students', studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Teachers Realtime Sync (Scoped to Gmail UID) ----------------
export function subscribeTeachers(
  uid: string,
  onData: (teachers: Teacher[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = `users/${uid}/teachers`;
  try {
    return onSnapshot(
      collection(db, 'users', uid, 'teachers'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: Teacher[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeTeacherDoc(docSnap.id, docSnap.data()));
        });
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveTeacherToFirestore(uid: string, teacher: Teacher): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/teachers/${teacher.id}`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'teachers', teacher.id),
      {
        ownerUid: uid,
        name: teacher.name,
        phone: teacher.phone,
        specialization: teacher.specialization,
        notes: teacher.notes || '',
        sessionRate: teacher.sessionRate ?? 40,
        createdAt: teacher.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteTeacherFromFirestore(uid: string, teacherId: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/teachers/${teacherId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'teachers', teacherId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Schedules Realtime Sync (Scoped to Gmail UID) ----------------
export function subscribeSchedules(
  uid: string,
  onData: (schedules: ScheduleAppointment[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = `users/${uid}/schedules`;
  try {
    return onSnapshot(
      collection(db, 'users', uid, 'schedules'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: ScheduleAppointment[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeScheduleDoc(docSnap.id, docSnap.data()));
        });
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveScheduleToFirestore(
  uid: string,
  schedule: ScheduleAppointment
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/schedules/${schedule.id}`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'schedules', schedule.id),
      {
        ownerUid: uid,
        studentId: schedule.studentId,
        studentName: schedule.studentName,
        teacherId: schedule.teacherId,
        teacherName: schedule.teacherName,
        day: schedule.day,
        time: schedule.time,
        courseType: schedule.courseType || '',
        sessionUrl: schedule.sessionUrl || '',
        notes: schedule.notes || '',
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteScheduleFromFirestore(uid: string, scheduleId: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/schedules/${scheduleId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'schedules', scheduleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Attendance Realtime Sync (Scoped to Gmail UID) ----------------
export function subscribeAttendance(
  uid: string,
  onData: (records: AttendanceRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = `users/${uid}/attendance`;
  try {
    return onSnapshot(
      collection(db, 'users', uid, 'attendance'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            scheduleId: data.scheduleId || '',
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            teacherId: data.teacherId || '',
            teacherName: data.teacherName || '',
            date: data.date || new Date().toISOString().split('T')[0],
            status: (data.status === 'absent' ? 'absent' : 'present') as AttendanceStatus,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          });
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveAttendanceToFirestore(
  uid: string,
  record: AttendanceRecord
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/attendance/${record.id}`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'attendance', record.id),
      {
        ownerUid: uid,
        scheduleId: record.scheduleId || '',
        studentId: record.studentId,
        studentName: record.studentName,
        teacherId: record.teacherId,
        teacherName: record.teacherName,
        date: record.date,
        status: record.status,
        createdAt: record.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ---------------- Payments Realtime Sync (Scoped to Gmail UID) ----------------
export function subscribePayments(
  uid: string,
  onData: (payments: PaymentRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = `users/${uid}/payments`;
  try {
    return onSnapshot(
      collection(db, 'users', uid, 'payments'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: PaymentRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            receiptNumber: data.receiptNumber || docSnap.id,
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            amount: typeof data.amount === 'number' ? data.amount : Number(data.amount || 0),
            currency: data.currency || 'ر.س',
            date: data.date || new Date().toISOString().split('T')[0],
            monthKey:
              data.monthKey ||
              (data.date ? String(data.date).slice(0, 7) : new Date().toISOString().slice(0, 7)),
            notes: data.notes || '',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          });
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function savePaymentToFirestore(uid: string, payment: PaymentRecord): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/payments/${payment.id}`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'payments', payment.id),
      {
        ownerUid: uid,
        receiptNumber: payment.receiptNumber,
        studentId: payment.studentId,
        studentName: payment.studentName,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.date,
        monthKey: payment.monthKey,
        notes: payment.notes || '',
        createdAt: payment.createdAt || Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ---------------- Teacher Ratings Realtime Sync (Scoped to Gmail UID) ----------------
export function subscribeTeacherRatings(
  uid: string,
  onData: (ratings: TeacherRating[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = `users/${uid}/teacherRatings`;
  try {
    return onSnapshot(
      collection(db, 'users', uid, 'teacherRatings'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: TeacherRating[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            teacherId: data.teacherId || '',
            teacherName: data.teacherName || '',
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            parentPhone: data.parentPhone || '',
            rating: typeof data.rating === 'number' ? data.rating : 5,
            comment: data.comment || '',
            date: data.date || new Date().toISOString().split('T')[0],
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          });
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveTeacherRatingToFirestore(
  uid: string,
  rating: TeacherRating
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/teacherRatings/${rating.id}`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'teacherRatings', rating.id),
      {
        ownerUid: uid,
        teacherId: rating.teacherId,
        teacherName: rating.teacherName,
        studentId: rating.studentId,
        studentName: rating.studentName,
        parentPhone: rating.parentPhone,
        rating: rating.rating,
        comment: rating.comment || '',
        date: rating.date,
        createdAt: rating.createdAt || Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ---------------- Settings Realtime Sync (Scoped to Gmail UID) ----------------
export function subscribeSettings(
  uid: string,
  onData: (settings: AcademySettings) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = `users/${uid}/settings/academy`;
  try {
    return onSnapshot(
      doc(db, 'users', uid, 'settings', 'academy'),
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onData({
            academyName: data.academyName || DEFAULT_SETTINGS.academyName,
            logoDataUrl: data.logoDataUrl || '',
            managerWhatsApp: data.managerWhatsApp || '',
            slogan: data.slogan || '',
            email: data.email || auth.currentUser?.email || '',
            address: data.address || '',
            currency: data.currency || 'ر.س',
            defaultSessionRate:
              typeof data.defaultSessionRate === 'number' ? data.defaultSessionRate : 40,
            defaultSubscriptionAmount:
              typeof data.defaultSubscriptionAmount === 'number'
                ? data.defaultSubscriptionAmount
                : 250,
          });
        } else {
          onData({
            ...DEFAULT_SETTINGS,
            email: auth.currentUser?.email || '',
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

export async function saveSettingsToFirestore(
  uid: string,
  settings: AcademySettings
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/settings/academy`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'settings', 'academy'),
      {
        ...settings,
        ownerUid: uid,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ---------------- Trial Lessons Realtime Sync (Scoped to Gmail UID) ----------------
export function subscribeTrialLessons(
  uid: string,
  onData: (lessons: TrialLesson[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = `users/${uid}/trialLessons`;
  try {
    return onSnapshot(
      collection(db, 'users', uid, 'trialLessons'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: TrialLesson[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeTrialLessonDoc(docSnap.id, docSnap.data()));
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveTrialLessonToFirestore(uid: string, lesson: TrialLesson): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/trialLessons/${lesson.id}`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'trialLessons', lesson.id),
      {
        ownerUid: uid,
        studentName: lesson.studentName,
        parentPhone: lesson.parentPhone,
        stageOrAge: lesson.stageOrAge,
        notes: lesson.notes || '',
        preferredTime: lesson.preferredTime || '',
        status: lesson.status || 'new',
        createdAt: lesson.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function updateTrialLessonStatusInFirestore(
  uid: string,
  lessonId: string,
  status: TrialLessonStatus
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/trialLessons/${lessonId}`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'trialLessons', lessonId),
      {
        status,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteTrialLessonFromFirestore(uid: string, lessonId: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}/trialLessons/${lessonId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'trialLessons', lessonId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Clear All Data for Authenticated User ----------------
export async function clearAllUserDataFromFirestore(uid: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const collectionsToClear = [
    'students',
    'teachers',
    'schedules',
    'attendance',
    'payments',
    'teacherRatings',
    'trialLessons',
  ];

  for (const colName of collectionsToClear) {
    const snap = await getDocs(collection(db, 'users', uid, colName));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}
