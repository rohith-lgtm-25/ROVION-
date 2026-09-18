import {
  ActiveDebuff,
  HunterProfile,
  PenaltyRecord,
  Quest,
  SafePunishmentType,
  SystemSettings,
} from '../../../../shared/types.js';
import { QuestEngine } from '../quest/QuestEngine.js';

export interface InflictSafePenaltyResult {
  penaltyRecord: PenaltyRecord;
  debuff?: ActiveDebuff;
  recoveryQuest?: Quest;
  updatedProfile: HunterProfile;
}

export class PunishmentEngine {
  /**
   * Safe Punishment Invariants:
   * - ZERO starvation or dehydration
   * - ZERO sleep deprivation
   * - ZERO dangerous exercise or self-harm
   * - ZERO financial harm
   * Only uses benign productivity accountability (minor XP deduction, entertainment lockout debuff, recovery reflection task).
   */
  public static inflictSafePenalty(
    profile: HunterProfile,
    failedQuest: Quest,
    settings?: SystemSettings
  ): InflictSafePenaltyResult {
    const reason = `Mandatory quest '${failedQuest.title}' failed or deadline missed.`;
    const now = new Date();
    const penaltyId = `pen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    const pool = settings?.safePunishmentPool || {
      allowXPDeduction: true,
      allowEntertainmentLockout: true,
      allowRewardClaimDelay: true,
      allowRecoveryTask: true,
    };

    // Determine punishment type from safe pool
    let punishmentType: SafePunishmentType = 'ENTERTAINMENT_LOCKOUT';
    if (pool.allowRecoveryTask) {
      punishmentType = 'RECOVERY_TASK';
    } else if (pool.allowXPDeduction) {
      punishmentType = 'XP_PENALTY';
    }

    let debuff: ActiveDebuff | undefined;
    let recoveryQuest: Quest | undefined;
    let updatedProfile = { ...profile };

    if (punishmentType === 'XP_PENALTY' && pool.allowXPDeduction) {
      const xpLoss = Math.min(profile.currentXP, 75);
      updatedProfile.currentXP = Math.max(0, profile.currentXP - xpLoss);
      updatedProfile.totalXP = Math.max(0, profile.totalXP - xpLoss);
      updatedProfile.updatedAt = now.toISOString();

      debuff = {
        id: `deb_${Date.now()}`,
        name: 'Discipline Audit: Minor XP Penalty',
        description: `Deducted ${xpLoss} XP for mandatory task non-completion.`,
        type: 'XP_PENALTY',
        xpDeducted: xpLoss,
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      };
    } else if (punishmentType === 'RECOVERY_TASK' && pool.allowRecoveryTask) {
      // Create a healthy, safe recovery task
      recoveryQuest = QuestEngine.createQuest({
        title: '[RECOVERY PROTOCOL] Reset Focus & Clear Sloth',
        description: 'A mandatory task was missed. Complete this brief recovery reset to restore System standing.',
        category: 'DISCIPLINE',
        priority: 'HIGH',
        difficulty: 'E',
        xpReward: 30,
        goldReward: 10,
        isMandatory: false,
        subtasks: [
          '5-minute mindful breathing / posture reset',
          'Tidy desk / physical workspace',
          'Write a 2-sentence note on how to avoid the blocker next time',
        ],
      });

      debuff = {
        id: `deb_${Date.now()}`,
        name: 'Entertainment Lockout Protocol',
        description: 'Entertainment reward claims paused until Recovery Protocol is cleared.',
        type: 'RECOVERY_TASK',
        expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      };
    } else {
      // Entertainment lockout
      debuff = {
        id: `deb_${Date.now()}`,
        name: 'Focus Lockout: 2-Hour Entertainment Delay',
        description: 'System restricts gaming/leisure rewards for 2 hours to rebuild momentum.',
        type: 'ENTERTAINMENT_LOCKOUT',
        expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      };
    }

    if (debuff) {
      updatedProfile.activeDebuffs = [...updatedProfile.activeDebuffs, debuff];
    }

    const penaltyRecord: PenaltyRecord = {
      id: penaltyId,
      questId: failedQuest.id,
      questTitle: failedQuest.title,
      reason,
      punishmentType,
      debuffApplied: debuff,
      recoveryQuestId: recoveryQuest?.id,
      cleared: false,
      createdAt: now.toISOString(),
    };

    return {
      penaltyRecord,
      debuff,
      recoveryQuest,
      updatedProfile,
    };
  }

  /**
   * Clears a penalty record and associated debuffs deterministically.
   */
  public static clearPenalty(
    profile: HunterProfile,
    penaltyRecord: PenaltyRecord
  ): { updatedProfile: HunterProfile; clearedPenalty: PenaltyRecord } {
    const now = new Date().toISOString();
    const debuffIdToRemove = penaltyRecord.debuffApplied?.id;
    const updatedDebuffs = profile.activeDebuffs.filter((d) => d.id !== debuffIdToRemove);

    const updatedProfile: HunterProfile = {
      ...profile,
      activeDebuffs: updatedDebuffs,
      updatedAt: now,
    };

    const clearedPenalty: PenaltyRecord = {
      ...penaltyRecord,
      cleared: true,
      clearedAt: now,
    };

    return {
      updatedProfile,
      clearedPenalty,
    };
  }
}
