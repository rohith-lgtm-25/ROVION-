/**
 * Complete Shared Types for Personal AI Productivity "System"
 * Enforces strict boundary between deterministic core models and AI advisory proposals.
 */

export type RankTier = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'MONARCH';

export type QuestType = 'DAILY' | 'SIDE' | 'MAIN' | 'EMERGENCY' | 'PENALTY';

export type QuestCategory =
  | 'CODING'
  | 'STUDY'
  | 'FITNESS'
  | 'CAREER'
  | 'HEALTH'
  | 'DISCIPLINE'
  | 'CREATIVE'
  | 'LIFE'
  | 'CUSTOM';

export type QuestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type QuestStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export type QuestRecurrence = 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'WEEKDAYS' | 'CUSTOM';

// 7 Core RPG Attributes
export type AttributeType =
  | 'discipline'
  | 'intelligence'
  | 'focus'
  | 'strength'
  | 'consistency'
  | 'productivity'
  | 'energy';

export interface HunterAttributes {
  discipline: number;    // Mandatory/difficult tasks, resisting procrastination
  intelligence: number;  // Coding, study, complex problem solving
  focus: number;         // Deep work, uninterrupted sprints
  strength: number;      // Physical exercise, stamina
  consistency: number;   // Maintaining streaks and recurring habits
  productivity: number;  // Task volume and execution velocity
  energy: number;        // Recovery, sleep, vitality routines
}

export interface AttributeRewards {
  discipline?: number;
  intelligence?: number;
  focus?: number;
  strength?: number;
  consistency?: number;
  productivity?: number;
  energy?: number;
}

export interface LevelFormulaSettings {
  formulaType: 'POLYNOMIAL' | 'EXPONENTIAL' | 'LINEAR';
  baseXP: number;         // e.g. 100
  exponent: number;       // e.g. 1.5
  linearMultiplier: number; // e.g. 50
  statPointsPerLevel: number; // e.g. 3
}

export interface SystemSettings {
  levelFormula: LevelFormulaSettings;
  quietHours: {
    enabled: boolean;
    startHour: number; // e.g. 22 (10 PM)
    endHour: number;   // e.g. 7 (7 AM)
  };
  audioFeedbackEnabled: boolean;
  browserNotificationsEnabled: boolean;
  safePunishmentPool: {
    allowXPDeduction: boolean;
    allowEntertainmentLockout: boolean;
    allowRewardClaimDelay: boolean;
    allowRecoveryTask: boolean;
  };
}

export interface HunterProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  title: string;
  level: number;
  currentXP: number;
  requiredXP: number;
  totalXP: number;
  rank: RankTier;
  gold: number;
  statPoints: number;
  attributes: HunterAttributes;
  activeDebuffs: ActiveDebuff[];
  createdAt: string;
  updatedAt: string;
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  priority: QuestPriority;
  difficulty: RankTier;
  xpReward: number;
  goldReward: number;
  deadline?: string;
  isMandatory: boolean;
  recurrence: QuestRecurrence;
  attributeRewards: AttributeRewards;
  status: QuestStatus;
  subtasks: SubTask[];
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  recurrenceParentId?: string;
}

// ---------------- Reward System ----------------
export type RewardCategory = 'ENTERTAINMENT' | 'GAMING' | 'FOOD' | 'LEISURE' | 'TREAT' | 'CUSTOM';

export interface RewardUnlockCondition {
  minLevel?: number;
  minTotalXP?: number;
  minStreakDays?: number;
  minWeeklyCompletionRate?: number; // e.g. 80%
  completedQuestsCount?: number;
  specificCategoryCount?: { category: QuestCategory; count: number };
}

export interface CustomReward {
  id: string;
  title: string;
  description: string;
  category: RewardCategory;
  icon: string;
  costGold: number;
  conditions: RewardUnlockCondition;
  isUnlocked: boolean;
  isClaimed: boolean;
  claimedAt?: string;
  createdAt: string;
}

// ---------------- Weekly Evaluation ----------------
export type WeeklyGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface WeeklyEvaluation {
  id: string;
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string;
  totalXPBonusEarned: number;
  questsCompletedCount: number;
  questsFailedCount: number;
  mandatoryFailedCount: number;
  completionRate: number; // 0-100%
  streakMaintainedDays: number;
  grade: WeeklyGrade;
  weeklyRewardEligible: boolean;
  weeklyRewardClaimed: boolean;
  weeklyRewardTitle: string;
  aiReflectionFeedback?: string;
  createdAt: string;
}

// ---------------- Safe Punishment System ----------------
export type SafePunishmentType =
  | 'XP_PENALTY'
  | 'ENTERTAINMENT_LOCKOUT'
  | 'REWARD_CLAIM_DELAY'
  | 'RECOVERY_TASK';

export interface ActiveDebuff {
  id: string;
  name: string;
  description: string;
  type: SafePunishmentType;
  statPenalties?: AttributeRewards;
  xpDeducted?: number;
  expiresAt: string;
  createdAt: string;
}

export interface PenaltyRecord {
  id: string;
  questId?: string;
  questTitle: string;
  reason: string;
  punishmentType: SafePunishmentType;
  debuffApplied?: ActiveDebuff;
  recoveryQuestId?: string;
  cleared: boolean;
  createdAt: string;
  clearedAt?: string;
}

// ---------------- Notifications ----------------
export type NotificationCategory =
  | 'QUEST'
  | 'REMINDER'
  | 'LEVEL_UP'
  | 'REWARD'
  | 'PENALTY'
  | 'WEEKLY_EVALUATION'
  | 'SYSTEM';

export interface SystemNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

// ---------------- Analytics Summary ----------------
export interface AnalyticsSummary {
  level: number;
  rank: RankTier;
  totalXP: number;
  currentStreakDays: number;
  longestStreakDays: number;
  dailyCompletionRate: number;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
  totalQuestsCompleted: number;
  totalQuestsFailed: number;
  mandatoryQuestsFailed: number;
  xpHistoryByDay: { date: string; xp: number }[];
  questsByCategory: Record<QuestCategory, number>;
  attributesRadar: HunterAttributes;
  recentLevelUpHistory: LevelUpEvent[];
}

export interface LevelUpEvent {
  id: string;
  previousLevel: number;
  newLevel: number;
  newRank: RankTier;
  statPointsAwarded: number;
  reachedAt: string;
}

// ---------------- AI Advisory & NLP Types ----------------
export interface ParsedNaturalQuestProposal {
  title: string;
  description: string;
  category: QuestCategory;
  priority: QuestPriority;
  difficulty: RankTier;
  xpReward: number;
  goldReward: number;
  deadline?: string;
  isMandatory: boolean;
  recurrence: QuestRecurrence;
  subtasks: string[];
  attributeRewards: AttributeRewards;
  confidenceScore: number;
  rationale: string;
}

export interface AIAdvisorAnalysisResponse {
  healthScore: number; // 1-100
  summary: string;
  strengths: string[];
  burnoutRisks: string[];
  tacticalRecommendations: string[];
  suggestedFocusCategory: QuestCategory;
  motivationalDirective: string;
}
