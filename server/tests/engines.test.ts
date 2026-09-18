import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LevelEngine } from '../src/core/level/LevelEngine.js';
import { QuestEngine } from '../src/core/quest/QuestEngine.js';
import { RewardEngine } from '../src/core/reward/RewardEngine.js';
import { PunishmentEngine } from '../src/core/punishment/PunishmentEngine.js';
import { WeeklyEngine } from '../src/core/weekly/WeeklyEngine.js';
import { AnalyticsEngine } from '../src/core/analytics/AnalyticsEngine.js';
import { AIService } from '../src/services/ai/AIService.js';
import { DatabaseService } from '../src/db/database.js';
import { HunterProfile, SystemSettings } from '../../shared/types.js';

describe('Deterministic LevelEngine (7 Attributes & Configurable Formulas)', () => {
  const mockProfile: HunterProfile = {
    id: 'test_hunter',
    name: 'Sung Jin-Woo',
    title: 'E-Rank Hunter',
    level: 1,
    currentXP: 0,
    requiredXP: 150,
    totalXP: 0,
    rank: 'E',
    gold: 100,
    statPoints: 0,
    attributes: {
      discipline: 10,
      intelligence: 10,
      focus: 10,
      strength: 10,
      consistency: 10,
      productivity: 10,
      energy: 10,
    },
    activeDebuffs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('calculates required XP with configurable formulas (Polynomial, Exponential, Linear)', () => {
    const poly = LevelEngine.calculateRequiredXP(2, {
      formulaType: 'POLYNOMIAL',
      baseXP: 100,
      exponent: 1.5,
      linearMultiplier: 50,
      statPointsPerLevel: 3,
    });
    expect(poly).toBe(382);

    const linear = LevelEngine.calculateRequiredXP(2, {
      formulaType: 'LINEAR',
      baseXP: 100,
      exponent: 1.0,
      linearMultiplier: 50,
      statPointsPerLevel: 3,
    });
    expect(linear).toBe(250);
  });

  it('levels up accurately, records level up events, and awards AP', () => {
    const result = LevelEngine.addXP(mockProfile, 150);
    expect(result.didLevelUp).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(result.statPointsAwarded).toBe(3);
    expect(result.levelUpEvents.length).toBe(1);
    expect(result.levelUpEvents[0].newLevel).toBe(2);
  });

  it('allocates stat points across all 7 attributes deterministically', () => {
    const profileWithAP: HunterProfile = { ...mockProfile, statPoints: 5 };
    const updated = LevelEngine.allocateStatPoint(profileWithAP, 'focus', 2);
    expect(updated.attributes.focus).toBe(12);
    expect(updated.statPoints).toBe(3);

    const updated2 = LevelEngine.allocateStatPoint(updated, 'energy', 1);
    expect(updated2.attributes.energy).toBe(11);
    expect(updated2.statPoints).toBe(2);
  });

  it('applies direct attribute gains from completed quests', () => {
    const updated = LevelEngine.applyAttributeGains(mockProfile, {
      intelligence: 2,
      discipline: 1,
    });
    expect(updated.attributes.intelligence).toBe(12);
    expect(updated.attributes.discipline).toBe(11);
  });
});

describe('Complete QuestEngine (Arbitrary Custom Tasks & Recurrence)', () => {
  it('creates any arbitrary custom task with category, priority, and attribute rewards', () => {
    const quest = QuestEngine.createQuest({
      title: 'Master Rust Concurrency',
      description: 'Study Arc and Mutex primitives',
      category: 'CODING',
      priority: 'HIGH',
      difficulty: 'D',
      isMandatory: true,
      recurrence: 'WEEKDAYS',
      subtasks: ['Read chapter 16', 'Write 2 thread pool examples'],
    });

    expect(quest.category).toBe('CODING');
    expect(quest.priority).toBe('HIGH');
    expect(quest.difficulty).toBe('D');
    expect(quest.isMandatory).toBe(true);
    expect(quest.recurrence).toBe('WEEKDAYS');
    expect(quest.status).toBe('ACTIVE');
    expect(quest.subtasks.length).toBe(2);
    expect(quest.attributeRewards.intelligence).toBeDefined();
  });

  it('handles subtask ticking and state transitions', () => {
    const quest = QuestEngine.createQuest({
      title: 'Workout session',
      subtasks: ['Stretch', 'Bench press', 'Cooldown'],
    });

    const ticked = QuestEngine.toggleSubtask(quest, quest.subtasks[0].id, true);
    expect(ticked.subtasks[0].completed).toBe(true);
    expect(ticked.subtasks[1].completed).toBe(false);

    const completed = QuestEngine.completeQuest(ticked);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.subtasks.every((s) => s.completed)).toBe(true);
  });

  it('spawns next recurring quest instance with updated deadline', () => {
    const daily = QuestEngine.createQuest({
      title: 'Daily pushups',
      recurrence: 'DAILY',
      deadline: new Date().toISOString(),
    });

    const next = QuestEngine.spawnNextRecurringQuest(daily);
    expect(next).not.toBeNull();
    expect(next?.title).toBe(daily.title);
    expect(next?.recurrence).toBe('DAILY');
    expect(next?.deadline).toBeDefined();
  });
});

describe('Custom Rewards & Safe Punishment Engine', () => {
  const profile: HunterProfile = {
    id: 'test_hunter',
    name: 'Hunter',
    title: 'E-Rank',
    level: 2,
    currentXP: 50,
    requiredXP: 382,
    totalXP: 500,
    rank: 'E',
    gold: 200,
    statPoints: 0,
    attributes: {
      discipline: 10,
      intelligence: 10,
      focus: 10,
      strength: 10,
      consistency: 10,
      productivity: 10,
      energy: 10,
    },
    activeDebuffs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('evaluates reward unlock conditions and allows manual claiming', () => {
    const rewards = [
      {
        id: 'rew_1',
        title: 'Watch Anime',
        description: '30 mins',
        category: 'ENTERTAINMENT' as const,
        icon: '📺',
        costGold: 50,
        conditions: { minLevel: 2, minTotalXP: 300 },
        isUnlocked: false,
        isClaimed: false,
        createdAt: new Date().toISOString(),
      },
    ];

    const { newlyUnlockedRewards } = RewardEngine.evaluateAllRewards(rewards, {
      profile,
      completedQuests: [],
      currentStreakDays: 3,
      weeklyCompletionRate: 90,
    });

    expect(newlyUnlockedRewards.length).toBe(1);
    expect(newlyUnlockedRewards[0].isUnlocked).toBe(true);

    const { updatedProfile, claimedReward } = RewardEngine.claimReward(profile, newlyUnlockedRewards[0]);
    expect(updatedProfile.gold).toBe(150);
    expect(claimedReward.isClaimed).toBe(true);
  });

  it('inflicts safe punishment without harmful actions', () => {
    const failedQuest = QuestEngine.createQuest({
      title: 'Mandatory exam prep',
      isMandatory: true,
      priority: 'URGENT',
    });

    const settings: SystemSettings = {
      levelFormula: LevelEngine.DEFAULT_FORMULA,
      quietHours: { enabled: false, startHour: 22, endHour: 7 },
      audioFeedbackEnabled: true,
      browserNotificationsEnabled: true,
      safePunishmentPool: {
        allowXPDeduction: true,
        allowEntertainmentLockout: true,
        allowRewardClaimDelay: true,
        allowRecoveryTask: true,
      },
    };

    const res = PunishmentEngine.inflictSafePenalty(profile, failedQuest, settings);
    expect(res.penaltyRecord.cleared).toBe(false);
    expect(res.recoveryQuest).toBeDefined();
    expect(res.updatedProfile.activeDebuffs.length).toBe(1);

    // Clear punishment
    const cleared = PunishmentEngine.clearPenalty(res.updatedProfile, res.penaltyRecord);
    expect(cleared.clearedPenalty.cleared).toBe(true);
    expect(cleared.updatedProfile.activeDebuffs.length).toBe(0);
  });
});

describe('Weekly Evaluation Engine', () => {
  it('grades weekly performance and determines weekly reward eligibility', () => {
    const q1 = QuestEngine.completeQuest(QuestEngine.createQuest({ title: 'Task 1' }));
    const q2 = QuestEngine.completeQuest(QuestEngine.createQuest({ title: 'Task 2' }));

    const profile: HunterProfile = {
      id: 'test',
      name: 'Hunter',
      title: 'E-Rank',
      level: 1,
      currentXP: 0,
      requiredXP: 150,
      totalXP: 0,
      rank: 'E',
      gold: 0,
      statPoints: 0,
      attributes: { discipline: 10, intelligence: 10, focus: 10, strength: 10, consistency: 10, productivity: 10, energy: 10 },
      activeDebuffs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { evaluation, bonusXP } = WeeklyEngine.evaluateWeek(profile, [q1, q2], 6);
    expect(evaluation.grade).toBe('S');
    expect(evaluation.weeklyRewardEligible).toBe(true);
    expect(bonusXP).toBe(1000);
  });
});

describe('AI Natural Language Parser & Real Data Advisor', () => {
  const ai = new AIService({ provider: 'mock' });

  it('converts natural language commands into structured quest proposals', async () => {
    const cmd = 'Study Python for 1 hour';
    const parsed = await ai.parseNaturalLanguageQuest(cmd);
    expect(parsed.title).toContain('Study Python for 1 hour');
    expect(parsed.category).toBe('CODING');
    expect(parsed.attributeRewards.intelligence).toBeDefined();
    expect(parsed.subtasks.length).toBeGreaterThan(0);
  });

  it('analyzes real database analytics without data fabrication', async () => {
    const profile: HunterProfile = {
      id: 'test',
      name: 'Hunter',
      title: 'E-Rank',
      level: 3,
      currentXP: 100,
      requiredXP: 600,
      totalXP: 1200,
      rank: 'E',
      gold: 300,
      statPoints: 0,
      attributes: { discipline: 15, intelligence: 25, focus: 20, strength: 10, consistency: 15, productivity: 18, energy: 10 },
      activeDebuffs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const analytics = AnalyticsEngine.calculateSummary(profile, []);
    const advice = await ai.analyzeHunterPerformance(analytics, profile);
    expect(advice.healthScore).toBeGreaterThanOrEqual(20);
    expect(advice.summary).toBeDefined();
    expect(advice.tacticalRecommendations.length).toBeGreaterThan(0);
  });
});

describe('Database Persistence End-to-End', () => {
  const testDbPath = path.resolve(process.cwd(), 'test_full_system.sqlite');
  let db: DatabaseService;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    db = new DatabaseService(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  it('persists profile, custom quests, custom rewards, and level events', () => {
    const profile = db.getHunterProfile();
    expect(profile.attributes.discipline).toBe(10);

    const quest = QuestEngine.createQuest({
      title: 'Full DB Test Quest',
      category: 'FITNESS',
      difficulty: 'C',
    });
    db.saveQuest(quest);

    const fetched = db.getQuestById(quest.id);
    expect(fetched?.category).toBe('FITNESS');

    const rewards = db.getAllRewards();
    expect(rewards.length).toBeGreaterThan(0);
  });
});
