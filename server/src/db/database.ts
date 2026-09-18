import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import {
  HunterProfile,
  Quest,
  CustomReward,
  ActiveDebuff,
  PenaltyRecord,
  SystemNotification,
  WeeklyEvaluation,
  LevelUpEvent,
  SystemSettings,
  RankTier,
  QuestCategory,
  QuestPriority,
  QuestStatus,
  QuestRecurrence,
  SafePunishmentType,
  NotificationCategory,
} from '../../../shared/types.js';

export class DatabaseService {
  private db: DatabaseSync;

  constructor(dbFilePath?: string) {
    const defaultPath = path.resolve(process.cwd(), 'system_data.sqlite');
    const targetPath = dbFilePath || defaultPath;
    
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseSync(targetPath);
    this.initializeSchema();
    this.ensureDefaultHunterProfile();
    this.ensureDefaultSettings();
    this.ensureDefaultRewards();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hunter_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        avatar_url TEXT,
        title TEXT NOT NULL,
        level INTEGER NOT NULL,
        current_xp INTEGER NOT NULL,
        total_xp INTEGER NOT NULL,
        rank TEXT NOT NULL,
        gold INTEGER NOT NULL,
        stat_points INTEGER NOT NULL,
        discipline INTEGER NOT NULL DEFAULT 10,
        intelligence INTEGER NOT NULL DEFAULT 10,
        focus INTEGER NOT NULL DEFAULT 10,
        strength INTEGER NOT NULL DEFAULT 10,
        consistency INTEGER NOT NULL DEFAULT 10,
        productivity INTEGER NOT NULL DEFAULT 10,
        energy INTEGER NOT NULL DEFAULT 10,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        xp_reward INTEGER NOT NULL,
        gold_reward INTEGER NOT NULL,
        deadline TEXT,
        is_mandatory INTEGER NOT NULL DEFAULT 0,
        recurrence TEXT NOT NULL DEFAULT 'ONE_TIME',
        attribute_rewards_json TEXT NOT NULL,
        status TEXT NOT NULL,
        subtasks_json TEXT NOT NULL,
        recurrence_parent_id TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        failed_at TEXT,
        cancelled_at TEXT
      );

      CREATE TABLE IF NOT EXISTS rewards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        icon TEXT NOT NULL,
        cost_gold INTEGER NOT NULL DEFAULT 0,
        conditions_json TEXT NOT NULL,
        is_unlocked INTEGER NOT NULL DEFAULT 0,
        is_claimed INTEGER NOT NULL DEFAULT 0,
        claimed_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS weekly_evaluations (
        id TEXT PRIMARY KEY,
        week_start_date TEXT NOT NULL,
        week_end_date TEXT NOT NULL,
        total_xp_bonus INTEGER NOT NULL,
        quests_completed_count INTEGER NOT NULL,
        quests_failed_count INTEGER NOT NULL,
        mandatory_failed_count INTEGER NOT NULL,
        completion_rate REAL NOT NULL,
        streak_days INTEGER NOT NULL,
        grade TEXT NOT NULL,
        weekly_reward_eligible INTEGER NOT NULL DEFAULT 0,
        weekly_reward_claimed INTEGER NOT NULL DEFAULT 0,
        weekly_reward_title TEXT NOT NULL,
        ai_feedback TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS debuffs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        stat_penalties_json TEXT,
        xp_deducted INTEGER DEFAULT 0,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS punishments (
        id TEXT PRIMARY KEY,
        quest_id TEXT,
        quest_title TEXT NOT NULL,
        reason TEXT NOT NULL,
        punishment_type TEXT NOT NULL,
        debuff_id TEXT,
        recovery_quest_id TEXT,
        cleared INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        cleared_at TEXT
      );

      CREATE TABLE IF NOT EXISTS level_up_events (
        id TEXT PRIMARY KEY,
        previous_level INTEGER NOT NULL,
        new_level INTEGER NOT NULL,
        new_rank TEXT NOT NULL,
        stat_points_awarded INTEGER NOT NULL,
        reached_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        action_url TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS analytics_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  private ensureDefaultHunterProfile(): void {
    const stmt = this.db.prepare('SELECT * FROM hunter_profile WHERE id = ?');
    const existing = stmt.get('default_hunter');
    if (!existing) {
      const now = new Date().toISOString();
      const insert = this.db.prepare(`
        INSERT INTO hunter_profile (
          id, name, email, avatar_url, title, level, current_xp, total_xp, rank, gold, stat_points,
          discipline, intelligence, focus, strength, consistency, productivity, energy, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);
      insert.run(
        'default_hunter',
        'Player (Hunter Jin-Woo)',
        'hunter@system.awakening',
        'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        'E-Rank Hunter',
        1,
        0,
        0,
        'E',
        50,
        0,
        10, 10, 10, 10, 10, 10, 10,
        now,
        now
      );
    }
  }

  private ensureDefaultSettings(): void {
    const existing = this.getSystemSettings();
    if (!existing) {
      const defaultSettings: SystemSettings = {
        levelFormula: {
          formulaType: 'POLYNOMIAL',
          baseXP: 100,
          exponent: 1.5,
          linearMultiplier: 50,
          statPointsPerLevel: 3,
        },
        quietHours: {
          enabled: false,
          startHour: 22,
          endHour: 7,
        },
        audioFeedbackEnabled: true,
        browserNotificationsEnabled: true,
        safePunishmentPool: {
          allowXPDeduction: true,
          allowEntertainmentLockout: true,
          allowRewardClaimDelay: true,
          allowRecoveryTask: true,
        },
      };
      this.saveSystemSettings(defaultSettings);
    }
  }

  private ensureDefaultRewards(): void {
    const rewards = this.getAllRewards();
    if (rewards.length === 0) {
      const defaultRewards: CustomReward[] = [
        {
          id: 'rew_anime_ep',
          title: '1 Episode of Anime / Series',
          description: 'Unlock 30 minutes of guilty-free anime or high-tier series entertainment.',
          category: 'ENTERTAINMENT',
          icon: '📺',
          costGold: 30,
          conditions: { completedQuestsCount: 2 },
          isUnlocked: false,
          isClaimed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rew_gaming_session',
          title: '1 Hour of Immersive Gaming',
          description: 'Launch your favorite PC / console game with zero productivity guilt.',
          category: 'GAMING',
          icon: '🎮',
          costGold: 60,
          conditions: { minLevel: 2, minStreakDays: 2 },
          isUnlocked: false,
          isClaimed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rew_favorite_treat',
          title: 'Special Coffee / Culinary Treat',
          description: 'Indulge in a premium artisanal coffee, boba, or celebratory snack.',
          category: 'FOOD',
          icon: '☕',
          costGold: 100,
          conditions: { minTotalXP: 500 },
          isUnlocked: false,
          isClaimed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rew_weekend_movie',
          title: 'Weekend Movie Night / IMAX',
          description: 'Full theatrical or home cinema experience for conquering the weekly grind.',
          category: 'LEISURE',
          icon: '🎬',
          costGold: 200,
          conditions: { minWeeklyCompletionRate: 80, minStreakDays: 5 },
          isUnlocked: false,
          isClaimed: false,
          createdAt: new Date().toISOString(),
        },
      ];

      for (const r of defaultRewards) {
        this.saveReward(r);
      }
    }
  }

  // ---------------- Hunter Profile ----------------
  public getHunterProfile(id: string = 'default_hunter'): HunterProfile {
    const stmt = this.db.prepare('SELECT * FROM hunter_profile WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) {
      this.ensureDefaultHunterProfile();
      return this.getHunterProfile(id);
    }

    const debuffs = this.getActiveDebuffs();

    return {
      id: row.id,
      name: row.name,
      email: row.email || undefined,
      avatarUrl: row.avatar_url || undefined,
      title: row.title,
      level: Number(row.level),
      currentXP: Number(row.current_xp),
      requiredXP: 0, // Computed dynamically by LevelEngine
      totalXP: Number(row.total_xp),
      rank: row.rank as RankTier,
      gold: Number(row.gold),
      statPoints: Number(row.stat_points),
      attributes: {
        discipline: Number(row.discipline ?? 10),
        intelligence: Number(row.intelligence ?? 10),
        focus: Number(row.focus ?? 10),
        strength: Number(row.strength ?? 10),
        consistency: Number(row.consistency ?? 10),
        productivity: Number(row.productivity ?? 10),
        energy: Number(row.energy ?? 10),
      },
      activeDebuffs: debuffs,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public updateHunterProfile(profile: HunterProfile): void {
    const stmt = this.db.prepare(`
      UPDATE hunter_profile SET
        name = ?,
        email = ?,
        avatar_url = ?,
        title = ?,
        level = ?,
        current_xp = ?,
        total_xp = ?,
        rank = ?,
        gold = ?,
        stat_points = ?,
        discipline = ?,
        intelligence = ?,
        focus = ?,
        strength = ?,
        consistency = ?,
        productivity = ?,
        energy = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      profile.name,
      profile.email || null,
      profile.avatarUrl || null,
      profile.title,
      profile.level,
      profile.currentXP,
      profile.totalXP,
      profile.rank,
      profile.gold,
      profile.statPoints,
      profile.attributes.discipline,
      profile.attributes.intelligence,
      profile.attributes.focus,
      profile.attributes.strength,
      profile.attributes.consistency,
      profile.attributes.productivity,
      profile.attributes.energy,
      new Date().toISOString(),
      profile.id
    );
  }

  // ---------------- Quests ----------------
  public getAllQuests(): Quest[] {
    const stmt = this.db.prepare('SELECT * FROM quests ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(this.mapQuestRow);
  }

  public getQuestById(id: string): Quest | null {
    const stmt = this.db.prepare('SELECT * FROM quests WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapQuestRow(row) : null;
  }

  public saveQuest(quest: Quest): void {
    const existing = this.getQuestById(quest.id);
    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE quests SET
          title = ?,
          description = ?,
          category = ?,
          priority = ?,
          difficulty = ?,
          xp_reward = ?,
          gold_reward = ?,
          deadline = ?,
          is_mandatory = ?,
          recurrence = ?,
          attribute_rewards_json = ?,
          status = ?,
          subtasks_json = ?,
          recurrence_parent_id = ?,
          completed_at = ?,
          failed_at = ?,
          cancelled_at = ?
        WHERE id = ?
      `);
      stmt.run(
        quest.title,
        quest.description,
        quest.category,
        quest.priority,
        quest.difficulty,
        quest.xpReward,
        quest.goldReward,
        quest.deadline || null,
        quest.isMandatory ? 1 : 0,
        quest.recurrence,
        JSON.stringify(quest.attributeRewards || {}),
        quest.status,
        JSON.stringify(quest.subtasks || []),
        quest.recurrenceParentId || null,
        quest.completedAt || null,
        quest.failedAt || null,
        quest.cancelledAt || null,
        quest.id
      );
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO quests (
          id, title, description, category, priority, difficulty,
          xp_reward, gold_reward, deadline, is_mandatory, recurrence,
          attribute_rewards_json, status, subtasks_json, recurrence_parent_id,
          created_at, completed_at, failed_at, cancelled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        quest.id,
        quest.title,
        quest.description,
        quest.category,
        quest.priority,
        quest.difficulty,
        quest.xpReward,
        quest.goldReward,
        quest.deadline || null,
        quest.isMandatory ? 1 : 0,
        quest.recurrence,
        JSON.stringify(quest.attributeRewards || {}),
        quest.status,
        JSON.stringify(quest.subtasks || []),
        quest.recurrenceParentId || null,
        quest.createdAt,
        quest.completedAt || null,
        quest.failedAt || null,
        quest.cancelledAt || null
      );
    }
  }

  public deleteQuest(id: string): void {
    const stmt = this.db.prepare('DELETE FROM quests WHERE id = ?');
    stmt.run(id);
  }

  private mapQuestRow(row: any): Quest {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: (row.category || 'LIFE') as QuestCategory,
      priority: (row.priority || 'MEDIUM') as QuestPriority,
      difficulty: (row.difficulty || 'E') as RankTier,
      xpReward: Number(row.xp_reward),
      goldReward: Number(row.gold_reward),
      deadline: row.deadline || undefined,
      isMandatory: Boolean(row.is_mandatory),
      recurrence: (row.recurrence || 'ONE_TIME') as QuestRecurrence,
      attributeRewards: JSON.parse(row.attribute_rewards_json || '{}'),
      status: (row.status || 'ACTIVE') as QuestStatus,
      subtasks: JSON.parse(row.subtasks_json || '[]'),
      recurrenceParentId: row.recurrence_parent_id || undefined,
      createdAt: row.created_at,
      completedAt: row.completed_at || undefined,
      failedAt: row.failed_at || undefined,
      cancelledAt: row.cancelled_at || undefined,
    };
  }

  // ---------------- Custom Rewards ----------------
  public getAllRewards(): CustomReward[] {
    const stmt = this.db.prepare('SELECT * FROM rewards ORDER BY created_at ASC');
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      icon: r.icon,
      costGold: Number(r.cost_gold || 0),
      conditions: JSON.parse(r.conditions_json || '{}'),
      isUnlocked: Boolean(r.is_unlocked),
      isClaimed: Boolean(r.is_claimed),
      claimedAt: r.claimed_at || undefined,
      createdAt: r.created_at,
    }));
  }

  public getRewardById(id: string): CustomReward | null {
    const stmt = this.db.prepare('SELECT * FROM rewards WHERE id = ?');
    const r = stmt.get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      icon: r.icon,
      costGold: Number(r.cost_gold || 0),
      conditions: JSON.parse(r.conditions_json || '{}'),
      isUnlocked: Boolean(r.is_unlocked),
      isClaimed: Boolean(r.is_claimed),
      claimedAt: r.claimed_at || undefined,
      createdAt: r.created_at,
    };
  }

  public saveReward(reward: CustomReward): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO rewards (
        id, title, description, category, icon, cost_gold,
        conditions_json, is_unlocked, is_claimed, claimed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      reward.id,
      reward.title,
      reward.description,
      reward.category,
      reward.icon,
      reward.costGold,
      JSON.stringify(reward.conditions || {}),
      reward.isUnlocked ? 1 : 0,
      reward.isClaimed ? 1 : 0,
      reward.claimedAt || null,
      reward.createdAt
    );
  }

  public deleteReward(id: string): void {
    const stmt = this.db.prepare('DELETE FROM rewards WHERE id = ?');
    stmt.run(id);
  }

  // ---------------- Weekly Evaluations ----------------
  public getAllWeeklyEvaluations(): WeeklyEvaluation[] {
    const stmt = this.db.prepare('SELECT * FROM weekly_evaluations ORDER BY week_start_date DESC');
    const rows = stmt.all() as any[];
    return rows.map((w) => ({
      id: w.id,
      weekStartDate: w.week_start_date,
      weekEndDate: w.week_end_date,
      totalXPBonusEarned: Number(w.total_xp_bonus),
      questsCompletedCount: Number(w.quests_completed_count),
      questsFailedCount: Number(w.quests_failed_count),
      mandatoryFailedCount: Number(w.mandatory_failed_count),
      completionRate: Number(w.completion_rate),
      streakMaintainedDays: Number(w.streak_days),
      grade: w.grade,
      weeklyRewardEligible: Boolean(w.weekly_reward_eligible),
      weeklyRewardClaimed: Boolean(w.weekly_reward_claimed),
      weeklyRewardTitle: w.weekly_reward_title,
      aiReflectionFeedback: w.ai_feedback || undefined,
      createdAt: w.created_at,
    }));
  }

  public saveWeeklyEvaluation(evalData: WeeklyEvaluation): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO weekly_evaluations (
        id, week_start_date, week_end_date, total_xp_bonus,
        quests_completed_count, quests_failed_count, mandatory_failed_count,
        completion_rate, streak_days, grade, weekly_reward_eligible,
        weekly_reward_claimed, weekly_reward_title, ai_feedback, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      evalData.id,
      evalData.weekStartDate,
      evalData.weekEndDate,
      evalData.totalXPBonusEarned,
      evalData.questsCompletedCount,
      evalData.questsFailedCount,
      evalData.mandatoryFailedCount,
      evalData.completionRate,
      evalData.streakMaintainedDays,
      evalData.grade,
      evalData.weeklyRewardEligible ? 1 : 0,
      evalData.weeklyRewardClaimed ? 1 : 0,
      evalData.weeklyRewardTitle,
      evalData.aiReflectionFeedback || null,
      evalData.createdAt
    );
  }

  // ---------------- Debuffs & Punishments ----------------
  public getActiveDebuffs(): ActiveDebuff[] {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('SELECT * FROM debuffs WHERE expires_at > ?');
    const rows = stmt.all(now) as any[];
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      type: d.type as SafePunishmentType,
      statPenalties: d.stat_penalties_json ? JSON.parse(d.stat_penalties_json) : undefined,
      xpDeducted: Number(d.xp_deducted || 0),
      expiresAt: d.expires_at,
      createdAt: d.created_at,
    }));
  }

  public addDebuff(debuff: ActiveDebuff): void {
    const stmt = this.db.prepare(`
      INSERT INTO debuffs (id, name, description, type, stat_penalties_json, xp_deducted, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      debuff.id,
      debuff.name,
      debuff.description,
      debuff.type,
      debuff.statPenalties ? JSON.stringify(debuff.statPenalties) : null,
      debuff.xpDeducted || 0,
      debuff.expiresAt,
      debuff.createdAt
    );
  }

  public clearDebuff(id: string): void {
    const stmt = this.db.prepare('DELETE FROM debuffs WHERE id = ?');
    stmt.run(id);
  }

  public getAllPenalties(): PenaltyRecord[] {
    const stmt = this.db.prepare('SELECT * FROM punishments ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((p) => ({
      id: p.id,
      questId: p.quest_id || undefined,
      questTitle: p.quest_title,
      reason: p.reason,
      punishmentType: p.punishment_type as SafePunishmentType,
      recoveryQuestId: p.recovery_quest_id || undefined,
      cleared: Boolean(p.cleared),
      createdAt: p.created_at,
      clearedAt: p.cleared_at || undefined,
    }));
  }

  public savePenalty(penalty: PenaltyRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO punishments (
        id, quest_id, quest_title, reason, punishment_type,
        debuff_id, recovery_quest_id, cleared, created_at, cleared_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      penalty.id,
      penalty.questId || null,
      penalty.questTitle,
      penalty.reason,
      penalty.punishmentType,
      penalty.debuffApplied?.id || null,
      penalty.recoveryQuestId || null,
      penalty.cleared ? 1 : 0,
      penalty.createdAt,
      penalty.clearedAt || null
    );
  }

  // ---------------- Level Up Events ----------------
  public recordLevelUpEvent(event: LevelUpEvent): void {
    const stmt = this.db.prepare(`
      INSERT INTO level_up_events (id, previous_level, new_level, new_rank, stat_points_awarded, reached_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      event.id,
      event.previousLevel,
      event.newLevel,
      event.newRank,
      event.statPointsAwarded,
      event.reachedAt
    );
  }

  public getLevelUpHistory(limit: number = 20): LevelUpEvent[] {
    const stmt = this.db.prepare('SELECT * FROM level_up_events ORDER BY reached_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      previousLevel: Number(r.previous_level),
      newLevel: Number(r.new_level),
      newRank: r.new_rank as RankTier,
      statPointsAwarded: Number(r.stat_points_awarded),
      reachedAt: r.reached_at,
    }));
  }

  // ---------------- System Settings ----------------
  public getSystemSettings(): SystemSettings | null {
    const stmt = this.db.prepare('SELECT value_json FROM system_settings WHERE key = ?');
    const row = stmt.get('global_settings') as any;
    return row ? JSON.parse(row.value_json) : null;
  }

  public saveSystemSettings(settings: SystemSettings): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO system_settings (key, value_json)
      VALUES (?, ?)
    `);
    stmt.run('global_settings', JSON.stringify(settings));
  }

  // ---------------- Notifications ----------------
  public getAllNotifications(limit: number = 100): SystemNotification[] {
    const stmt = this.db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map((n) => ({
      id: n.id,
      category: (n.category || 'SYSTEM') as NotificationCategory,
      title: n.title,
      message: n.message,
      read: Boolean(n.read),
      actionUrl: n.action_url || undefined,
      createdAt: n.created_at,
    }));
  }

  public addNotification(notification: SystemNotification): void {
    const stmt = this.db.prepare(`
      INSERT INTO notifications (id, category, title, message, read, action_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      notification.id,
      notification.category,
      notification.title,
      notification.message,
      notification.read ? 1 : 0,
      notification.actionUrl || null,
      notification.createdAt
    );
  }

  public markNotificationAsRead(id: string): void {
    const stmt = this.db.prepare('UPDATE notifications SET read = 1 WHERE id = ?');
    stmt.run(id);
  }

  public markAllNotificationsAsRead(): void {
    this.db.exec('UPDATE notifications SET read = 1 WHERE read = 0');
  }

  public deleteNotification(id: string): void {
    const stmt = this.db.prepare('DELETE FROM notifications WHERE id = ?');
    stmt.run(id);
  }

  // ---------------- Analytics Events ----------------
  public logAnalyticsEvent(eventType: string, data: Record<string, any>): void {
    const stmt = this.db.prepare(`
      INSERT INTO analytics_events (id, event_type, data_json, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const id = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    stmt.run(id, eventType, JSON.stringify(data), new Date().toISOString());
  }

  public getAnalyticsEvents(): Array<{ id: string; eventType: string; data: any; createdAt: string }> {
    const stmt = this.db.prepare('SELECT * FROM analytics_events ORDER BY created_at ASC');
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      id: r.id,
      eventType: r.event_type,
      data: JSON.parse(r.data_json || '{}'),
      createdAt: r.created_at,
    }));
  }

  public close(): void {
    this.db.close();
  }
}
