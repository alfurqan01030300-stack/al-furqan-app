import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Check,
  MessageSquare,
  Building,
  Phone,
  Sparkles,
  Download,
  UploadCloud,
  RefreshCw,
  Smartphone,
  Database,
  Wallet,
  LogOut,
} from 'lucide-react';
import { AcademySettings } from '../types';
import { AcademyLogo } from './AcademyLogo';
import { cleanWhatsAppNumber } from '../utils/storage';
import { syncAppIcon } from '../utils/pwa';
import { DownloadState } from '../utils/downloadHelper';
import { DownloadFeedbackBox } from './DownloadFeedbackBox';
import { UpdateStatus } from '../hooks/useAppUpdater';

interface SettingsSectionProps {
  settings: AcademySettings;
  onSaveSettings: (settings: AcademySettings) => void;
  onResetData: () => void;
  onExportData: () => void;
  exportDownloadState?: DownloadState;
  onImportData: (jsonStr: string) => void;
  onOpenInstallModal: () => void;
  firestoreStatus?: 'connected' | 'connecting' | 'offline';
  onSyncFirestore?: () => void;
  onCheckUpdate?: () => void;
  hasUpdateAvailable?: boolean;
  updateStatus?: UpdateStatus;
  updateMessage?: string;
  currentVersion?: string;
  userEmail?: string | null;
  onSignOut?: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  settings,
  onSaveSettings,
  onResetData,
  onExportData,
  exportDownloadState,
  onImportData,
  onOpenInstallModal,
  firestoreStatus = 'connected',
  onSyncFirestore,
  onCheckUpdate,
  hasUpdateAvailable = false,
  updateStatus = 'idle',
  updateMessage = '',
  currentVersion = '1.0.0',
  userEmail,
  onSignOut,
}) => {
  const [academyName, setAcademyName] = useState(settings.academyName);
  const [logoDataUrl, setLogoDataUrl] = useState(settings.logoDataUrl || '');
  const [managerWhatsApp, setManagerWhatsApp] = useState(settings.managerWhatsApp);
  const [slogan, setSlogan] = useState(settings.slogan || '');
  const [currency, setCurrency] = useState(settings.currency || 'ر.س');
  const [defaultSessionRate, setDefaultSessionRate] = useState<number>(
    settings.defaultSessionRate ?? 40
  );
  const [defaultSubscriptionAmount, setDefaultSubscriptionAmount] = useState<number>(
    settings.defaultSubscriptionAmount ?? 250
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [iconSyncSuccess, setIconSyncSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoDataUrl(result);
      syncAppIcon(result);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setLogoDataUrl('');
    syncAppIcon('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AcademySettings = {
      ...settings,
      academyName: academyName.trim() || 'أكاديمية الفرقان الدولية لتحفيظ القرآن الكريم',
      logoDataUrl,
      managerWhatsApp: managerWhatsApp.trim(),
      slogan: slogan.trim(),
      currency: currency.trim() || 'ر.س',
      defaultSessionRate: Number(defaultSessionRate) || 40,
      defaultSubscriptionAmount: Number(defaultSubscriptionAmount) || 250,
    };

    onSaveSettings(updated);
    syncAppIcon(logoDataUrl);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSyncIconNow = () => {
    syncAppIcon(logoDataUrl);
    setIconSyncSuccess(true);
    setTimeout(() => setIconSyncSuccess(false), 2500);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        onImportData(text);
      } catch {
        // handled silently
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="flex items-center gap-3 bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-2xl p-5 shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-[#145A43] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-amiri text-white">إعدادات الأكاديمية والمالية والهوية</h2>
          <p className="text-xs text-[#D4AF37]/80">
            تخصيص الشعار، اسم الأكاديمية، العملة، أسعار الحصص، رقم واتساب الإدارة، والنسخ الاحتياطي
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Academy Logo Section */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-[#D4AF37] pb-3 border-b border-[#D4AF37]/20">
            <ImageIcon className="w-5 h-5" />
            <h3 className="text-lg font-bold font-amiri text-white">
              شعار الأكاديمية وأيقونة التطبيق
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#07241B]/80 p-5 rounded-2xl border border-[#D4AF37]/20">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <AcademyLogo logoUrl={logoDataUrl} size="2xl" />
              <span className="text-[11px] text-[#D4AF37] font-semibold">
                {logoDataUrl ? 'شعارك المخصص' : 'الشعار الذهبي الافتراضي (ف)'}
              </span>
            </div>

            <div className="space-y-3 flex-1 w-full text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow transition"
                >
                  <Upload className="w-4 h-4 text-[#07241B]" />
                  <span>رفع صورة شعار الأكاديمية</span>
                </button>

                {logoDataUrl && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>العودة للرمز الذهبي (ف)</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleSyncIconNow}
                className="text-xs text-[#D4AF37] hover:text-[#F3E5AB] flex items-center gap-1.5 underline decoration-[#D4AF37]/40 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>
                  {iconSyncSuccess
                    ? '✓ تم تطبيق الشعار على أيقونة التطبيق بنجاح!'
                    : 'تحديث أيقونة التطبيق الآن'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Basic & Financial Settings */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-[#D4AF37] pb-3 border-b border-[#D4AF37]/20">
            <Building className="w-5 h-5" />
            <h3 className="text-lg font-bold font-amiri text-white">البيانات الأساسية والمالية</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                اسم الأكاديمية <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                رقم واتساب مدير الأكاديمية <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={managerWhatsApp}
                  onChange={(e) => setManagerWhatsApp(e.target.value)}
                  dir="ltr"
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white text-right focus:outline-none focus:border-[#D4AF37]"
                />
                <Phone className="w-4 h-4 text-[#25D366] absolute left-3 top-3 pointer-events-none" />
              </div>
              {managerWhatsApp && (
                <a
                  href={`https://wa.me/${cleanWhatsAppNumber(managerWhatsApp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[#25D366] hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>تجربة فتح رابط الواتساب الآن</span>
                </a>
              )}
            </div>

            {/* Financial Defaults */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#07241B]/70 p-4 rounded-2xl border border-[#D4AF37]/20">
              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>العملة الافتراضية</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="ر.س">ريال سعودي (ر.س)</option>
                  <option value="ج.م">جنيه مصري (ج.م)</option>
                  <option value="د.إ">درهم إماراتي (د.إ)</option>
                  <option value="د.ك">دينار كويتي (د.ك)</option>
                  <option value="$">دولار أمريكي ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                  سعر الحصة الافتراضي للمعلم
                </label>
                <input
                  type="number"
                  min={0}
                  value={defaultSessionRate}
                  onChange={(e) => setDefaultSessionRate(Number(e.target.value))}
                  className="w-full bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                  الاشتراك الشهري الافتراضي
                </label>
                <input
                  type="number"
                  min={0}
                  value={defaultSubscriptionAmount}
                  onChange={(e) => setDefaultSubscriptionAmount(Number(e.target.value))}
                  className="w-full bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                الشعار اللفظي أو الرؤية
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              يتم الحفظ تلقائياً في Firestore السحابي والجهاز.
            </span>
            <button
              type="submit"
              className="gold-gradient-btn px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow cursor-pointer transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#07241B]" />
                  <span>تم حفظ الإعدادات بنجاح!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#07241B]" />
                  <span>حفظ إعدادات الأكاديمية</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cloud Database (Firebase Firestore) Card */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Database className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-lg font-bold font-amiri text-white">
                قاعدة بيانات السحابة (Firebase Firestore)
              </h3>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                firestoreStatus === 'connected'
                  ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-900/50 text-amber-300 border-amber-500/40'
              }`}
            >
              {firestoreStatus === 'connected' ? 'متصل بالسحابة (مباشر)' : 'مزامنة محلية'}
            </span>
          </div>

          <div className="text-xs text-slate-300 bg-[#07241B]/80 p-4 rounded-2xl border border-[#D4AF37]/20 space-y-2">
            {userEmail && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#F3E5AB] font-semibold">حساب الجيميل المتزامن:</span>
                <code className="text-emerald-300 font-mono" dir="ltr">
                  {userEmail}
                </code>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#F3E5AB] font-semibold">المزامنة بين الأجهزة:</span>
              <span className="text-slate-200">
                لحظية (التليفون والكمبيوتر بنفس حساب الجيميل)
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#F3E5AB] font-semibold">الحفظ عند انقطاع الإنترنت:</span>
              <span className="text-emerald-300 font-semibold">مفعّل تلقائياً ✓</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onSyncFirestore && (
              <button
                type="button"
                onClick={onSyncFirestore}
                className="px-4 py-2 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>فحص اتصال السحابة الآن</span>
              </button>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-4 py-2 rounded-xl bg-red-900/25 hover:bg-red-800/40 text-red-200 border border-red-400/30 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج / تبديل حساب جوجل</span>
              </button>
            )}
          </div>
        </div>

        {/* App Update & Version Check Card */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D4AF37]/20">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <RefreshCw
                className={`w-5 h-5 text-[#D4AF37] ${
                  updateStatus === 'checking' || updateStatus === 'updating' ? 'animate-spin' : ''
                }`}
              />
              <h3 className="text-lg font-bold font-amiri text-white">
                تحديث التطبيق والتحقق من النسخة
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#F3E5AB]/80 bg-[#07241B] px-2.5 py-1 rounded-lg border border-[#D4AF37]/25">
              الإصدار: {currentVersion}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            يمكنك فحص وجود إصدار جديد من التطبيق وتحديثه مباشرة على الكمبيوتر والموبايل دون الحاجة لحذف التطبيق وإعادة تثبيته.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCheckUpdate}
              disabled={updateStatus === 'checking' || updateStatus === 'updating'}
              className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow cursor-pointer transition active:scale-95 disabled:opacity-70"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#07241B] ${
                  updateStatus === 'checking' || updateStatus === 'updating' ? 'animate-spin' : ''
                }`}
              />
              <span>تحديث التطبيق</span>
            </button>

            <button
              type="button"
              onClick={onOpenInstallModal}
              className="px-4 py-2.5 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-[#D4AF37]" />
              <span>تثبيت التطبيق على الجهاز</span>
            </button>
          </div>

          {(updateMessage || hasUpdateAvailable) && (
            <div
              role="status"
              className={`rounded-2xl p-3.5 text-xs font-bold border flex items-center gap-2 ${
                updateStatus === 'updating' || hasUpdateAvailable
                  ? 'bg-amber-900/35 border-amber-400/60 text-amber-200'
                  : updateStatus === 'up-to-date'
                  ? 'bg-emerald-900/40 border-emerald-400/50 text-emerald-200'
                  : 'bg-[#07241B] border-[#D4AF37]/40 text-[#F3E5AB]'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-[#D4AF37]" />
              <span>
                {updateMessage || 'فيه تحديث جديد، اضغط على زر «تحديث التطبيق» للتحديث الآن.'}
              </span>
            </div>
          )}
        </div>

        {/* Data Backup & Restore with Universal Download Feedback */}
        <div className="bg-[#0B3D2E] border border-[#D4AF37]/25 rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-base font-bold font-amiri text-[#F3E5AB]">
              النسخ الاحتياطي واستعادة البيانات (Backup & Restore)
            </h3>
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="text-xs text-[#D4AF37] underline cursor-pointer"
            >
              تثبيت التطبيق مباشرة
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExportData}
              className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#07241B]" />
              <span>تصدير وتحميل نسخة احتياطية (JSON)</span>
            </button>

            <input
              type="file"
              ref={importFileRef}
              onChange={handleImportFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
              <span>استيراد نسخة احتياطية</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    'هل أنت متأكد من تصفير ومسح جميع البيانات (الطلاب، المعلمين، المواعيد، الحضور، المدفوعات) من حسابك؟ لا يمكن التراجع عن هذه الخطوة.'
                  )
                ) {
                  onResetData();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-red-900/20 hover:bg-red-800/30 text-red-300 border border-red-500/20 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تصفير ومسح جميع البيانات (0)</span>
            </button>
          </div>

          {exportDownloadState && (
            <DownloadFeedbackBox
              state={exportDownloadState}
              title="النسخة الاحتياطية - أكاديمية الفرقان"
            />
          )}
        </div>
      </form>
    </div>
  );
};
