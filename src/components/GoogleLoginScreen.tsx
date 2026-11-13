import React from 'react';
import {
  Cloud,
  Download,
  ExternalLink,
  Lock,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { AcademyLogo } from './AcademyLogo';
import { FIREBASE_HOSTING_URL } from '../firebase/config';

interface GoogleLoginScreenProps {
  onGoogleLogin: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  isTemporaryHost?: boolean;
  onInstallApp?: () => void;
  installLabel?: string;
}

export const GoogleLoginScreen: React.FC<GoogleLoginScreenProps> = ({
  onGoogleLogin,
  isLoading,
  errorMessage,
  isTemporaryHost = false,
  onInstallApp,
  installLabel = 'تثبيت التطبيق',
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#07241B] text-slate-100 bg-islamic-pattern px-4 py-8">
      <div className="w-full max-w-md bg-[#0B3D2E]/95 border-2 border-[#D4AF37]/45 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-6 text-center backdrop-blur-md">
        {/* Academy Emblem */}
        <div className="flex flex-col items-center gap-3">
          <AcademyLogo size="2xl" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-white">
              الأكاديمية
            </h1>
            <p className="text-xs sm:text-sm text-[#D4AF37] font-semibold mt-1">
              نظام الإدارة والمتابعة الشامل لتحفيظ القرآن الكريم
            </p>
          </div>
        </div>

        {/* Cloud Sync Value Props */}
        <div className="bg-[#07241B]/80 border border-[#D4AF37]/25 rounded-2xl p-4 text-right space-y-2.5 text-xs text-slate-200">
          <div className="flex items-start gap-2.5">
            <Cloud className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong>مزامنة لحظية بين التليفون والكمبيوتر:</strong> أي طالب أو معلم أو موعد تضيفه يظهر فوراً على كل أجهزتك بنفس حساب الجيميل.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>خصوصية كاملة:</strong> كل مستخدم يرى بيانات حسابه فقط، ولا يتم حفظ أي بيانات بدون تسجيل الدخول بجوجل.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <span>
              <strong>يعمل حتى لو انقطع الإنترنت:</strong> تعديلاتك تُحفظ وتُرسل تلقائياً بمجرد عودة الاتصال.
            </span>
          </div>
        </div>

        {/* Google Sign-In Error (shown only on official domain, never on preview screen) */}
        {!isTemporaryHost && errorMessage && (
          <div
            role="alert"
            className="bg-red-950/70 border border-red-400/50 text-red-200 rounded-2xl p-3 text-xs font-semibold text-right leading-relaxed"
          >
            {errorMessage}
          </div>
        )}

        {/* Primary Google Sign-In Action:
            - On preview domains (ais-dev / ais-pre / etc.): opens the official fixed domain directly (never runs auth locally).
            - On the official domain (al-furqan-e11b7.web.app): triggers Popup Google Sign-In directly. */}
        {isTemporaryHost ? (
          <div className="space-y-2">
            <a
              href={FIREBASE_HOSTING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-[#07241B] font-extrabold text-sm sm:text-base shadow-[0_6px_25px_rgba(255,255,255,0.2)] cursor-pointer transition active:scale-95"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>الدخول بجوجل</span>
              <ExternalLink className="w-4 h-4 text-[#0B3D2E] shrink-0" />
            </a>
            <p className="text-[11px] text-[#F3E5AB]/90 font-semibold">
              يفتح الدخول مباشرة على الدومين الرسمي:{' '}
              <span dir="ltr" className="underline">
                al-furqan-e11b7.web.app
              </span>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-[#07241B] font-extrabold text-sm sm:text-base shadow-[0_6px_25px_rgba(255,255,255,0.2)] cursor-pointer transition active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-[#0B3D2E]" />
                <span>جاري الدخول بحساب جوجل...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>الدخول بجوجل</span>
              </>
            )}
          </button>
        )}

        {/* Secondary Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#D4AF37]/20 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>حساب آمن ومشفر</span>
          </span>

          {onInstallApp && (
            <button
              type="button"
              onClick={onInstallApp}
              className="flex items-center gap-1.5 text-[#F3E5AB] hover:text-white font-bold cursor-pointer underline decoration-[#D4AF37]/50"
            >
              <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{installLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
