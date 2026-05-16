export const AVATAR_VIEWPORT_SIZE = 240;
export const AVATAR_OUTPUT_SIZE = 400;
export const AVATAR_DEFAULT_ZOOM = 1.15;
export const AVATAR_MIN_ZOOM = 1.05;
export const AVATAR_MAX_ZOOM = 3;

export function clampAvatarOffset(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the selected image."));
    image.src = src;
  });
}

export function buildAvatarFileName(sourceName: string, mimeType: string) {
  const extension =
    mimeType === "image/jpeg"
      ? "jpg"
      : mimeType === "image/webp"
        ? "webp"
        : mimeType === "image/png"
          ? "png"
          : "png";
  const baseName = sourceName.replace(/\.[^.]+$/, "") || "avatar";
  return `${baseName}-avatar.${extension}`;
}

export async function cropAvatarFile(
  file: File,
  previewUrl: string,
  dimensions: { width: number; height: number },
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const image = await loadImageElement(previewUrl);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  const baseScale = Math.max(
    AVATAR_VIEWPORT_SIZE / dimensions.width,
    AVATAR_VIEWPORT_SIZE / dimensions.height,
  );
  const scale = baseScale * zoom;
  const sourceWidth = AVATAR_VIEWPORT_SIZE / scale;
  const sourceHeight = AVATAR_VIEWPORT_SIZE / scale;
  const sourceX = clampAvatarOffset(
    (dimensions.width - sourceWidth) / 2 - offsetX / scale,
    0,
    Math.max(0, dimensions.width - sourceWidth),
  );
  const sourceY = clampAvatarOffset(
    (dimensions.height - sourceHeight) / 2 - offsetY / scale,
    0,
    Math.max(0, dimensions.height - sourceHeight),
  );

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);

  const mimeType = file.type || "image/png";
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, 0.92);
  });

  if (!blob) {
    return file;
  }

  return new File([blob], buildAvatarFileName(file.name, mimeType), { type: mimeType });
}
