import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
}

/**
 * QR Code Generator Component
 * Generates 100% standard ISO/IEC 18004 compliant QR codes with high scannability.
 */
export const QRCodeSvg: React.FC<QRCodeSvgProps> = ({
  value,
  size = 200,
  className = '',
  bgColor = '#ffffff',
  fgColor = '#000000',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: 'M',
      },
      (error) => {
        if (error) console.error('Erro ao gerar QR Code:', error);
      }
    );
  }, [value, size, bgColor, fgColor]);

  return (
    <div className={`relative inline-flex items-center justify-center p-2.5 bg-white rounded-2xl shadow-md ${className}`}>
      <canvas ref={canvasRef} className="block rounded-lg" />
    </div>
  );
};
