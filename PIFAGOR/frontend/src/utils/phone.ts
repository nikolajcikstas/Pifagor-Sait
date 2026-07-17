const PHONE_PREFIX = "+375";
const PHONE_DIGITS = 9;

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0 || digits === "375") return PHONE_PREFIX;

  const stripped = digits.startsWith("375") ? digits.slice(3) : digits;
  const local = stripped.slice(0, PHONE_DIGITS);
  const code = local.slice(0, 2);
  const first = local.slice(2, 5);
  const second = local.slice(5, 7);
  const third = local.slice(7, 9);

  let formatted = PHONE_PREFIX;
  if (code) formatted += ` (${code}`;
  if (code.length === 2) formatted += ")";
  if (first) formatted += ` ${first}`;
  if (second) formatted += `-${second}`;
  if (third) formatted += `-${third}`;
  return formatted;
}

export function isPhoneValid(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  const stripped = digits.startsWith("375") ? digits.slice(3) : digits;
  return stripped.length === PHONE_DIGITS;
}

export { PHONE_PREFIX, PHONE_DIGITS };
