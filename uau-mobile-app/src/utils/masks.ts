export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function unmaskCPF(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function unmaskPhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskLicensePlate(value: string): string {
  const raw = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7);
  if (raw.length <= 3) return raw;
  return `${raw.slice(0, 3)}-${raw.slice(3)}`;
}

export function unmaskLicensePlate(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}
