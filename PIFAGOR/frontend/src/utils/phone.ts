const PHONE_PREFIX = "+375";
const PHONE_DIGITS = 9;

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";

  // User is deleting into the prefix — keep only the prefix
  if (digits.length < 4 && !digits.startsWith("375")) {
    return PHONE_PREFIX;
  }

  const stripped = digits.startsWith("375") ? digits.slice(3) : digits;
  return PHONE_PREFIX + stripped.slice(0, PHONE_DIGITS);
}

export function isPhoneValid(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  const stripped = digits.startsWith("375") ? digits.slice(3) : digits;
  return stripped.length === PHONE_DIGITS;
}

export { PHONE_PREFIX, PHONE_DIGITS };
