export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "SG", name: "Singapura", flag: "🇸🇬" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "PH", name: "Filipina", flag: "🇵🇭" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "JP", name: "Jepang", flag: "🇯🇵" },
  { code: "KR", name: "Korea Selatan", flag: "🇰🇷" },
  { code: "CN", name: "Tiongkok", flag: "🇨🇳" },
  { code: "SA", name: "Arab Saudi", flag: "🇸🇦" },
  { code: "TR", name: "Turki", flag: "🇹🇷" },
  { code: "EG", name: "Mesir", flag: "🇪🇬" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "GB", name: "Inggris", flag: "🇬🇧" },
  { code: "US", name: "Amerika Serikat", flag: "🇺🇸" },
  { code: "NL", name: "Belanda", flag: "🇳🇱" },
  { code: "DE", name: "Jerman", flag: "🇩🇪" },
  { code: "FR", name: "Prancis", flag: "🇫🇷" },
];

export function flagOf(code: string | null | undefined): string {
  if (!code) return "🏳️";
  const found = COUNTRIES.find((c) => c.code === code.toUpperCase());
  if (found) return found.flag;
  const cc = code.toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
  return String.fromCodePoint(...[...cc].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

export function countryName(code: string | null | undefined): string {
  if (!code) return "-";
  return COUNTRIES.find((c) => c.code === code.toUpperCase())?.name ?? code;
}
