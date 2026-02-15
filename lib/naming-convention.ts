/**
 * Naming Convention Parser
 * Parses ad names according to a configured pattern and extracts tags
 */

export interface NamingConventionConfig {
  pattern: string; // e.g., "{concept}_{format}_{hook}_{offer}_{creator}_{version}"
  separator: string; // e.g., "_"
  segments: {
    concept: number; // Position in pattern (0-indexed)
    format: number;
    hook: number;
    offer: number;
    creator: number;
    language?: number;
    version?: number;
  };
}

export interface ParsedTags {
  tagConcept?: string;
  tagFormat?: string;
  tagHook?: string;
  tagOffer?: string;
  tagCreator?: string;
  tagLanguage?: string;
}

/**
 * Parse an ad name according to the naming convention
 */
export function parseAdName(
  adName: string,
  config: NamingConventionConfig
): ParsedTags {
  if (!config || !config.pattern || !config.separator) {
    return {};
  }

  // Split the ad name by the separator
  const parts = adName.split(config.separator);

  const tags: ParsedTags = {};

  // Extract each segment based on position
  if (config.segments.concept !== undefined && parts[config.segments.concept]) {
    tags.tagConcept = parts[config.segments.concept].trim();
  }
  if (config.segments.format !== undefined && parts[config.segments.format]) {
    tags.tagFormat = parts[config.segments.format].trim();
  }
  if (config.segments.hook !== undefined && parts[config.segments.hook]) {
    tags.tagHook = parts[config.segments.hook].trim();
  }
  if (config.segments.offer !== undefined && parts[config.segments.offer]) {
    tags.tagOffer = parts[config.segments.offer].trim();
  }
  if (config.segments.creator !== undefined && parts[config.segments.creator]) {
    tags.tagCreator = parts[config.segments.creator].trim();
  }
  if (config.segments.language !== undefined && parts[config.segments.language]) {
    tags.tagLanguage = parts[config.segments.language].trim();
  }

  return tags;
}

/**
 * Get naming convention from user settings
 */
export async function getNamingConvention(db: any): Promise<NamingConventionConfig | null> {
  try {
    const { userSettings } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const setting = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.key, "naming_convention"))
      .limit(1);

    if (setting.length === 0) {
      return null;
    }

    return JSON.parse(setting[0].value);
  } catch {
    return null;
  }
}

/**
 * Save naming convention to user settings
 */
export async function saveNamingConvention(db: any, config: NamingConventionConfig): Promise<void> {
  const { userSettings } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.key, "naming_convention"))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userSettings).values({
      key: "naming_convention",
      value: JSON.stringify(config),
    });
  } else {
    await db
      .update(userSettings)
      .set({
        value: JSON.stringify(config),
        updatedAt: new Date(),
      })
      .where(eq(userSettings.key, "naming_convention"));
  }
}

/**
 * Example naming conventions (presets)
 */
export const NAMING_PRESETS: Record<string, NamingConventionConfig> = {
  default: {
    pattern: "{concept}_{format}_{hook}_{offer}_{creator}_{version}",
    separator: "_",
    segments: {
      concept: 0,
      format: 1,
      hook: 2,
      offer: 3,
      creator: 4,
      version: 5,
    },
  },
  simple: {
    pattern: "{concept}_{hook}_{version}",
    separator: "_",
    segments: {
      concept: 0,
      hook: 1,
      version: 2,
      format: -1,
      offer: -1,
      creator: -1,
    },
  },
  detailed: {
    pattern: "{concept}_{format}_{hook}_{offer}_{creator}_{language}_{version}",
    separator: "_",
    segments: {
      concept: 0,
      format: 1,
      hook: 2,
      offer: 3,
      creator: 4,
      language: 5,
      version: 6,
    },
  },
};
