import {
  AttributeType,
  HunterAttributes,
  HunterProfile,
  LevelFormulaSettings,
  LevelUpEvent,
  RankTier,
} from '../../../../shared/types.js';

export interface LevelUpResult {
  updatedProfile: HunterProfile;
  levelsGained: number;
  didLevelUp: boolean;
  previousLevel: number;
  newLevel: number;
  newRank?: RankTier;
  statPointsAwarded: number;
  levelUpEvents: LevelUpEvent[];
}

export class LevelEngine {
  public static readonly DEFAULT_FORMULA: LevelFormulaSettings = {
    formulaType: 'POLYNOMIAL',
    baseXP: 100,
    exponent: 1.5,
    linearMultiplier: 50,
    statPointsPerLevel: 3,
  };

  /**
   * Deterministic XP Requirement Formula based on active System Settings
   */
  public static calculateRequiredXP(
    level: number,
    settings: LevelFormulaSettings = LevelEngine.DEFAULT_FORMULA
  ): number {
    if (level < 1) level = 1;

    switch (settings.formulaType) {
      case 'LINEAR':
        // e.g. 100 * level + 50
        return Math.floor(settings.baseXP * level + settings.linearMultiplier);
      case 'EXPONENTIAL':
        // e.g. 100 * 1.2^(level-1)
        return Math.floor(settings.baseXP * Math.pow(settings.exponent, level - 1));
      case 'POLYNOMIAL':
      default:
        // e.g. 100 * level^1.5 + 50 * level
        return Math.floor(
          settings.baseXP * Math.pow(level, settings.exponent) + settings.linearMultiplier * level
        );
    }
  }

  /**
   * Deterministic Rank Classification based on Hunter Level
   */
  public static calculateRank(level: number): RankTier {
    if (level >= 150) return 'MONARCH';
    if (level >= 100) return 'S';
    if (level >= 75) return 'A';
    if (level >= 50) return 'B';
    if (level >= 25) return 'C';
    if (level >= 10) return 'D';
    return 'E';
  }

  /**
   * Pure deterministic XP addition and level-up computation.
   * Handles multi-level-ups and leftover XP smoothly.
   */
  public static addXP(
    profile: HunterProfile,
    gainedXP: number,
    settings: LevelFormulaSettings = LevelEngine.DEFAULT_FORMULA
  ): LevelUpResult {
    if (gainedXP < 0) {
      throw new Error('Gained XP cannot be negative.');
    }

    const previousLevel = profile.level;
    const previousRank = profile.rank;
    let currentLevel = profile.level;
    let currentXP = profile.currentXP + gainedXP;
    let totalXP = profile.totalXP + gainedXP;
    let statPoints = profile.statPoints;
    let levelsGained = 0;
    const levelUpEvents: LevelUpEvent[] = [];

    while (true) {
      const required = LevelEngine.calculateRequiredXP(currentLevel, settings);
      if (currentXP >= required) {
        currentXP -= required;
        const oldLvl = currentLevel;
        currentLevel += 1;
        levelsGained += 1;
        const apAwarded = settings.statPointsPerLevel || 3;
        statPoints += apAwarded;

        const intermediateRank = LevelEngine.calculateRank(currentLevel);
        levelUpEvents.push({
          id: `lvl_${Date.now()}_${currentLevel}`,
          previousLevel: oldLvl,
          newLevel: currentLevel,
          newRank: intermediateRank,
          statPointsAwarded: apAwarded,
          reachedAt: new Date().toISOString(),
        });
      } else {
        break;
      }
    }

    const newRank = LevelEngine.calculateRank(currentLevel);
    const didLevelUp = levelsGained > 0;
    const rankChanged = newRank !== previousRank;

    const updatedProfile: HunterProfile = {
      ...profile,
      level: currentLevel,
      currentXP,
      requiredXP: LevelEngine.calculateRequiredXP(currentLevel, settings),
      totalXP,
      rank: newRank,
      statPoints,
      title: rankChanged ? `${newRank}-Rank Hunter` : profile.title,
      updatedAt: new Date().toISOString(),
    };

    return {
      updatedProfile,
      levelsGained,
      didLevelUp,
      previousLevel,
      newLevel: currentLevel,
      newRank: rankChanged ? newRank : undefined,
      statPointsAwarded: levelsGained * (settings.statPointsPerLevel || 3),
      levelUpEvents,
    };
  }

  /**
   * Pure deterministic attribute point allocation (supports all 7 core attributes).
   */
  public static allocateStatPoint(
    profile: HunterProfile,
    attribute: AttributeType,
    points: number = 1
  ): HunterProfile {
    if (points <= 0) {
      throw new Error('Points to allocate must be greater than 0.');
    }
    if (profile.statPoints < points) {
      throw new Error(
        `Insufficient stat points. Available: ${profile.statPoints}, Requested: ${points}`
      );
    }

    const updatedAttributes: HunterAttributes = { ...profile.attributes };
    if (updatedAttributes[attribute] === undefined) {
      updatedAttributes[attribute] = 10;
    }
    updatedAttributes[attribute] += points;

    return {
      ...profile,
      statPoints: profile.statPoints - points,
      attributes: updatedAttributes,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Apply attribute point gains from completed quests directly.
   */
  public static applyAttributeGains(
    profile: HunterProfile,
    gains: Partial<HunterAttributes>
  ): HunterProfile {
    const updatedAttributes = { ...profile.attributes };
    for (const [attr, val] of Object.entries(gains)) {
      const key = attr as AttributeType;
      if (typeof val === 'number' && val > 0) {
        updatedAttributes[key] = (updatedAttributes[key] || 10) + val;
      }
    }

    return {
      ...profile,
      attributes: updatedAttributes,
      updatedAt: new Date().toISOString(),
    };
  }
}
