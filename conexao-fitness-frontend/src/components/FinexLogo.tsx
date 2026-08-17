import React from "react";
import finexCircleImg from "@/assets/finex_icon_circle.jpg";
import finexBadgeImg from "@/assets/finex_logo_badge.jpg";

interface FinexLogoProps {
  variant?: "circle" | "badge" | "icon";
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const FinexLogo: React.FC<FinexLogoProps> = ({
  variant = "circle",
  className = "",
  imageClassName = "",
  showText = true,
  size = "md",
}) => {
  const sizeMap = {
    sm: {
      badge: "w-8 h-8",
      title: "text-lg",
      subtitle: "text-[8px] tracking-[0.2em]",
      gap: "gap-2",
    },
    md: {
      badge: "w-9 h-9 md:w-11 md:h-11",
      title: "text-xl md:text-2xl leading-none",
      subtitle: "text-[9px] md:text-[10px] tracking-[0.28em]",
      gap: "gap-2.5 md:gap-3",
    },
    lg: {
      badge: "w-12 h-12 md:w-14 md:h-14",
      title: "text-2xl md:text-3xl leading-none",
      subtitle: "text-[10px] md:text-[12px] tracking-[0.3em]",
      gap: "gap-3 md:gap-4",
    },
    xl: {
      badge: "w-16 h-16 md:w-20 md:h-20",
      title: "text-3xl md:text-4xl leading-none",
      subtitle: "text-[12px] md:text-[14px] tracking-[0.35em]",
      gap: "gap-4 md:gap-5",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === "icon") {
    return (
      <div className={`relative shrink-0 flex items-center justify-center ${currentSize.badge} ${className}`}>
        <img
          src={finexCircleImg}
          alt="Finex FX"
          className={`w-full h-full rounded-full object-cover shadow-sm ring-1 ring-primary/40 shadow-glow-blue/20 hover:scale-105 transition-transform ${imageClassName}`}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      {/* 1. Círculo com FX dentro no canto esquerdo */}
      <div className={`relative shrink-0 flex items-center justify-center ${currentSize.badge}`}>
        <img
          src={finexCircleImg}
          alt="Finex Icon"
          className={`w-full h-full rounded-full object-cover ring-2 ring-primary/30 shadow-md shadow-glow-blue/25 hover:scale-105 transition-all duration-300 ${imageClassName}`}
        />
      </div>

      {/* 2. Texto estilizado ao lado: FINEX + — FITNESS — */}
      {showText && (
        <div className="flex flex-col justify-center select-none shrink-0">
          {/* Linha 1: FINEX com FINE em branco/foreground e X em verde neon */}
          <div className={`font-display font-black tracking-wider ${currentSize.title} flex items-center`}>
            <span className="text-foreground">FINE</span>
            <span className="text-secondary drop-shadow-[0_0_8px_rgba(118,224,0,0.35)]">X</span>
          </div>

          {/* Linha 2: — FITNESS — com traços laterais sutis */}
          <div className="flex items-center gap-1.5 w-full mt-0.5 opacity-90">
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
