import React from "react";
import { Link } from "react-router-dom";
import finexIconHd from "@/assets/finex_icon_hd.png";
import finexTextHd from "@/assets/finex_text_hd.png";

interface FinexLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  to?: string;
}

export const FinexLogo: React.FC<FinexLogoProps> = ({
  className = "",
  imageClassName = "",
  textClassName = "",
  showText = true,
  size = "md",
  to,
}) => {
  // Tamanhos da logo circular com definição vetorial HD com contenção rigorosa
  const sizeMap = {
    sm: {
      badge: "w-10 h-10 md:w-11 md:h-11 max-w-[44px] max-h-[44px]",
      textHeight: "h-7 md:h-8 max-h-[32px]",
      gap: "gap-2.5 sm:gap-3",
    },
    md: {
      badge: "w-12 h-12 md:w-14 md:h-14 max-w-[56px] max-h-[56px]",
      textHeight: "h-8 md:h-10 max-h-[40px]",
      gap: "gap-3 md:gap-3.5",
    },
    lg: {
      badge: "w-16 h-16 md:w-20 md:h-20 max-w-[80px] max-h-[80px]",
      textHeight: "h-10 md:h-12 max-h-[48px]",
      gap: "gap-3.5 md:gap-4",
    },
    xl: {
      badge: "w-24 h-24 md:w-28 md:h-28 max-w-[112px] max-h-[112px]",
      textHeight: "h-14 md:h-16 max-h-[64px]",
      gap: "gap-4 md:gap-5",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center group cursor-pointer select-none transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] ${currentSize.gap} ${className}`}>
      {/* 1. Círculo FX Vetorial HD (Fundo 100% Transparente & Nitidez Máxima) */}
      <div className={`relative shrink-0 flex items-center justify-center overflow-hidden ${currentSize.badge}`}>
        <img
          src={finexIconHd}
          alt="Finex"
          className={`w-full h-full max-w-full max-h-full object-contain filter drop-shadow-[0_0_12px_rgba(0,166,255,0.35)] group-hover:drop-shadow-[0_0_18px_rgba(0,166,255,0.65)] group-hover:scale-105 transition-all duration-300 ${imageClassName}`}
        />
      </div>

      {/* 2. Tipografia FINEX FITNESS 3D Vetorial HD */}
      {showText && (
        <div className="flex items-center shrink-0">
          <img
            src={finexTextHd}
            alt="Finex Fitness"
            className={`${currentSize.textHeight} w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:brightness-110 transition-all duration-300 ${textClassName}`}
          />
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center shrink-0 focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

export default FinexLogo;
