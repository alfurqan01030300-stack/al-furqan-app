import { AcademySettings } from '../types';

const LEGACY_STORAGE_KEYS = [
  'furqan_students_v1',
  'furqan_teachers_v1',
  'furqan_schedules_v1',
  'furqan_settings_v1',
  'furqan_trial_lessons_v1',
  'furqan_attendance_v1',
  'furqan_payments_v1',
  'furqan_teacher_ratings_v1',
];

/**
 * Permanently wipe all old demo/device localStorage keys so old demo data
 * never appears again. App data is stored strictly on the authenticated Gmail account in Firestore.
 */
export function purgeLegacyLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore storage errors
  }
}

export function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr || Date.now());
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getTodayArabicDay():
  | 'السبت'
  | 'الأحد'
  | 'الإثنين'
  | 'الثلاثاء'
  | 'الأربعاء'
  | 'الخميس'
  | 'الجمعة' {
  const dayIdx = new Date().getDay();
  const map: Record<
    number,
    'السبت' | 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة'
  > = {
    0: 'الأحد',
    1: 'الإثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت',
  };
  return map[dayIdx] || 'السبت';
}

export function getDaysUntilDate(targetDateStr?: string): number | null {
  if (!targetDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const DEFAULT_SETTINGS: AcademySettings = {
  academyName: 'أكاديمية الفرقان الدولية لتحفيظ القرآن الكريم',
  logoDataUrl: '',
  managerWhatsApp: '',
  slogan: 'تعليم القرآن الكريم وتجويده عن بعد بأعلى معايير الإتقان',
  email: '',
  address: '',
  currency: 'ر.س',
  defaultSessionRate: 40,
  defaultSubscriptionAmount: 250,
};

// Helper to sanitize phone numbers for WhatsApp link (https://wa.me/[cleanNumber])
export function cleanWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

// Normalize phone number for matching Parent Login reliably (last 8-9 digits match)
export function normalizePhoneForMatch(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length > 9 ? digits.slice(-9) : digits;
}
