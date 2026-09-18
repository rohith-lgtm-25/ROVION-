import {
  NotificationCategory,
  SystemNotification,
  SystemSettings,
} from '../../../../shared/types.js';

export class NotificationEngine {
  /**
   * Checks if current time falls within user-configured quiet hours.
   */
  public static isQuietHour(settings?: SystemSettings): boolean {
    if (!settings?.quietHours?.enabled) return false;
    const currentHour = new Date().getHours();
    const { startHour, endHour } = settings.quietHours;

    if (startHour > endHour) {
      // Overnight (e.g. 22 to 7)
      return currentHour >= startHour || currentHour < endHour;
    } else {
      return currentHour >= startHour && currentHour < endHour;
    }
  }

  public static createNotification(
    category: NotificationCategory,
    title: string,
    message: string,
    actionUrl?: string
  ): SystemNotification {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category,
      title: `[SYSTEM] ${title}`,
      message,
      read: false,
      actionUrl,
      createdAt: new Date().toISOString(),
    };
  }

  public static onQuestAssigned(questTitle: string, rank: string): SystemNotification {
    return this.createNotification(
      'QUEST',
      'NEW QUEST ASSIGNED',
      `Quest '${questTitle}' (Rank ${rank}) has been inscribed into your System Log.`
    );
  }

  public static onQuestCompleted(
    questTitle: string,
    xpGained: number,
    goldGained: number
  ): SystemNotification {
    return this.createNotification(
      'QUEST',
      'QUEST COMPLETED',
      `Objective '${questTitle}' conquered. Earned +${xpGained} XP and +${goldGained} Gold.`
    );
  }

  public static onLevelUp(newLevel: number, newRank?: string): SystemNotification {
    const rankMsg = newRank ? ` Hunter Rank ascended to [${newRank}-Rank]!` : '';
    return this.createNotification(
      'LEVEL_UP',
      'LEVEL UP!',
      `Ascended to Level ${newLevel}.${rankMsg} Stat Points have been granted.`
    );
  }

  public static onPenaltyInflicted(reason: string): SystemNotification {
    return this.createNotification(
      'PENALTY',
      'PENALTY ZONE INFLICTED',
      `ALERT: ${reason} Safe recovery discipline protocol initiated.`
    );
  }

  public static onRewardUnlocked(rewardTitle: string): SystemNotification {
    return this.createNotification(
      'REWARD',
      'REWARD UNLOCKED',
      `Conditions fulfilled for [${rewardTitle}]. You can now claim your reward.`
    );
  }

  public static onWeeklyEvaluation(grade: string, rewardEligible: boolean): SystemNotification {
    return this.createNotification(
      'WEEKLY_EVALUATION',
      'WEEKLY REPORT CARD READY',
      `Weekly evaluation completed with Grade [${grade}]. ${
        rewardEligible
          ? '★ Congratulations! You earned your Weekly Reward.'
          : 'Refocus for next week.'
      }`
    );
  }

  public static onDeadlineReminder(questTitle: string, minutesRemaining: number): SystemNotification {
    return this.createNotification(
      'REMINDER',
      'DEADLINE IMMINENT',
      `Quest '${questTitle}' deadline expires in approximately ${minutesRemaining} minutes.`
    );
  }
}
