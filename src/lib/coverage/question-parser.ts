import type { TariffRegion } from "@/lib/catalog-enums";
import type { GrupoAsegurado, TariffGender } from "@/lib/catalog-enums";

export type QuestionIntent =
  | "price_quote"
  | "compare_ages"
  | "maternidad"
  | "deductible"
  | "annual_limit"
  | "policy_coverage"
  | "exclusion"
  | "waiting_period"
  | "catalog_overview"
  | "unknown";

export interface ParsedQuestion {
  intent: QuestionIntent;
  age?: number;
  compareAges?: [number, number];
  gender?: TariffGender;
  region?: TariffRegion;
  grupoAsegurado?: GrupoAsegurado;
  maternidad?: "Si" | "No";
  deductible?: number;
  annualLimit?: number;
  policyTopic?: string;
}

const REGION_ALIASES: Record<string, TariffRegion> = {
  nacional: "Nacional",
  austro: "Austro",
  costa: "Costa",
  sierra: "Sierra",
};

const GENDER_ALIASES: Record<string, TariffGender> = {
  hombre: "masculino",
  varon: "masculino",
  varón: "masculino",
  masculino: "masculino",
  mujer: "femenino",
  femenino: "femenino",
};

function extractAge(text: string): number | undefined {
  const match = text.match(/\b(\d{1,2})\s*(?:a[nñ]os?|a\.?\s*o\.?)?\b/);
  if (!match) return undefined;
  const age = Number.parseInt(match[1], 10);
  if (age < 0 || age > 120) return undefined;
  return age;
}

function extractCompareAges(text: string): [number, number] | undefined {
  const vsMatch = text.match(
    /\b(\d{1,2})\s*(?:a[nñ]os?)?\s*(?:vs|versus|contra|y)\s*(\d{1,2})\s*(?:a[nñ]os?)?\b/i,
  );
  if (vsMatch) {
    return [Number.parseInt(vsMatch[1], 10), Number.parseInt(vsMatch[2], 10)];
  }

  const compareMatch = text.match(
    /compar(?:ar|a|e)\s+(?:edad(?:es)?\s+)?(\d{1,2})\s*(?:y|e|\/|,)\s*(\d{1,2})/i,
  );
  if (compareMatch) {
    return [Number.parseInt(compareMatch[1], 10), Number.parseInt(compareMatch[2], 10)];
  }

  return undefined;
}

function extractGender(text: string): TariffGender | undefined {
  for (const [alias, gender] of Object.entries(GENDER_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`, "i").test(text)) {
      return gender;
    }
  }
  return undefined;
}

function extractRegion(text: string): TariffRegion | undefined {
  for (const [alias, region] of Object.entries(REGION_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`, "i").test(text)) {
      return region;
    }
  }
  return undefined;
}

function extractGrupoAsegurado(text: string): GrupoAsegurado | undefined {
  if (/\b(titular|asegurado principal)\b/i.test(text)) return "titular";
  if (/\b(ni[nñ]o\s+solo|dependiente\s+solo)\b/i.test(text)) return "nino_solo";
  return undefined;
}

function extractDeductible(text: string): number | undefined {
  const match = text.match(
    /deducible\s*(?:de\s*)?\$?\s*([\d.,]+)/i,
  );
  if (!match) return undefined;
  return parseMoneyAmount(match[1]);
}

function extractAnnualLimit(text: string): number | undefined {
  const match = text.match(
    /(?:tope|l[ií]mite)\s*(?:anual\s*)?\$?\s*([\d.,]+)/i,
  );
  if (!match) return undefined;
  return parseMoneyAmount(match[1]);
}

function parseMoneyAmount(raw: string): number | undefined {
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : undefined;
}

function detectIntent(text: string): QuestionIntent {
  if (extractCompareAges(text)) return "compare_ages";
  if (/maternidad|embarazo|parto/i.test(text)) return "maternidad";
  if (/deducible/i.test(text)) return "deductible";
  if (/(?:tope|l[ií]mite)\s*anual/i.test(text)) return "annual_limit";
  if (
    /precio|prima|mensual|cu[aá]nto\s+cuesta|cotiz/i.test(text) ||
    (extractAge(text) && extractGender(text) && extractRegion(text))
  ) {
    return "price_quote";
  }
  if (
    /qu[eé]\s+(regiones|tarifas|incluye|hay)|resumen\s+del\s+plan|qu[eé]\s+cubre\s+este\s+plan/i.test(
      text,
    )
  ) {
    return "catalog_overview";
  }
  if (/exclu/i.test(text) || /preexist/i.test(text)) return "exclusion";
  if (/carencia|espera/i.test(text)) return "waiting_period";
  if (
    /cubr/i.test(text) ||
    /hospitaliz/i.test(text) ||
    /urgenc/i.test(text) ||
    /internaci/i.test(text) ||
    /cosm[eé]tic/i.test(text) ||
    /cirug[ií]a/i.test(text)
  ) {
    return "policy_coverage";
  }
  return "unknown";
}

export function parseCoverageQuestion(question: string): ParsedQuestion {
  const text = question.toLowerCase().trim();
  const intent = detectIntent(text);

  const parsed: ParsedQuestion = {
    intent,
    age: extractAge(text),
    compareAges: extractCompareAges(text),
    gender: extractGender(text),
    region: extractRegion(text),
    grupoAsegurado: extractGrupoAsegurado(text),
    deductible: extractDeductible(text),
    annualLimit: extractAnnualLimit(text),
  };

  if (/maternidad\s*(?:s[ií]|inclu)/i.test(text)) {
    parsed.maternidad = "Si";
  } else if (/maternidad\s*no|sin\s+maternidad/i.test(text)) {
    parsed.maternidad = "No";
  }

  if (intent === "policy_coverage") {
    if (/hospitaliz|internaci/i.test(text)) parsed.policyTopic = "hospitalizacion";
    else if (/urgenc|emergenc/i.test(text)) parsed.policyTopic = "urgencias";
    else if (/maternidad|embarazo|parto/i.test(text)) parsed.policyTopic = "maternidad";
    else if (/cosm[eé]tic|est[eé]tic/i.test(text)) parsed.policyTopic = "cosmetico";
    else if (/preexist/i.test(text)) parsed.policyTopic = "preexistencia";
    else if (/cirug[ií]a/i.test(text)) parsed.policyTopic = "cirugia";
  }

  return parsed;
}
