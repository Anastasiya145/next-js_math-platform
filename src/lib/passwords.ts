import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PASSWORD_BYTES = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_BYTES).toString("hex");
  return { salt, hash };
}

export function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
) {
  const actualHash = scryptSync(password, salt, PASSWORD_BYTES);
  const expected = Buffer.from(expectedHash, "hex");
  return (
    expected.length === actualHash.length &&
    timingSafeEqual(actualHash, expected)
  );
}
