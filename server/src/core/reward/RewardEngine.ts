import {
  CustomReward,
  HunterProfile,
  Quest,
} from '../../../../shared/types.js';

export interface RewardEvaluationContext {
  profile: HunterProfile;
  completedQuests: Quest[];
  currentStreakDays: number;
  weeklyCompletionRate: number;
}

export class RewardEngine {
  /**
   * Evaluates unlock conditions for all custom rewards deterministically against real DB data.
   */
  public static evaluateAllRewards(
    rewards: CustomReward[],
    context: RewardEvaluationContext
  ): { newlyUnlockedRewards: CustomReward[]; allEvaluatedRewards: CustomReward[] } {
    const newlyUnlockedRewards: CustomReward[] = [];
    const allEvaluatedRewards: CustomReward[] = [];

    for (const reward of rewards) {
      if (reward.isUnlocked) {
        allEvaluatedRewards.push(reward);
        continue;
      }

      const cond = reward.conditions;
      let eligible = true;

      if (cond.minLevel && context.profile.level < cond.minLevel) {
        eligible = false;
      }
      if (cond.minTotalXP && context.profile.totalXP < cond.minTotalXP) {
        eligible = false;
      }
      if (cond.minStreakDays && context.currentStreakDays < cond.minStreakDays) {
        eligible = false;
      }
      if (cond.minWeeklyCompletionRate && context.weeklyCompletionRate < cond.minWeeklyCompletionRate) {
        eligible = false;
      }
      if (cond.completedQuestsCount && context.completedQuests.length < cond.completedQuestsCount) {
        eligible = false;
      }
      if (cond.specificCategoryCount) {
        const catCount = context.completedQuests.filter(
          (q) => q.category === cond.specificCategoryCount!.category
        ).length;
        if (catCount < cond.specificCategoryCount.count) {
          eligible = false;
        }
      }

      if (eligible) {
        const unlocked: CustomReward = { ...reward, isUnlocked: true };
        newlyUnlockedRewards.push(unlocked);
        allEvaluatedRewards.push(unlocked);
      } else {
        allEvaluatedRewards.push(reward);
      }
    }

    return { newlyUnlockedRewards, allEvaluatedRewards };
  }

  /**
   * Manually claims an unlocked reward deterministically
   */
  public static claimReward(
    profile: HunterProfile,
    reward: CustomReward
  ): { updatedProfile: HunterProfile; claimedReward: CustomReward } {
    if (!reward.isUnlocked) {
      throw new Error(`Reward '${reward.title}' is still LOCKED.`);
    }
    if (reward.isClaimed) {
      throw new Error(`Reward '${reward.title}' has already been claimed.`);
    }
    if (reward.costGold > 0 && profile.gold < reward.costGold) {
      throw new Error(
        `Insufficient gold to claim '${reward.title}'. Required: ${reward.costGold}G, You have: ${profile.gold}G.`
      );
    }

    const updatedProfile: HunterProfile = {
      ...profile,
      gold: profile.gold - (reward.costGold || 0),
      updatedAt: new Date().toISOString(),
    };

    const claimedReward: CustomReward = {
      ...reward,
      isClaimed: true,
      claimedAt: new Date().toISOString(),
    };

    return { updatedProfile, claimedReward };
  }
}
