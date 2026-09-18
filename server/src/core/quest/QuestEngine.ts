import {
  AttributeRewards,
  Quest,
  QuestCategory,
  QuestPriority,
  QuestRecurrence,
  QuestStatus,
  RankTier,
  SubTask,
} from '../../../../shared/types.js';

export interface CreateCustomQuestParams {
  id?: string;
  title: string;
  description?: string;
  category?: QuestCategory;
  priority?: QuestPriority;
  difficulty?: RankTier;
  xpReward?: number;
  goldReward?: number;
  deadline?: string;
  isMandatory?: boolean;
  recurrence?: QuestRecurrence;
  attributeRewards?: AttributeRewards;
  subtasks?: Array<string | { text: string; completed?: boolean }>;
  recurrenceParentId?: string;
}

export class QuestEngine {
  public static readonly BASE_REWARDS_BY_DIFFICULTY: Record<RankTier, { xp: number; gold: number }> = {
    E: { xp: 50, gold: 20 },
    D: { xp: 120, gold: 50 },
    C: { xp: 300, gold: 150 },
    B: { xp: 750, gold: 400 },
    A: { xp: 1800, gold: 1000 },
    S: { xp: 5000, gold: 3000 },
    MONARCH: { xp: 15000, gold: 10000 },
  };

  public static readonly PRIORITY_MULTIPLIERS: Record<QuestPriority, number> = {
    LOW: 0.8,
    MEDIUM: 1.0,
    HIGH: 1.3,
    URGENT: 1.6,
  };

  /**
   * Deterministically assigns default attribute rewards based on task category if none provided.
   */
  public static getDefaultAttributeRewards(category: QuestCategory, difficulty: RankTier): AttributeRewards {
    const points = difficulty === 'S' || difficulty === 'MONARCH' ? 3 : difficulty === 'A' || difficulty === 'B' ? 2 : 1;
    switch (category) {
      case 'CODING':
        return { intelligence: points, focus: points };
      case 'STUDY':
        return { intelligence: points, discipline: points };
      case 'FITNESS':
        return { strength: points, energy: points };
      case 'DISCIPLINE':
        return { discipline: points, consistency: points };
      case 'CAREER':
        return { productivity: points, focus: points };
      case 'HEALTH':
        return { energy: points, consistency: points };
      case 'CREATIVE':
        return { focus: points, productivity: points };
      case 'LIFE':
      default:
        return { productivity: points };
    }
  }

  /**
   * Creates ANY arbitrary custom quest deterministically.
   */
  public static createQuest(params: CreateCustomQuestParams): Quest {
    const category = params.category || 'LIFE';
    const priority = params.priority || 'MEDIUM';
    const difficulty = params.difficulty || 'E';
    const recurrence = params.recurrence || 'ONE_TIME';
    const isMandatory = params.isMandatory ?? (priority === 'URGENT');

    const base = QuestEngine.BASE_REWARDS_BY_DIFFICULTY[difficulty];
    const multiplier = QuestEngine.PRIORITY_MULTIPLIERS[priority];

    const xpReward = params.xpReward ?? Math.round(base.xp * multiplier);
    const goldReward = params.goldReward ?? Math.round(base.gold * multiplier);

    const attributeRewards =
      params.attributeRewards && Object.keys(params.attributeRewards).length > 0
        ? params.attributeRewards
        : QuestEngine.getDefaultAttributeRewards(category, difficulty);

    const subtasks: SubTask[] = (params.subtasks || []).map((st, index) => {
      if (typeof st === 'string') {
        return { id: `st_${Date.now()}_${index}`, text: st, completed: false };
      }
      return {
        id: `st_${Date.now()}_${index}`,
        text: st.text,
        completed: Boolean(st.completed),
      };
    });

    const now = new Date().toISOString();
    const id = params.id || `quest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      id,
      title: params.title.trim(),
      description: (params.description || '').trim(),
      category,
      priority,
      difficulty,
      xpReward,
      goldReward,
      deadline: params.deadline,
      isMandatory,
      recurrence,
      attributeRewards,
      status: 'ACTIVE',
      subtasks,
      recurrenceParentId: params.recurrenceParentId,
      createdAt: now,
    };
  }

  /**
   * Toggle a subtask completion status
   */
  public static toggleSubtask(quest: Quest, subtaskId: string, completed?: boolean): Quest {
    if (quest.status !== 'ACTIVE') {
      throw new Error(`Cannot modify subtasks for quest in status '${quest.status}'.`);
    }

    const updatedSubtasks = quest.subtasks.map((st) => {
      if (st.id === subtaskId) {
        return {
          ...st,
          completed: completed !== undefined ? completed : !st.completed,
        };
      }
      return st;
    });

    return {
      ...quest,
      subtasks: updatedSubtasks,
    };
  }

  /**
   * Complete quest deterministically
   */
  public static completeQuest(quest: Quest): Quest {
    if (quest.status !== 'ACTIVE') {
      throw new Error(`Cannot complete quest in status '${quest.status}'. Must be 'ACTIVE'.`);
    }

    return {
      ...quest,
      status: 'COMPLETED',
      subtasks: quest.subtasks.map((st) => ({ ...st, completed: true })),
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Fail quest deterministically
   */
  public static failQuest(quest: Quest): Quest {
    if (quest.status !== 'ACTIVE') {
      throw new Error(`Cannot fail quest in status '${quest.status}'.`);
    }

    return {
      ...quest,
      status: 'FAILED',
      failedAt: new Date().toISOString(),
    };
  }

  /**
   * Cancel quest deterministically
   */
  public static cancelQuest(quest: Quest): Quest {
    if (quest.status !== 'ACTIVE') {
      throw new Error(`Cannot cancel quest in status '${quest.status}'.`);
    }

    return {
      ...quest,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
    };
  }

  /**
   * Edit quest parameters while preserving history
   */
  public static editQuest(quest: Quest, updates: Partial<CreateCustomQuestParams>): Quest {
    if (quest.status !== 'ACTIVE') {
      throw new Error(`Cannot edit quest in status '${quest.status}'.`);
    }

    let subtasks = quest.subtasks;
    if (updates.subtasks) {
      subtasks = updates.subtasks.map((st, index) => {
        if (typeof st === 'string') {
          return { id: `st_${Date.now()}_${index}`, text: st, completed: false };
        }
        return {
          id: `st_${Date.now()}_${index}`,
          text: st.text,
          completed: Boolean(st.completed),
        };
      });
    }

    return {
      ...quest,
      title: updates.title !== undefined ? updates.title.trim() : quest.title,
      description: updates.description !== undefined ? updates.description.trim() : quest.description,
      category: updates.category ?? quest.category,
      priority: updates.priority ?? quest.priority,
      difficulty: updates.difficulty ?? quest.difficulty,
      xpReward: updates.xpReward ?? quest.xpReward,
      goldReward: updates.goldReward ?? quest.goldReward,
      deadline: updates.deadline !== undefined ? updates.deadline : quest.deadline,
      isMandatory: updates.isMandatory ?? quest.isMandatory,
      recurrence: updates.recurrence ?? quest.recurrence,
      attributeRewards: updates.attributeRewards ?? quest.attributeRewards,
      subtasks,
    };
  }

  /**
   * Computes the next recurring occurrence of a quest
   */
  public static spawnNextRecurringQuest(quest: Quest): Quest | null {
    if (quest.recurrence === 'ONE_TIME') return null;

    const nextDeadline = QuestEngine.calculateNextDeadline(quest.recurrence, quest.deadline);

    return QuestEngine.createQuest({
      title: quest.title,
      description: quest.description,
      category: quest.category,
      priority: quest.priority,
      difficulty: quest.difficulty,
      xpReward: quest.xpReward,
      goldReward: quest.goldReward,
      deadline: nextDeadline,
      isMandatory: quest.isMandatory,
      recurrence: quest.recurrence,
      attributeRewards: quest.attributeRewards,
      subtasks: quest.subtasks.map((st) => st.text),
      recurrenceParentId: quest.recurrenceParentId || quest.id,
    });
  }

  private static calculateNextDeadline(recurrence: QuestRecurrence, previousDeadline?: string): string | undefined {
    const baseDate = previousDeadline ? new Date(previousDeadline) : new Date();
    const next = new Date(baseDate);

    switch (recurrence) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKDAYS': {
        const day = next.getDay(); // 0 is Sun, 6 is Sat
        if (day === 5) {
          next.setDate(next.getDate() + 3); // Fri -> Mon
        } else if (day === 6) {
          next.setDate(next.getDate() + 2); // Sat -> Mon
        } else {
          next.setDate(next.getDate() + 1);
        }
        break;
      }
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      default:
        return undefined;
    }

    return next.toISOString();
  }
}
