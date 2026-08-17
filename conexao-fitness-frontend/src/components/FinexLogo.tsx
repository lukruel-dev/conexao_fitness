import React from "react";
import finexLogoBadge from "@/assets/finex_logo_badge.jpg";

interface FinexLogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const FinexLogo: React.FC<FinexLogoProps> = ({
  className = "",
  imageClassName = "",
  showText = true,
  size = "md",
}) => {
  // Tamanhos com o diâmetro da logo aumentado em 50%
  const sizeMap = {
    sm: {
      badge: "w-10 h-10 md:w-11 md:h-11",
      title: "text-lg md:text-xl",
      subtitle: "text-[8px] md:text-[9px] tracking-[0.22em]",
      gap: "gap-2.5",
    },
    md: {
      badge: "w-12 h-12 md:w-14 md:h-14",
      title: "text-2xl md:text-3xl leading-none",
      subtitle: "text-[10px] md:text-[11px] tracking-[0.28em]",
      gap: "gap-3 md:gap-3.5",
    },
    lg: {
      badge: "w-16 h-16 md:w-20 md:h-20",
      title: "text-3xl md:text-4xl leading-none",
      subtitle: "text-[12px] md:text-[13px] tracking-[0.32em]",
      gap: "gap-4",
    },
    xl: {
      badge: "w-24 h-24 md:w-28 md:h-28",
      title: "text-4xl md:text-5xl leading-none",
      subtitle: "text-[14px] md:text-[16px] tracking-[0.35em]",
      gap: "gap-5",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      {/* Círculo do finex_logo_badge.jpg com diâmetro 50% maior */}
      <div className={`relative shrink-0 flex items-center justify-center ${currentSize.badge}`}>
        <img
          src={finexLogoBadge}
          alt="Finex"
          className={`w-full h-full rounded-full object-cover shadow-md hover:scale-105 transition-all duration-300 ${imageClassName}`}
        />
      </div>

      {/* Texto FINEX + — FITNESS — */}
      {showText && (
        <div className="flex flex-col justify-center select-none shrink-0">
          <div className={`font-display font-black tracking-wider ${currentSize.title} flex items-center`}>
            <span className="text-foreground">FINE</span>
            <span className="text-secondary drop-shadow-[0_0_10px_rgba(118,224,0,0.4)]">X</span>
          </div>

          <div className="flex items-center gap-1.5 w-full mt-1 opacity-90">
            <span className="h-[1.5px] bg-gradient-to-r from-transparent to-muted-foreground/60 flex-1 rounded-full" />
            <span className={`font-display font-bold uppercase text-muted-foreground ${currentSize.subtitle}`}>
              FITNESS
            </span>
            <span className="h-[1.5px] bg-gradient-to-l from-transparent to-muted-foreground/60 flex-1 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FinexLogo;
