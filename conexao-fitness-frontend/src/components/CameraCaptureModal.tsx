import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, SwitchCamera, Check, AlertCircle, X, Smartphone } from "lucide-react";
import { isNativePlatform, captureNativePhoto } from "@/utils/nativeCamera";

interface CameraCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
  title?: string;
  description?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  open,
  onOpenChange,
  onCapture,
  title = "Tirar Foto com a Câmera",
  description = "Posicione-se no centro do enquadramento e capture a sua foto.",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode: "user" | "environment") => {
    stopStream();
    setError(null);
    setIsStarting(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador ou dispositivo não possui suporte para acesso direto à câmera.");
      }

      // Check available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        // Enumerate fallback
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: mode,
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStarting(false);
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      setIsStarting(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Permissão para usar a câmera foi negada. Por favor, permita o acesso nas configurações do navegador.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("Nenhuma câmera foi detectada no seu dispositivo.");
      } else {
        setError("Não foi possível iniciar a câmera. Verifique as permissões ou tente novamente.");
      }
    }
  };

  useEffect(() => {
    if (open) {
      setCapturedImage(null);
      setCapturedBlob(null);
      startCamera(facingMode);
    } else {
      stopStream();
      setCapturedImage(null);
      setCapturedBlob(null);
      setError(null);
    }

    return () => {
      stopStream();
    };
  }, [open, facingMode]);

  const toggleCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    // Crop square from the center of video frame
    const size = Math.min(width, height);
    const startX = (width - size) / 2;
    const startY = (height - size) / 2;

    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If user facing mode, flip horizontally for mirror effect like a selfie camera
    if (facingMode === "user") {
      ctx.translate(600, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, 600, 600);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const previewUrl = URL.createObjectURL(blob);
          setCapturedImage(previewUrl);
          stopStream();
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `camera-photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    onCapture(file);
    onOpenChange(false);
  };

  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      onOpenChange(false);
    }
    e.target.value = "";
  };

  const handleNativeCameraTrigger = async () => {
    if (isNativePlatform()) {
      try {
        const file = await captureNativePhoto({ source: "camera" });
        if (file) {
          onCapture(file);
          onOpenChange(false);
        }
      } catch (err: any) {
        console.error("Erro na captura nativa:", err);
      }
    } else {
      nativeCameraInputRef.current?.click();
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Input nativo de câmera para celulares e navegadores */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleNativeCapture}
        />

        <div className="my-3 flex flex-col items-center justify-center">
          {error ? (
            <div className="p-6 text-center bg-destructive/10 border border-destructive/20 rounded-2xl w-full space-y-3">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
              <p className="text-sm font-medium text-destructive">{error}</p>
              
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleNativeCameraTrigger}
                  className="gap-2 bg-primary text-primary-foreground font-semibold shadow-md"
                >
                  <Camera className="w-4 h-4" /> Abrir Câmera do Celular / Dispositivo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startCamera(facingMode)}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Tentar WebCam Novamente
                </Button>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="relative w-72 h-72 rounded-2xl overflow-hidden border-2 border-primary shadow-lg bg-black flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Foto capturada"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="relative w-72 h-72 rounded-2xl overflow-hidden border-2 border-border bg-black shadow-inner flex items-center justify-center group">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Circular framing visual guide */}
              <div className="absolute inset-0 border-4 border-white/20 rounded-full pointer-events-none scale-90" />

              {/* Flip camera button */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
                  title="Alternar Câmera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}

              {isStarting && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Iniciando câmera...</span>
                </div>
              )}
            </div>
          )}

          {/* Hidden canvas used for frame capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          {capturedImage ? (
            <>
              <Button variant="outline" onClick={handleRetake} className="gap-1.5">
                <RefreshCw className="w-4 h-4" /> Tirar outra
              </Button>
              <Button onClick={handleConfirm} className="gap-1.5 bg-primary text-primary-foreground">
                <Check className="w-4 h-4" /> Usar esta foto
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCapture}
                disabled={isStarting || !!error}
                className="gap-1.5"
              >
                <Camera className="w-4 h-4" /> Capturar Foto
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
