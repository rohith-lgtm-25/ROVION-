import {
  HunterProfile,
  Quest,
  WeeklyEvaluation,
  WeeklyGrade,
} from '../../../../shared/types.js';

export class WeeklyEngine {
  /**
   * Deterministically evaluates a hunter's week based on actual completed and failed quests.
   */
  public static evaluateWeek(
    profile: HunterProfile,
    quests: Quest[],
    currentStreakDays: number,
    weekStartDate?: string,
    weekEndDate?: string,
    customWeeklyRewardTitle: string = 'Weekend Monarch Celebration'
  ): { evaluation: WeeklyEvaluation; bonusXP: number } {
    const now = new Date();
    
    // Calculate week dates if not provided
    const end = weekEndDate ? new Date(weekEndDate) : now;
    const start = weekStartDate
      ? new Date(weekStartDate)
      : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const startISO = start.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];

    // Filter quests within the weekly window
    const weeklyCompleted = quests.filter((q) => {
      if (q.status !== 'COMPLETED' || !q.completedAt) return false;
      const d = q.completedAt.split('T')[0];
      return d >= startISO && d <= endISO;
    });

    const weeklyFailed = quests.filter((q) => {
      if ((q.status !== 'FAILED' && q.status !== 'EXPIRED') || !q.failedAt) return false;
      const d = q.failedAt.split('T')[0];
      return d >= startISO && d <= endISO;
    });

    const mandatoryFailed = weeklyFailed.filter((q) => q.isMandatory).length;
    const totalFinished = weeklyCompleted.length + weeklyFailed.length;
    
    const completionRate =
      totalFinished > 0 ? Math.round((weeklyCompleted.length / totalFinished) * 100) : 100;

    // Grade Determination
    let grade: WeeklyGrade = 'C';
    let bonusXP = 150;
    let eligible = false;

    if (completionRate >= 90 && mandatoryFailed === 0 && currentStreakDays >= 5) {
      grade = 'S';
      bonusXP = 1000;
      eligible = true;
    } else if (completionRate >= 80 && mandatoryFailed <= 1) {
      grade = 'A';
      bonusXP = 500;
      eligible = true;
    } else if (completionRate >= 65 && mandatoryFailed <= 2) {
      grade = 'B';
      bonusXP = 250;
      eligible = false;
    } else if (completionRate >= 50) {
      grade = 'C';
      bonusXP = 100;
      eligible = false;
    } else if (completionRate >= 30) {
      grade = 'D';
      bonusXP = 50;
      eligible = false;
    } else {
      grade = 'F';
      bonusXP = 0;
      eligible = false;
    }

    const evalId = `weval_${startISO}_${endISO}`;

    const evaluation: WeeklyEvaluation = {
      id: evalId,
      weekStartDate: startISO,
      weekEndDate: endISO,
      totalXPBonusEarned: bonusXP,
      questsCompletedCount: weeklyCompleted.length,
      questsFailedCount: weeklyFailed.length,
      mandatoryFailedCount: mandatoryFailed,
      completionRate,
      streakMaintainedDays: currentStreakDays,
      grade,
      weeklyRewardEligible: eligible,
      weeklyRewardClaimed: false,
      weeklyRewardTitle: customWeeklyRewardTitle,
      createdAt: now.toISOString(),
    };

    return { evaluation, bonusXP };
  }
}
