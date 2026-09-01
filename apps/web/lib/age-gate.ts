export const AGE_GATE_STORAGE_KEY = "bridge-age-confirmed-v1";
export const AGE_GATE_CONFIRMED_VALUE = "confirmed";

export function isAgeGateConfirmed(value: string | null) {
  return value === AGE_GATE_CONFIRMED_VALUE;
}
