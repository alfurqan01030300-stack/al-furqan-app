import React from 'react';

interface AcademyLogoProps {
  logoUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBorder?: boolean;
}

export const AcademyLogo: React.FC<AcademyLogoProps> = ({
  logoUrl,
  className = '',
  size = 'md',
  showBorder = true,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-11 h-11 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl',
    '2xl': 'w-32 h-32 text-6xl',
  };

  const containerSize = sizeMap[size] || sizeMap.md;

  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden flex items-center justify-center bg-[#07241B] ${containerSize} ${
          showBorder ? 'border-2 border-[#D4AF37]/60 shadow-[0_0_15px_rgba(212,175,55,0.25)]' : ''
        } ${className}`}
      >
        <img
          src={logoUrl}
          alt="شعار أكاديمية الفرقان الدولية"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Default noble gold "ف" in emerald circle
  return (
    <div
      className={`relative rounded-2xl flex items-center justify-center select-none bg-gradient-to-br from-[#145A43] via-[#0B3D2E] to-[#06241B] ${containerSize} ${
        showBorder ? 'border-2 border-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.35)]' : ''
      } ${className}`}
    >
      {/* Decorative inner Islamic ring */}
      <div className="absolute inset-1 rounded-xl border border-dashed border-[#D4AF37]/50 pointer-events-none" />

      {/* Arabic Calligraphy Letter ف (Al-Furqan) */}
      <span className="font-amiri font-bold text-[#FDF0A6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-none select-none pb-0.5">
        ف
      </span>

      {/* Tiny gold shine pip */}
      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]/80 animate-pulse pointer-events-none" />
    </div>
  );
};
