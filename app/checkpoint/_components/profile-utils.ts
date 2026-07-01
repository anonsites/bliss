
export const genderOptions = ["Male", "Female"] as const;

export const PROFILE_PREVIEW_SIZE = 220;
export const PROFILE_OUTPUT_SIZE = 800;

export type GenderOption = (typeof genderOptions)[number];

export type CropState = {
  zoom: number;
  x: number;
  y: number;
};

export type StepOneErrors = {
  username?: string;
  age?: string;
  gender?: string;
};

export type StepTwoErrors = {
  profileImage?: string;
  galleryImages?: string;
  submit?: string;
};

export type CompleteProfileData = {
  username: string;
  age: number;
  gender: GenderOption;
  profileImage: File;
  galleryImages: [File, File];
  location?: { latitude: number; longitude: number };
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function parseAge(value: string) {
  const age = Number(value);

  if (!Number.isInteger(age) || age < 18 || age > 120) {
    return null;
  }

  return age;
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = src;
  });
}

export async function createCroppedProfileImage(file: File, crop: CropState) {
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(sourceUrl);
    const baseScale = Math.max(
      PROFILE_OUTPUT_SIZE / image.naturalWidth,
      PROFILE_OUTPUT_SIZE / image.naturalHeight,
    );
    const drawWidth = image.naturalWidth * baseScale * crop.zoom;
    const drawHeight = image.naturalHeight * baseScale * crop.zoom;
    const translateScale = PROFILE_OUTPUT_SIZE / PROFILE_PREVIEW_SIZE;

    const canvas = document.createElement("canvas");
    canvas.width = PROFILE_OUTPUT_SIZE;
    canvas.height = PROFILE_OUTPUT_SIZE;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is unavailable.");
    }

    const drawX = clamp(
      (PROFILE_OUTPUT_SIZE - drawWidth) / 2 + crop.x * translateScale,
      PROFILE_OUTPUT_SIZE - drawWidth,
      0,
    );
    const drawY = clamp(
      (PROFILE_OUTPUT_SIZE - drawHeight) / 2 + crop.y * translateScale,
      PROFILE_OUTPUT_SIZE - drawHeight,
      0,
    );

    context.clearRect(0, 0, PROFILE_OUTPUT_SIZE, PROFILE_OUTPUT_SIZE);
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      throw new Error("Failed to export cropped image.");
    }

    const filename = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${filename || "profile"}-cropped.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
