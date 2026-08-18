import React from "react";
import finexLogoTransparent from "@/assets/finex_logo_transparent.png";
import finexTextTransparent from "@/assets/finex_text_transparent.png";

interface FinexLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const FinexLogo: React.FC<FinexLogoProps> = ({
  className = "",
  imageClassName = "",
  textClassName = "",
  showText = true,
  size = "md",
}) => {
  // Tamanhos da logo circular e do texto metálico transparente
  const sizeMap = {
    sm: {
      badge: "w-9 h-9 md:w-10 md:h-10",
      textHeight: "h-6 md:h-7",
      gap: "gap-2.5",
    },
    md: {
      badge: "w-12 h-12 md:w-14 md:h-14",
      textHeight: "h-8 md:h-10",
      gap: "gap-3 md:gap-3.5",
    },
    lg: {
      badge: "w-16 h-16 md:w-20 md:h-20",
      textHeight: "h-12 md:h-14",
      gap: "gap-4",
    },
    xl: {
      badge: "w-24 h-24 md:w-28 md:h-28",
      textHeight: "h-16 md:h-20",
      gap: "gap-5",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      {/* 1. Círculo FX com fundo transparente */}
      <div className={`relative shrink-0 flex items-center justify-center ${currentSize.badge}`}>
        <img
          src={finexLogoTransparent}
          alt="Finex Icon"
          className={`w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,166,255,0.25)] hover:scale-105 transition-all duration-300 ${imageClassName}`}
        />
      </div>

      {/* 2. Imagem da Tipografia FINEX FITNESS 3D com fundo transparente */}
      {showText && (
        <div className="flex items-center shrink-0">
          <img
            src={finexTextTransparent}
            alt="Finex Fitness"
            className={`${currentSize.textHeight} w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${textClassName}`}
          />
        </div>
      )}
    </div>
  );
};

export default FinexLogo;
