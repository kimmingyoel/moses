// Shared upload limits and validation used by both the client uploader and the
// extract route handler, so the two never disagree on what counts as a valid
// receipt image or on the message shown when it doesn't.

export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const supportedTypes = new Set<string>(SUPPORTED_IMAGE_TYPES);

export function isSupportedImageType(type: string): boolean {
  return supportedTypes.has(type);
}

// Returns a user-facing Korean message when the file can't be analyzed, or null
// when it passes. Runs on the client before upload (instant feedback, no wasted
// bandwidth) and again on the server as a defense-in-depth check.
export function validateUploadFile(file: { type: string; size: number }): string | null {
  if (!isSupportedImageType(file.type)) {
    return "JPG, PNG, WEBP 이미지만 분석할 수 있어요.";
  }
  if (file.size <= 0) {
    return "빈 파일이에요. 다른 영수증 사진을 선택해 주세요.";
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return "이미지 용량이 너무 커요. 더 작은 사진으로 올려 주세요.";
  }
  return null;
}
