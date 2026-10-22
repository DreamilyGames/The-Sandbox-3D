export function IsNumeric(value: string): boolean {
  return value.trim() !== "" && Number.isFinite(Number(value));
}