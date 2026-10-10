export const MAX_SUBMISSION_FILES = 10;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_SUBMISSION_SIZE = 30 * 1024 * 1024;
export const SUBMISSION_FILE_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt";
export const ALLOWED_FILE_TYPES: ReadonlySet<string> = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);
