import React from 'react';
import {
  Download,
  Users,
  GraduationCap,
  Calendar,
  Settings as SettingsIcon,
  WifiOff,
  Database,
  Sparkles,
  BarChart3,
  ShieldCheck,
  LayoutDashboard,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { AcademyLogo } from './AcademyLogo';
import { AcademySettings, AppRole } from '../types';
import { UpdateStatus } from '../hooks/useAppUpdater';

export type AdminTab = 'students' | 'schedules' | 'teachers' | 'reports' | 'trialLessons' | 'settings';

interface HeaderProps {
  appRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  settings: AcademySettings;
  onOpenInstallModal: () => void;
  onOpenTrialModal: () => void;
  isOnline: boolean;
  isInstalled: boolean;
  isIOS?: boolean;
  isInAppBrowser?: boolean;
  isInstallable?: boolean;
  firestoreStatus?: 'connected' | 'connecting' | 'offline';
  newTrialLessonsCount?: number;
  onCheckUpdate: () => void;
  hasUpdateAvailable?: boolean;
  updateStatus?: UpdateStatus;
  userEmail?: string | null;
  userPhotoUrl?: string | null;
  hasPendingWrites?: boolean;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appRole,
  onRoleChange,
  currentTab,
  onTabChange,
  settings,
  onOpenInstallModal,
  onOpenTrialModal,
  isOnline,
  isInstalled,
  isIOS = false,
  isInAppBrowser = false,
  firestoreStatus = 'connecting',
  newTrialLessonsCount = 0,
  onCheckUpdate,
  hasUpdateAvailable = false,
  updateStatus = 'idle',
  userEmail,
  userPhotoUrl,
  hasPendingWrites = false,
  onSignOut,
}) => {
  const tabs = [
    { id: 'students', label: 'الطلاب', icon: Users },
    { id: 'schedules', label: 'المواعيد والحلقات', icon: Calendar },
    { id: 'teachers', label: 'المعلمون', icon: GraduationCap },
    { id: 'reports', label: 'التقارير الشهرية', icon: BarChart3 },
    { id: 'trialLessons', label: 'طلبات الحصص التجريبية', icon: Sparkles, badge: newTrialLessonsCount },
    { id: 'settings', label: 'الإعدادات', icon: SettingsIcon },
  ] as const;

  const installButtonText = isInstalled
    ? 'التطبيق مثبت ✓'
    : isIOS && !isInAppBrowser
    ? 'إضافة إلى الشاشة الرئيسية'
    : 'تثبيت التطبيق';

  const isCheckingOrUpdating = updateStatus === 'checking' || updateStatus === 'updating';

  return (
    <header className="no-print sticky top-0 z-40 bg-[#0B3D2E]/95 backdrop-blur-md border-b border-[#D4AF37]/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2">
          {/* Right side: Academy Logo & Title */}
          <div
            onClick={() => {
              onRoleChange('admin');
              onTabChange('students');
            }}
            className="flex items-center gap-3 cursor-pointer group select-none min-w-0"
          >
            <AcademyLogo logoUrl={settings.logoDataUrl} size="md" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold font-amiri text-white tracking-wide group-hover:text-[#F3E5AB] transition truncate">
                {settings.academyName}
              </h1>
              <p className="text-[11px] sm:text-xs text-[#D4AF37] font-medium hidden sm:block truncate">
                نظام الإدارة والمتابعة الشامل لتحفيظ القرآن الكريم
              </p>
            </div>
          </div>

          {/* Left side actions: Firestore Status, Trial Button, Direct Install Button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                !isOnline || hasPendingWrites
                  ? 'bg-amber-900/50 text-amber-200 border-amber-400/50'
                  : firestoreStatus === 'connected'
                  ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500/40'
                  : firestoreStatus === 'connecting'
                  ? 'bg-amber-900/40 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800/60 text-slate-300 border-slate-600/40'
              }`}
              title={userEmail ? `متزامن على حساب: ${userEmail}` : 'مزامنة سحابية لحظية'}
            >
              <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden lg:inline">
                {!isOnline
                  ? 'محفوظ محلياً (سيُرفع عند عودة النت)'
                  : hasPendingWrites
                  ? 'جاري رفع التعديلات للسحابة...'
                  : firestoreStatus === 'connected'
                  ? 'متزامن بجوجل 🟢'
                  : firestoreStatus === 'connecting'
                  ? 'جاري المزامنة...'
                  : 'مزامنة السحابة'}
              </span>
            </span>

            {!isOnline && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">بدون إنترنت</span>
              </span>
            )}

            {userEmail && onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-900/30 text-slate-200 hover:text-red-200 border border-white/10 hover:border-red-400/40 text-xs font-semibold transition cursor-pointer"
                title={`الحساب: ${userEmail} — تسجيل الخروج`}
              >
                {userPhotoUrl && (
                  <img
                    src={userPhotoUrl}
                    alt={userEmail}
                    className="w-4 h-4 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <LogOut className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden xl:inline max-w-[130px] truncate" dir="ltr">
                  {userEmail}
                </span>
                <span className="xl:hidden">خروج</span>
              </button>
            )}

            {/* Clear and Large "حصة تجريبية" Button */}
            <button
              type="button"
              onClick={onOpenTrialModal}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold text-[#07241B] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#F3E5AB] shadow-[0_4px_15px_rgba(212,175,55,0.4)] cursor-pointer transition active:scale-95 border border-white/60"
              title="احجز حصة تجريبية مجانية الآن"
            >
              <Sparkles className="w-4 h-4 text-[#07241B]" />
              <span>حصة تجريبية</span>
            </button>

            {/* App Update Button in Main Menu */}
            <button
              type="button"
              onClick={onCheckUpdate}
              disabled={isCheckingOrUpdating}
              className={`relative flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition active:scale-95 border ${
                hasUpdateAvailable
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'bg-[#145A43]/80 hover:bg-[#145A43] text-[#F3E5AB] border-[#D4AF37]/40'
              } disabled:opacity-70`}
              title="فحص وتحديث التطبيق لآخر نسخة"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#D4AF37] ${isCheckingOrUpdating ? 'animate-spin' : ''}`}
              />
              <span className="sm:hidden">تحديث</span>
              <span className="hidden sm:inline">تحديث التطبيق</span>
              {hasUpdateAvailable && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#0B3D2E] animate-ping"
                  aria-hidden="true"
                />
              )}
              {hasUpdateAvailable && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#0B3D2E]"
                  aria-hidden="true"
                />
              )}
            </button>

            {/* Direct Install App Button */}
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="gold-gradient-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold shadow cursor-pointer transition active:scale-95 border border-[#D4AF37]/50"
              title={installButtonText}
            >
              <Download className="w-4 h-4 text-[#07241B]" />
              <span className="hidden md:inline">{installButtonText}</span>
            </button>
          </div>
        </div>

        {/* Role Switcher Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-t border-[#D4AF37]/15">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                appRole === 'admin'
                  ? 'bg-[#D4AF37] text-[#07241B] shadow'
                  : 'bg-[#07241B]/70 text-slate-300 hover:text-white border border-[#D4AF37]/20'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>لوحة الإدارة</span>
            </button>

            <button
              type="button"
              onClick={() => onRoleChange('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                appRole === 'teacher'
                  ? 'bg-[#D4AF37] text-[#07241B] shadow'
                  : 'bg-[#07241B]/70 text-slate-300 hover:text-white border border-[#D4AF37]/20'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>بوابة المعلم (حصص اليوم)</span>
            </button>

            <button
              type="button"
              onClick={() => onRoleChange('parent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                appRole === 'parent'
                  ? 'bg-[#D4AF37] text-[#07241B] shadow'
                  : 'bg-[#07241B]/70 text-slate-300 hover:text-white border border-[#D4AF37]/20'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>دخول ولي الأمر</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar (Admin Dashboard) */}
        {appRole === 'admin' && (
          <nav className="flex space-x-2 space-x-reverse overflow-x-auto pb-2.5 scrollbar-none border-t border-[#D4AF37]/15 pt-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              const badgeCount = 'badge' in tab ? tab.badge : 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-[#145A43] text-[#F3E5AB] border border-[#D4AF37]/60 shadow-[0_2px_10px_rgba(212,175,55,0.2)]'
                      : 'text-slate-300 hover:text-white hover:bg-[#145A43]/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {badgeCount && badgeCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-black shadow animate-pulse">
                      {badgeCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};
