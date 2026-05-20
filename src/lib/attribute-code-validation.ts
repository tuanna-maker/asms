/** Mã danh mục kho/đơn vị có thể dùng tiếng Việt (legacy seed). */
const LEGACY_UNICODE_CATEGORIES = new Set(["warehouse", "material_unit"]);

const CODE_LATIN = /^[A-Za-z0-9._-]+$/;
const CODE_UNICODE = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u;

export function isValidDefinitionCode(category: string, code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return false;
  if (LEGACY_UNICODE_CATEGORIES.has(category)) return CODE_UNICODE.test(trimmed);
  return CODE_LATIN.test(trimmed);
}

export function definitionCodeHint(category: string): string {
  if (LEGACY_UNICODE_CATEGORIES.has(category)) {
    return "Chữ cái, số, dấu cách và ký tự . _ - (hỗ trợ tiếng Việt).";
  }
  return "Chỉ chữ Latin, số và ký tự . _ -";
}
