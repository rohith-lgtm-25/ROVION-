import { Router, Request, Response } from 'express';
import { DatabaseService } from '../db/database.js';
import { LevelEngine } from '../core/level/LevelEngine.js';
import { QuestEngine } from '../core/quest/QuestEngine.js';
import { RewardEngine } from '../core/reward/RewardEngine.js';
import { PunishmentEngine } from '../core/punishment/PunishmentEngine.js';
import { WeeklyEngine } from '../core/weekly/WeeklyEngine.js';
import { NotificationEngine } from '../core/notification/NotificationEngine.js';
import { AnalyticsEngine } from '../core/analytics/AnalyticsEngine.js';
import { AIService } from '../services/ai/AIService.js';
import {
  AttributeType,
  CustomReward,
  QuestCategory,
  QuestPriority,
  QuestRecurrence,
  QuestStatus,
  SystemSettings,
} from '../../../shared/types.js';

export function createApiRouter(db: DatabaseService, ai: AIService): Router {
  const router = Router();

  // -------------------------------------------------------------------
  // SYSTEM & HUNTER PROFILE
  // -------------------------------------------------------------------
  router.get('/system/status', (req: Request, res: Response) => {
    try {
      const rawProfile = db.getHunterProfile();
      const settings = db.getSystemSettings();
      const requiredXP = LevelEngine.calculateRequiredXP(
        rawProfile.level,
        settings?.levelFormula
      );

      const profile = {
        ...rawProfile,
        requiredXP,
      };

      const quests = db.getAllQuests();
      const activeQuests = quests.filter((q) => q.status === 'ACTIVE');
      const notifications = db.getAllNotifications(20);
      const unreadCount = notifications.filter((n) => !n.read).length;

      res.json({
        profile,
        settings,
        activeQuestsCount: activeQuests.length,
        unreadNotificationsCount: unreadCount,
        serverTime: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/hunter/allocate-stat', (req: Request, res: Response) => {
    try {
      const { attribute, points } = req.body as { attribute: AttributeType; points?: number };
      if (!attribute) {
        return res.status(400).json({ error: 'Missing required field: attribute' });
      }

      const profile = db.getHunterProfile();
      const updated = LevelEngine.allocateStatPoint(profile, attribute, points || 1);
      db.updateHunterProfile(updated);

      db.logAnalyticsEvent('ATTRIBUTE_ALLOCATED', { attribute, points: points || 1 });

      const settings = db.getSystemSettings();
      res.json({
        success: true,
        profile: {
          ...updated,
          requiredXP: LevelEngine.calculateRequiredXP(updated.level, settings?.levelFormula),
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/hunter/profile', (req: Request, res: Response) => {
    try {
      const { name, email, avatarUrl, title } = req.body;
      const profile = db.getHunterProfile();
      const updated = {
        ...profile,
        name: name !== undefined ? name : profile.name,
        email: email !== undefined ? email : profile.email,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : profile.avatarUrl,
        title: title !== undefined ? title : profile.title,
        updatedAt: new Date().toISOString(),
      };

      db.updateHunterProfile(updated);
      res.json({ success: true, profile: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------------
  // QUESTS (Full CRUD & Lifecycle)
  // -------------------------------------------------------------------
  router.get('/quests', (req: Request, res: Response) => {
    try {
      const { status, category, priority, recurrence } = req.query;
      let quests = db.getAllQuests();

      if (status) quests = quests.filter((q) => q.status === status);
      if (category) quests = quests.filter((q) => q.category === category);
      if (priority) quests = quests.filter((q) => q.priority === priority);
      if (recurrence) quests = quests.filter((q) => q.recurrence === recurrence);

      res.json(quests);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/quests/:id', (req: Request, res: Response) => {
    try {
      const quest = db.getQuestById(req.params.id as string);
      if (!quest) return res.status(404).json({ error: 'Quest not found' });
      res.json(quest);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/quests', (req: Request, res: Response) => {
    try {
      const quest = QuestEngine.createQuest(req.body);
      db.saveQuest(quest);

      const notif = NotificationEngine.onQuestAssigned(quest.title, quest.difficulty);
      db.addNotification(notif);

      db.logAnalyticsEvent('QUEST_CREATED', {
        questId: quest.id,
        category: quest.category,
        priority: quest.priority,
        difficulty: quest.difficulty,
        isMandatory: quest.isMandatory,
      });

      res.status(201).json(quest);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put('/quests/:id', (req: Request, res: Response) => {
    try {
      const quest = db.getQuestById(req.params.id as string);
      if (!quest) return res.status(404).json({ error: 'Quest not found' });

      const updated = QuestEngine.editQuest(quest, req.body);
      db.saveQuest(updated);

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/quests/:id', (req: Request, res: Response) => {
    try {
      db.deleteQuest(req.params.id as string);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/quests/:id/subtask', (req: Request, res: Response) => {
    try {
      const { subtaskId, completed } = req.body;
      const quest = db.getQuestById(req.params.id as string);
      if (!quest) return res.status(404).json({ error: 'Quest not found' });

      const updated = QuestEngine.toggleSubtask(quest, subtaskId, completed);
      db.saveQuest(updated);

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/quests/:id/complete', (req: Request, res: Response) => {
    try {
      const quest = db.getQuestById(req.params.id as string);
      if (!quest) return res.status(404).json({ error: 'Quest not found' });

      // 1. Complete Quest
      const completedQuest = QuestEngine.completeQuest(quest);
      db.saveQuest(completedQuest);

      const profile = db.getHunterProfile();
      const settings = db.getSystemSettings() || undefined;

      // 2. Add XP deterministically
      const levelResult = LevelEngine.addXP(profile, completedQuest.xpReward, settings?.levelFormula);
      let updatedProfile = levelResult.updatedProfile;

      // Save level up events
      for (const event of levelResult.levelUpEvents) {
        db.recordLevelUpEvent(event);
      }

      // 3. Add Gold and 7 Attributes
      updatedProfile.gold += completedQuest.goldReward;
      if (completedQuest.attributeRewards) {
        updatedProfile = LevelEngine.applyAttributeGains(updatedProfile, completedQuest.attributeRewards);
      }

      // 4. Check & Spawn next recurring instance if applicable
      let nextRecurringQuest = null;
      if (completedQuest.recurrence !== 'ONE_TIME') {
        nextRecurringQuest = QuestEngine.spawnNextRecurringQuest(completedQuest);
        if (nextRecurringQuest) {
          db.saveQuest(nextRecurringQuest);
        }
      }

      // 5. Evaluate Custom Rewards Unlocks
      const allRewards = db.getAllRewards();
      const allQuests = db.getAllQuests();
      const analytics = AnalyticsEngine.calculateSummary(updatedProfile, allQuests);

      const { newlyUnlockedRewards } = RewardEngine.evaluateAllRewards(allRewards, {
        profile: updatedProfile,
        completedQuests: allQuests.filter((q) => q.status === 'COMPLETED'),
        currentStreakDays: analytics.currentStreakDays,
        weeklyCompletionRate: analytics.weeklyCompletionRate,
      });

      for (const unl of newlyUnlockedRewards) {
        db.saveReward(unl);
        db.addNotification(NotificationEngine.onRewardUnlocked(unl.title));
      }

      // 6. Save Profile
      db.updateHunterProfile(updatedProfile);

      // 7. Dispatch Notifications
      db.addNotification(
        NotificationEngine.onQuestCompleted(
          completedQuest.title,
          completedQuest.xpReward,
          completedQuest.goldReward
        )
      );

      if (levelResult.didLevelUp) {
        db.addNotification(
          NotificationEngine.onLevelUp(levelResult.newLevel, levelResult.newRank)
        );
      }

      // 8. If recovery quest completed, clear associated punishment
      const penalties = db.getAllPenalties();
      const matchingPenalty = penalties.find((p) => p.recoveryQuestId === completedQuest.id && !p.cleared);
      if (matchingPenalty) {
        const cleared = PunishmentEngine.clearPenalty(updatedProfile, matchingPenalty);
        db.savePenalty(cleared.clearedPenalty);
        db.updateHunterProfile(cleared.updatedProfile);
        updatedProfile = cleared.updatedProfile;
      }

      db.logAnalyticsEvent('QUEST_COMPLETED', {
        questId: completedQuest.id,
        category: completedQuest.category,
        xpReward: completedQuest.xpReward,
        goldReward: completedQuest.goldReward,
      });

      res.json({
        success: true,
        quest: completedQuest,
        nextRecurringQuest,
        profile: {
          ...updatedProfile,
          requiredXP: LevelEngine.calculateRequiredXP(updatedProfile.level, settings?.levelFormula),
        },
        levelResult,
        newlyUnlockedRewards,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/quests/:id/fail', (req: Request, res: Response) => {
    try {
      const quest = db.getQuestById(req.params.id as string);
      if (!quest) return res.status(404).json({ error: 'Quest not found' });

      const failedQuest = QuestEngine.failQuest(quest);
      db.saveQuest(failedQuest);

      const profile = db.getHunterProfile();
      const settings = db.getSystemSettings() || undefined;

      let punishmentResult = null;

      // Trigger safe punishment if mandatory
      if (failedQuest.isMandatory) {
        punishmentResult = PunishmentEngine.inflictSafePenalty(profile, failedQuest, settings);
        
        if (punishmentResult.recoveryQuest) {
          db.saveQuest(punishmentResult.recoveryQuest);
        }
        if (punishmentResult.debuff) {
          db.addDebuff(punishmentResult.debuff);
        }
        db.savePenalty(punishmentResult.penaltyRecord);
        db.updateHunterProfile(punishmentResult.updatedProfile);

        db.addNotification(
          NotificationEngine.onPenaltyInflicted(punishmentResult.penaltyRecord.reason)
        );
      }

      db.logAnalyticsEvent('QUEST_FAILED', {
        questId: failedQuest.id,
        isMandatory: failedQuest.isMandatory,
      });

      const updatedProf = punishmentResult ? punishmentResult.updatedProfile : profile;
      res.json({
        success: true,
        quest: failedQuest,
        punishmentResult,
        profile: {
          ...updatedProf,
          requiredXP: LevelEngine.calculateRequiredXP(updatedProf.level, settings?.levelFormula),
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/quests/:id/cancel', (req: Request, res: Response) => {
    try {
      const quest = db.getQuestById(req.params.id as string);
      if (!quest) return res.status(404).json({ error: 'Quest not found' });

      const cancelled = QuestEngine.cancelQuest(quest);
      db.saveQuest(cancelled);

      res.json(cancelled);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------------
  // CUSTOM REWARDS
  // -------------------------------------------------------------------
  router.get('/rewards', (req: Request, res: Response) => {
    try {
      const rewards = db.getAllRewards();
      res.json(rewards);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/rewards', (req: Request, res: Response) => {
    try {
      const { title, description, category, icon, costGold, conditions } = req.body;
      if (!title) return res.status(400).json({ error: 'Missing reward title' });

      const reward: CustomReward = {
        id: `rew_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        description: (description || '').trim(),
        category: category || 'CUSTOM',
        icon: icon || '🎁',
        costGold: Number(costGold || 0),
        conditions: conditions || {},
        isUnlocked: false,
        isClaimed: false,
        createdAt: new Date().toISOString(),
      };

      db.saveReward(reward);
      res.status(201).json(reward);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/rewards/:id', (req: Request, res: Response) => {
    try {
      db.deleteReward(req.params.id as string);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/rewards/:id/claim', (req: Request, res: Response) => {
    try {
      const reward = db.getRewardById(req.params.id as string);
      if (!reward) return res.status(404).json({ error: 'Reward not found' });

      // Check if active entertainment lockout debuff exists
      const profile = db.getHunterProfile();
      const hasLockout = profile.activeDebuffs.some(
        (d) => d.type === 'ENTERTAINMENT_LOCKOUT' || d.type === 'RECOVERY_TASK'
      );
      if (hasLockout && (reward.category === 'ENTERTAINMENT' || reward.category === 'GAMING')) {
        return res.status(403).json({
          error: 'Entertainment Reward Claims are LOCKED due to active Discipline Penalty Debuff.',
        });
      }

      const { updatedProfile, claimedReward } = RewardEngine.claimReward(profile, reward);

      db.updateHunterProfile(updatedProfile);
      db.saveReward(claimedReward);

      db.logAnalyticsEvent('REWARD_CLAIMED', {
        rewardId: claimedReward.id,
        costGold: claimedReward.costGold,
      });

      const settings = db.getSystemSettings();
      res.json({
        success: true,
        claimedReward,
        profile: {
          ...updatedProfile,
          requiredXP: LevelEngine.calculateRequiredXP(updatedProfile.level, settings?.levelFormula),
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------------
  // WEEKLY EVALUATION
  // -------------------------------------------------------------------
  router.get('/weekly/evaluations', (req: Request, res: Response) => {
    try {
      const evaluations = db.getAllWeeklyEvaluations();
      res.json(evaluations);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/weekly/evaluate-current', (req: Request, res: Response) => {
    try {
      const profile = db.getHunterProfile();
      const quests = db.getAllQuests();
      const analytics = AnalyticsEngine.calculateSummary(profile, quests);

      const { evaluation, bonusXP } = WeeklyEngine.evaluateWeek(
        profile,
        quests,
        analytics.currentStreakDays
      );

      // Award bonus XP if grade >= C
      let updatedProfile = profile;
      const settings = db.getSystemSettings();
      if (bonusXP > 0) {
        const levelRes = LevelEngine.addXP(profile, bonusXP, settings?.levelFormula);
        updatedProfile = levelRes.updatedProfile;
        for (const ev of levelRes.levelUpEvents) {
          db.recordLevelUpEvent(ev);
        }
        db.updateHunterProfile(updatedProfile);
      }

      db.saveWeeklyEvaluation(evaluation);
      db.addNotification(
        NotificationEngine.onWeeklyEvaluation(evaluation.grade, evaluation.weeklyRewardEligible)
      );

      res.json({
        success: true,
        evaluation,
        bonusXP,
        profile: {
          ...updatedProfile,
          requiredXP: LevelEngine.calculateRequiredXP(updatedProfile.level, settings?.levelFormula),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/weekly/claim-reward/:id', (req: Request, res: Response) => {
    try {
      const evals = db.getAllWeeklyEvaluations();
      const evalRecord = evals.find((e) => e.id === (req.params.id as string));
      if (!evalRecord) return res.status(404).json({ error: 'Evaluation not found' });

      if (!evalRecord.weeklyRewardEligible) {
        return res.status(400).json({ error: 'Not eligible for weekly reward on this report.' });
      }
      if (evalRecord.weeklyRewardClaimed) {
        return res.status(400).json({ error: 'Weekly reward already claimed.' });
      }

      const updated = { ...evalRecord, weeklyRewardClaimed: true };
      db.saveWeeklyEvaluation(updated);

      db.logAnalyticsEvent('WEEKLY_REWARD_CLAIMED', { evalId: evalRecord.id });

      res.json({ success: true, evaluation: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------------
  // SAFE PUNISHMENTS & DEBUFFS
  // -------------------------------------------------------------------
  router.get('/punishments', (req: Request, res: Response) => {
    try {
      const penalties = db.getAllPenalties();
      const debuffs = db.getActiveDebuffs();
      res.json({ penalties, debuffs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/punishments/:id/clear', (req: Request, res: Response) => {
    try {
      const penalties = db.getAllPenalties();
      const penalty = penalties.find((p) => p.id === (req.params.id as string));
      if (!penalty) return res.status(404).json({ error: 'Penalty record not found' });

      const profile = db.getHunterProfile();
      const { updatedProfile, clearedPenalty } = PunishmentEngine.clearPenalty(profile, penalty);

      db.updateHunterProfile(updatedProfile);
      db.savePenalty(clearedPenalty);

      const settings = db.getSystemSettings();
      res.json({
        success: true,
        clearedPenalty,
        profile: {
          ...updatedProfile,
          requiredXP: LevelEngine.calculateRequiredXP(updatedProfile.level, settings?.levelFormula),
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------------
  // AI ASSISTANT & REAL-DATA ADVISOR
  // -------------------------------------------------------------------
  router.post('/ai/parse-quest', async (req: Request, res: Response) => {
    try {
      const { command } = req.body;
      if (!command || typeof command !== 'string') {
        return res.status(400).json({ error: 'Missing natural language command string.' });
      }

      const profile = db.getHunterProfile();
      const proposal = await ai.parseNaturalLanguageQuest(command, profile);
      res.json(proposal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/ai/performance-advice', async (req: Request, res: Response) => {
    try {
      const profile = db.getHunterProfile();
      const quests = db.getAllQuests();
      const levelUpHistory = db.getLevelUpHistory(10);
      const analytics = AnalyticsEngine.calculateSummary(profile, quests, levelUpHistory);

      const advice = await ai.analyzeHunterPerformance(analytics, profile);
      res.json(advice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------------
  // SETTINGS & CONFIG
  // -------------------------------------------------------------------
  router.get('/settings', (req: Request, res: Response) => {
    try {
      const settings = db.getSystemSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/settings', (req: Request, res: Response) => {
    try {
      const updatedSettings = req.body as SystemSettings;
      db.saveSystemSettings(updatedSettings);
      res.json({ success: true, settings: updatedSettings });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------------
  router.get('/notifications', (req: Request, res: Response) => {
    try {
      const notifs = db.getAllNotifications(100);
      res.json(notifs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/notifications/read-all', (req: Request, res: Response) => {
    try {
      db.markAllNotificationsAsRead();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/notifications/:id/read', (req: Request, res: Response) => {
    try {
      db.markNotificationAsRead(req.params.id as string);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/notifications/:id', (req: Request, res: Response) => {
    try {
      db.deleteNotification(req.params.id as string);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------------
  // ANALYTICS & HISTORY
  // -------------------------------------------------------------------
  router.get('/analytics', (req: Request, res: Response) => {
    try {
      const profile = db.getHunterProfile();
      const quests = db.getAllQuests();
      const levelUpHistory = db.getLevelUpHistory(10);

      const summary = AnalyticsEngine.calculateSummary(profile, quests, levelUpHistory);
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/level-up-history', (req: Request, res: Response) => {
    try {
      const history = db.getLevelUpHistory(50);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------------
  // GOOGLE LOGIN / HUNTER AUTHENTICATION
  // -------------------------------------------------------------------
  router.post('/auth/google-sync', (req: Request, res: Response) => {
    try {
      const { name, email, avatarUrl } = req.body;
      const profile = db.getHunterProfile();

      const updated = {
        ...profile,
        name: name || profile.name,
        email: email || profile.email,
        avatarUrl: avatarUrl || profile.avatarUrl,
        updatedAt: new Date().toISOString(),
      };

      db.updateHunterProfile(updated);

      db.addNotification({
        id: `notif_${Date.now()}`,
        category: 'SYSTEM',
        title: 'HUNTER AUTHENTICATED',
        message: `Welcome, Hunter ${updated.name}. Google credentials synced to System Core.`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      const settings = db.getSystemSettings();
      res.json({
        success: true,
        profile: {
          ...updated,
          requiredXP: LevelEngine.calculateRequiredXP(updated.level, settings?.levelFormula),
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
