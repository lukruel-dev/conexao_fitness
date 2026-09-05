import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

export const isNativePlatform = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export interface CapturePhotoOptions {
  source?: "camera" | "photos" | "prompt";
  quality?: number;
}

/**
 * Captura uma foto utilizando a API nativa do dispositivo (Android/iOS via Capacitor)
 * com solicitação automática de permissões no sistema operacional.
 */
export async function captureNativePhoto(
  options: CapturePhotoOptions = { source: "camera", quality: 90 }
): Promise<File | null> {
  const capSource =
    options.source === "photos"
      ? CameraSource.Photos
      : options.source === "prompt"
      ? CameraSource.Prompt
      : CameraSource.Camera;

  try {
    const photo = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: capSource,
      saveToGallery: false,
      promptLabelHeader: "Foto de Perfil",
      promptLabelPhoto: "Escolher da Galeria",
      promptLabelPicture: "Tirar Foto com a Câmera",
      promptLabelCancel: "Cancelar",
    });

    if (!photo || !photo.webPath) {
      return null;
    }

    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const format = photo.format || "jpeg";
    const filename = `photo-${Date.now()}.${format === "jpg" ? "jpeg" : format}`;
    const file = new File([blob], filename, {
      type: `image/${format === "jpg" ? "jpeg" : format}`,
    });

    return file;
  } catch (err: any) {
    // Se o usuário apenas cancelou a ação da câmera/galeria
    const message = err?.message || String(err);
    if (
      message.includes("User cancelled") ||
      message.includes("cancelled") ||
      message.includes("canceled")
    ) {
      return null;
    }
    console.error("Erro ao capturar foto nativa:", err);
    throw err;
  }
}
