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
  // Tamanhos da logo circular com definição vetorial HD (aumento perceptível e imponente)
  const sizeMap = {
    sm: {
      badge: "w-11 h-11 md:w-12 md:h-12",
      textHeight: "h-8 md:h-9",
      gap: "gap-2.5 sm:gap-3",
    },
    md: {
      badge: "w-14 h-14 md:w-16 md:h-16",
      textHeight: "h-9 md:h-11",
      gap: "gap-3 md:gap-3.5",
    },
    lg: {
      badge: "w-18 h-18 md:w-22 md:h-22",
      textHeight: "h-12 md:h-15",
      gap: "gap-3.5 md:gap-4",
    },
    xl: {
      badge: "w-28 h-28 md:w-32 md:h-32",
      textHeight: "h-18 md:h-22",
      gap: "gap-5",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center group cursor-pointer select-none transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] ${currentSize.gap} ${className}`}>
      {/* 1. Círculo FX Vetorial HD (Fundo 100% Transparente & Nitidez Máxima) */}
      <div className={`relative shrink-0 flex items-center justify-center ${currentSize.badge}`}>
        <img
          src={finexIconHd}
          alt="Finex"
          className={`w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(0,166,255,0.35)] group-hover:drop-shadow-[0_0_18px_rgba(0,166,255,0.65)] group-hover:scale-105 transition-all duration-300 ${imageClassName}`}
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
