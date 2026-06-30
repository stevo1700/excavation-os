// Asset tag format: a 2-letter type prefix + a 3-digit (or longer) number,
// e.g. "EX-310". Each type/category owns a block of numbers so tags stay easy
// to scan and group by eye in the yard.
//
// nextAssetTag() is only called from app code (never from prisma/seed.ts,
// which assigns its own literal tags), so it's safe to import the Next.js
// prisma singleton directly here.

import { prisma } from "@/lib/prisma";

interface PrefixRule {
  prefix: string;
  /** Numbering for this prefix starts at base + 1. */
  base: number;
}

const CATEGORY_PREFIXES: Record<string, PrefixRule> = {
  excavator: { prefix: "EX", base: 300 },
  bulldozer: { prefix: "DZ", base: 100 },
  loader: { prefix: "LD", base: 200 },
  dump_truck: { prefix: "TR", base: 400 },
};

// Everything else (backhoe, skid_steer, grader, compactor, …) shares the
// generic equipment prefix.
const OTHER_PREFIX: PrefixRule = { prefix: "EQ", base: 500 };

/** The tag prefix + numbering base for an equipment type/category. */
export function prefixForType(type: string): PrefixRule {
  return CATEGORY_PREFIXES[type.toLowerCase()] ?? OTHER_PREFIX;
}

const ASSET_TAG_PATTERN = /^[A-Z]{2}-\d{3,}$/;

/** True if `value` matches the 2-letter-prefix + 3+-digit-number tag format. */
export function isValidAssetTagFormat(value: string): boolean {
  return ASSET_TAG_PATTERN.test(value);
}

/**
 * The next sequential asset tag for `type`, e.g. "EX-304". Counts existing
 * tags sharing the type's prefix, so generated tags stay unique and continue
 * from wherever seeded or manually-assigned tags left off.
 */
export async function nextAssetTag(type: string): Promise<string> {
  const { prefix, base } = prefixForType(type);
  const count = await prisma.equipment.count({
    where: { assetTag: { startsWith: `${prefix}-` } },
  });
  return `${prefix}-${String(base + count + 1).padStart(3, "0")}`;
}
