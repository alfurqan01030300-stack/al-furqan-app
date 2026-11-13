import React from 'react';
import { MessageCircle, PhoneCall, Download } from 'lucide-react';
import { cleanWhatsAppNumber } from '../utils/storage';

interface FooterWhatsAppProps {
  managerWhatsApp: string;
  academyName: string;
  onOpenInstallModal: () => void;
  isInstalled?: boolean;
  isIOS?: boolean;
  isInAppBrowser?: boolean;
}

export const FooterWhatsApp: React.FC<FooterWhatsAppProps> = ({
  managerWhatsApp,
  academyName,
  onOpenInstallModal,
  isInstalled = false,
  isIOS = false,
  isInAppBrowser = false,
}) => {
  const cleanNumber = cleanWhatsAppNumber(managerWhatsApp);
  const defaultMessage = encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته، أتواصل مع إدارة ${academyName} للاستفسار والمتابعة.`
  );
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultMessage}`;

  const footerInstallLabel = isInstalled
    ? '✓ تم تثبيت التطبيق بنجاح'
    : isIOS && !isInAppBrowser
    ? '📲 إضافة إلى الشاشة الرئيسية'
    : '📲 تحميل التطبيق / تثبيت التطبيق';

  return (
    <footer className="no-print sticky bottom-0 z-30 w-full bg-[#07241B]/95 backdrop-blur-md border-t border-[#D4AF37]/35 py-3 px-4 shadow-[0_-5px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Hadith / Quote */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#D4AF37]/90 font-amiri shrink-0">
          <span className="text-sm">🌿</span>
          <span>قال رسول الله ﷺ: «خَيرُكُم مَن تَعلَّمَ القُرآنَ وعَلَّمَهُ»</span>
        </div>

        {/* Buttons Row: Direct Install App + WhatsApp Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto flex-1 justify-end">
          {/* Prominent Footer Direct Install App Button */}
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="gold-gradient-btn flex items-center justify-center gap-2 px-5 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold shadow-[0_4px_18px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.5)] cursor-pointer transition transform active:scale-95 border border-[#D4AF37]/60"
            title={footerInstallLabel}
          >
            <Download className="w-4 h-4 text-[#07241B]" />
            <span>{footerInstallLabel}</span>
          </button>

          {/* Big Green WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 sm:py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.6)] transition-all transform active:scale-95 group text-center"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute -inset-1 rounded-full bg-white/30 animate-ping group-hover:block" />
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-transparent relative z-10" />
            </div>
            <span className="tracking-wide">تواصل واتساب مع مدير الأكاديمية</span>
            {managerWhatsApp && (
              <span className="text-[11px] bg-black/20 text-white/90 px-2 py-0.5 rounded-full font-mono dir-ltr hidden xs:inline" dir="ltr">
                {managerWhatsApp}
              </span>
            )}
          </a>

          {/* Direct Phone Call */}
          {cleanNumber && (
            <a
              href={`tel:${cleanNumber}`}
              className="hidden sm:flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition border border-white/10"
              title="اتصال هاتفي مباشر"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden xl:inline">اتصال</span>
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};
