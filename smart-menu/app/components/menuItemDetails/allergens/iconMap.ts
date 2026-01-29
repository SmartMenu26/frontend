import type { LucideIcon } from "lucide-react";
import {
  Bean,
  Beef,
  Cake,
  CupSoda,
  Drumstick,
  Dumbbell,
  Egg,
  EggOff,
  Fish,
  FishOff,
  Flame,
  HeartPulse,
  Leaf,
  Milk,
  MilkOff,
  Nut,
  NutOff,
  Salad,
  Shell,
  Shrimp,
  Soup,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Vegan,
  Wheat,
  WheatOff,
} from "lucide-react";

export type AllergenIconEntry = {
  icon: LucideIcon;
  defaultTooltip?: string;
};

const ALLERGEN_ICON_MAP: Record<string, AllergenIconEntry> = {
  gluten: { icon: Wheat, defaultTooltip: "Содржи глутен" },
  "gluten-free": { icon: WheatOff, defaultTooltip: "Без глутен" },
  wheat: { icon: Wheat },
  dairy: { icon: Milk, defaultTooltip: "Содржи млечни производи" },
  "dairy-free": { icon: MilkOff, defaultTooltip: "Без млечни производи" },
  milk: { icon: Milk },
  lactose: { icon: Milk },
  "lactose-free": { icon: MilkOff },
  egg: { icon: Egg },
  eggs: { icon: Egg },
  "egg-free": { icon: EggOff, defaultTooltip: "Без јајца" },
  fish: { icon: Fish },
  "fish-free": { icon: FishOff, defaultTooltip: "Без риба" },
  seafood: { icon: Fish },
  shellfish: { icon: Shrimp },
  crustacean: { icon: Shrimp },
  shrimp: { icon: Shrimp },
  mollusc: { icon: Shell },
  soy: { icon: Bean },
  legume: { icon: Bean },
  beans: { icon: Bean },
  sesame: { icon: Sprout },
  seed: { icon: Sprout },
  peanut: { icon: Nut },
  peanuts: { icon: Nut },
  "peanut-free": { icon: NutOff, defaultTooltip: "Без кикирики" },
  nuts: { icon: Nut },
  "tree-nuts": { icon: Nut },
  nut: { icon: Nut },
  almond: { icon: Nut },
  hazelnut: { icon: Nut },
  pistachio: { icon: Nut },
  cashew: { icon: Nut },
  walnut: { icon: Nut },
  beef: { icon: Beef },
  pork: { icon: Drumstick },
  lamb: { icon: Drumstick },
  chicken: { icon: Drumstick },
  meat: { icon: Drumstick },
  vegan: { icon: Vegan },
  vegetarian: { icon: Leaf },
  plant: { icon: Sprout },
  herb: { icon: Leaf },
  salad: { icon: Salad },
  soup: { icon: Soup },
  broth: { icon: Soup },
  dessert: { icon: Cake },
  cake: { icon: Cake },
  sweet: { icon: Cake },
  drink: { icon: CupSoda },
  beverage: { icon: CupSoda },
  juice: { icon: CupSoda },
  spicy: { icon: Flame },
  hot: { icon: Flame },
  pepper: { icon: Flame },
  healthy: { icon: HeartPulse },
  protein: { icon: Dumbbell },
  "high-protein": { icon: Dumbbell },
  signature: { icon: Sparkles },
  special: { icon: Sparkles },
  premium: { icon: Star },
  star: { icon: Star },
  brunch: { icon: Sun },
  breakfast: { icon: Sun },
};

const buildCandidateKeys = (code?: string): string[] => {
  if (!code) return [];

  const normalized = code
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) return [];

  const seen = new Set<string>();
  const push = (value?: string) => {
    if (value && !seen.has(value)) seen.add(value);
  };

  push(normalized);

  const sanitized = normalized
    .replace(/^no-/, "")
    .replace(/^(?:contains|with|without|includes)-/, "")
    .replace(/-?(?:free|friendly)$/, "");

  push(sanitized);
  push(`${sanitized}-free`);

  normalized.split("-").forEach(push);
  sanitized.split("-").forEach(push);

  return Array.from(seen).filter(Boolean);
};

export const getAllergenIconEntry = (
  code?: string
): AllergenIconEntry | undefined => {
  const candidates = buildCandidateKeys(code);
  for (const candidate of candidates) {
    const entry = ALLERGEN_ICON_MAP[candidate];
    if (entry) return entry;
  }
  return undefined;
};

export const resolveTooltipLabel = (
  label?: string,
  entry?: AllergenIconEntry
): string => {
  if (label && label.trim() && label.trim().toLowerCase() !== "алерген") {
    return label.trim();
  }
  return entry?.defaultTooltip ?? label ?? "Алерген";
};
