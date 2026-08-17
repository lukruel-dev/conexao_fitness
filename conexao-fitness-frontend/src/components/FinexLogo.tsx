import React from "react";
import logoBadgeImg from "@/assets/finex_logo_badge.jpg";
import logoDynamicImg from "@/assets/finex_logo_dynamic.jpg";

interface FinexLogoProps {
  variant?: "horizontal" | "badge" | "icon" | "image-badge" | "image-dynamic";
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const FinexLogo: React.FC<FinexLogoProps> = ({
  variant = "horizontal",
  className = "",
  imageClassName = "",
  showText = true,
  size = "md",
}) => {
  const sizeMap = {
    sm: { img: "h-7 md:h-8", text: "text-lg md:text-xl", badge: "w-8 h-8" },
    md: { img: "h-9 md:h-11", text: "text-xl md:text-2xl", badge: "w-10 h-10 md:w-11 md:h-11" },
    lg: { img: "h-12 md:h-14", text: "text-2xl md:text-3xl", badge: "w-14 h-14" },
    xl: { img: "h-16 md:h-20", text: "text-3xl md:text-4xl", badge: "w-20 h-20" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === "image-badge") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={logoBadgeImg}
          alt="Finex Fitness"
          className={`${currentSize.badge} rounded-xl object-cover shadow-glow-blue/20 shadow-md ${imageClassName}`}
        />
        {showText && (
          <span className={`font-display font-black tracking-wider ${currentSize.text}`}>
            <span className="text-foreground">FINE</span>
            <span className="text-secondary">X</span>
          </span>
        )}
      </div>
    );
  }

  if (variant === "image-dynamic") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={logoDynamicImg}
          alt="Finex"
          className={`${currentSize.badge} rounded-xl object-cover shadow-glow-blue/20 shadow-md ${imageClassName}`}
        />
        {showText && (
          <span className={`font-display font-black tracking-wider ${currentSize.text}`}>
            <span className="text-foreground">FINE</span>
            <span className="text-secondary">X</span>
          </span>
        )}
      </div>
    );
  }

  // Default: Clean Vector SVG Icon with brand-matched gradient + optional typography
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Sleek FX Vector Monogram */}
      <div className={`relative shrink-0 flex items-center justify-center ${currentSize.badge}`}>
        <img
          src={logoBadgeImg}
          alt="Finex Logo"
          className="w-full h-full rounded-xl object-cover ring-1 ring-border/50 hover:scale-105 transition-transform"
        />
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className={`font-display font-black tracking-wider ${currentSize.text}`}>
            <span className="text-foreground">FINE</span>
            <span className="text-secondary">X</span>
          </span>
          {size !== "sm" && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">
              FITNESS
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FinexLogo;
