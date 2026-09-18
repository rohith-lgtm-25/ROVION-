import {
  AnalyticsSummary,
  HunterProfile,
  LevelUpEvent,
  Quest,
  QuestCategory,
} from '../../../../shared/types.js';

export class AnalyticsEngine {
  /**
   * Deterministically aggregates metrics from actual database records.
   */
  public static calculateSummary(
    profile: HunterProfile,
    quests: Quest[],
    levelUpHistory: LevelUpEvent[] = []
  ): AnalyticsSummary {
    const completedQuests = quests.filter((q) => q.status === 'COMPLETED');
    const failedQuests = quests.filter((q) => q.status === 'FAILED' || q.status === 'EXPIRED');

    const totalQuestsCompleted = completedQuests.length;
    const totalQuestsFailed = failedQuests.length;
    const mandatoryQuestsFailed = failedQuests.filter((q) => q.isMandatory).length;

    // Daily / Weekly / Monthly completion rates
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayDone = completedQuests.filter((q) => q.completedAt?.startsWith(todayStr)).length;
    const todayFailed = failedQuests.filter((q) => q.failedAt?.startsWith(todayStr)).length;
    const dailyCompletionRate =
      todayDone + todayFailed > 0 ? Math.round((todayDone / (todayDone + todayFailed)) * 100) : 100;

    const weekDone = completedQuests.filter((q) => q.completedAt && q.completedAt >= sevenDaysAgo).length;
    const weekFailed = failedQuests.filter((q) => q.failedAt && q.failedAt >= sevenDaysAgo).length;
    const weeklyCompletionRate =
      weekDone + weekFailed > 0 ? Math.round((weekDone / (weekDone + weekFailed)) * 100) : 100;

    const monthDone = completedQuests.filter((q) => q.completedAt && q.completedAt >= thirtyDaysAgo).length;
    const monthFailed = failedQuests.filter((q) => q.failedAt && q.failedAt >= thirtyDaysAgo).length;
    const monthlyCompletionRate =
      monthDone + monthFailed > 0 ? Math.round((monthDone / (monthDone + monthFailed)) * 100) : 100;

    // Breakdown by Category
    const questsByCategory: Record<QuestCategory, number> = {
      CODING: 0,
      STUDY: 0,
      FITNESS: 0,
      CAREER: 0,
      HEALTH: 0,
      DISCIPLINE: 0,
      CREATIVE: 0,
      LIFE: 0,
      CUSTOM: 0,
    };

    completedQuests.forEach((q) => {
      if (questsByCategory[q.category] !== undefined) {
        questsByCategory[q.category]++;
      }
    });

    // Calculate Streaks based on any quest completed per day
    const completedDates = completedQuests
      .filter((q) => q.completedAt)
      .map((q) => q.completedAt!.split('T')[0])
      .filter((date, idx, arr) => arr.indexOf(date) === idx)
      .sort();

    const { currentStreak, longestStreak } = this.calculateStreaks(completedDates);

    // XP History by day (past 7 days)
    const xpByDayMap: Record<string, number> = {};
    completedQuests.forEach((q) => {
      if (q.completedAt) {
        const day = q.completedAt.split('T')[0];
        xpByDayMap[day] = (xpByDayMap[day] || 0) + q.xpReward;
      }
    });

    const xpHistoryByDay: { date: string; xp: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      xpHistoryByDay.push({
        date: dateStr,
        xp: xpByDayMap[dateStr] || 0,
      });
    }

    return {
      level: profile.level,
      rank: profile.rank,
      totalXP: profile.totalXP,
      currentStreakDays: currentStreak,
      longestStreakDays: longestStreak,
      dailyCompletionRate,
      weeklyCompletionRate,
      monthlyCompletionRate,
      totalQuestsCompleted,
      totalQuestsFailed,
      mandatoryQuestsFailed,
      xpHistoryByDay,
      questsByCategory,
      attributesRadar: { ...profile.attributes },
      recentLevelUpHistory: levelUpHistory.slice(0, 10),
    };
  }

  private static calculateStreaks(sortedDates: string[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    let longestStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        currentRun++;
        if (currentRun > longestStreak) {
          longestStreak = currentRun;
        }
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastDate = sortedDates[sortedDates.length - 1];
    const isStreakActive = lastDate === todayStr || lastDate === yesterdayStr;

    return {
      currentStreak: isStreakActive ? currentRun : 0,
      longestStreak,
    };
  }
}
