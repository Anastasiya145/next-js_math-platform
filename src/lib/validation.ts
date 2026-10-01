import { errorMessages } from "@/lib/error-messages";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export function validateEmail(value: string, required = true): string | null {
  const email = value.trim();
  if (!email) return required ? errorMessages.students.emailRequired : null;
  if (email.length > MAX_EMAIL_LENGTH) {
    return errorMessages.students.emailTooLong(MAX_EMAIL_LENGTH);
  }
  if (!EMAIL_PATTERN.test(email)) return errorMessages.students.emailInvalid;
  return null;
}

export function validatePassword(
  value: string,
  required = true,
): string | null {
  if (!value) return required ? errorMessages.students.passwordRequired : null;
  if (value.length < MIN_PASSWORD_LENGTH) {
    return errorMessages.students.passwordTooShort(MIN_PASSWORD_LENGTH);
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    return errorMessages.students.passwordTooLong(MAX_PASSWORD_LENGTH);
  }
  return null;
}
