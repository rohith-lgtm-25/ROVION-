import {
  AIAdvisorAnalysisResponse,
  AnalyticsSummary,
  HunterProfile,
  ParsedNaturalQuestProposal,
  QuestCategory,
  QuestPriority,
  QuestRecurrence,
  RankTier,
} from '../../../../shared/types.js';

export interface AIServiceConfig {
  apiKey?: string;
  model?: string;
  provider?: 'gemini' | 'openai' | 'mock';
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config?: AIServiceConfig) {
    this.config = {
      apiKey: config?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY,
      provider: config?.provider || (process.env.AI_API_KEY ? 'gemini' : 'mock'),
      model: config?.model || 'gemini-1.5-flash',
    };
  }

  /**
   * Parses natural language command into a structured quest proposal.
   * NOTE: Strictly returns a proposal for user confirmation. Does NOT mutate database directly.
   */
  public async parseNaturalLanguageQuest(
    command: string,
    profile?: HunterProfile
  ): Promise<ParsedNaturalQuestProposal> {
    if (this.config.provider === 'gemini' && this.config.apiKey) {
      try {
        return await this.callGeminiForNLPQuest(command, profile);
      } catch (err) {
        console.warn('[AIService] External LLM call failed, using heuristic parser:', err);
      }
    }

    return this.mockNLPParseQuest(command, profile);
  }

  /**
   * Analyzes REAL database metrics from AnalyticsSummary to produce tactical recommendations.
   * Invariant: Strictly uses actual data; never fabricates completions or streaks.
   */
  public async analyzeHunterPerformance(
    analytics: AnalyticsSummary,
    profile: HunterProfile
  ): Promise<AIAdvisorAnalysisResponse> {
    if (this.config.provider === 'gemini' && this.config.apiKey) {
      try {
        return await this.callGeminiForPerformanceAnalysis(analytics, profile);
      } catch (err) {
        console.warn('[AIService] External LLM call failed, using heuristic advisor:', err);
      }
    }

    return this.mockPerformanceAnalysis(analytics, profile);
  }

  // -----------------------------------------------------------------------
  // Real LLM Providers (Gemini API format)
  // -----------------------------------------------------------------------
  private async callGeminiForNLPQuest(
    command: string,
    profile?: HunterProfile
  ): Promise<ParsedNaturalQuestProposal> {
    const prompt = `
You are the System Quest Parser from Solo Leveling. A hunter (Rank: ${profile?.rank || 'E'}, Level: ${profile?.level || 1}) gave the natural language command:
"${command}"

Convert this into a structured quest. Current ISO timestamp: "${new Date().toISOString()}".
Return ONLY valid JSON matching this schema:
{
  "title": "Concise epic quest title",
  "description": "Clear actionable description",
  "category": "CODING" | "STUDY" | "FITNESS" | "CAREER" | "HEALTH" | "DISCIPLINE" | "CREATIVE" | "LIFE" | "CUSTOM",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "difficulty": "E" | "D" | "C" | "B" | "A" | "S",
  "xpReward": number,
  "goldReward": number,
  "deadline": "ISO string date/time or null",
  "isMandatory": boolean,
  "recurrence": "ONE_TIME" | "DAILY" | "WEEKDAYS" | "WEEKLY" | "CUSTOM",
  "subtasks": ["step 1", "step 2"],
  "attributeRewards": {
    "discipline"?: number,
    "intelligence"?: number,
    "focus"?: number,
    "strength"?: number,
    "consistency"?: number,
    "productivity"?: number,
    "energy"?: number
  },
  "confidenceScore": number (1-100),
  "rationale": "Why these parameters were selected"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = (await response.json()) as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from AI Provider');
    return JSON.parse(rawText) as ParsedNaturalQuestProposal;
  }

  private async callGeminiForPerformanceAnalysis(
    analytics: AnalyticsSummary,
    profile: HunterProfile
  ): Promise<AIAdvisorAnalysisResponse> {
    const prompt = `
You are the cold, hyper-analytical System Voice from Solo Leveling.
Analyze this hunter's REAL database metrics:
- Level: ${profile.level} (${profile.rank}-Rank)
- Total XP: ${analytics.totalXP}
- Current Streak: ${analytics.currentStreakDays} days (Longest: ${analytics.longestStreakDays} days)
- Daily Completion Rate: ${analytics.dailyCompletionRate}%
- Weekly Completion Rate: ${analytics.weeklyCompletionRate}%
- Monthly Completion Rate: ${analytics.monthlyCompletionRate}%
- Quests Completed: ${analytics.totalQuestsCompleted}, Failed: ${analytics.totalQuestsFailed} (Mandatory Failed: ${analytics.mandatoryQuestsFailed})
- Attribute Distribution: Discipline=${profile.attributes.discipline}, Intel=${profile.attributes.intelligence}, Focus=${profile.attributes.focus}, Strength=${profile.attributes.strength}, Consistency=${profile.attributes.consistency}, Prod=${profile.attributes.productivity}, Energy=${profile.attributes.energy}
- Quests by Category: ${JSON.stringify(analytics.questsByCategory)}

Return JSON ONLY:
{
  "healthScore": number (1-100),
  "summary": "2-3 sentence rigorous evaluation of hunter performance",
  "strengths": ["string", "string"],
  "burnoutRisks": ["string"],
  "tacticalRecommendations": ["actionable advice 1", "actionable advice 2", "actionable advice 3"],
  "suggestedFocusCategory": "CODING" | "STUDY" | "FITNESS" | "CAREER" | "HEALTH" | "DISCIPLINE" | "CREATIVE" | "LIFE",
  "motivationalDirective": "Cold motivating closing System directive"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = (await response.json()) as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from AI Provider');
    return JSON.parse(rawText) as AIAdvisorAnalysisResponse;
  }

  // -----------------------------------------------------------------------
  // Heuristic Natural Language Parser (Offline / Local Fallback)
  // -----------------------------------------------------------------------
  private mockNLPParseQuest(
    command: string,
    profile?: HunterProfile
  ): ParsedNaturalQuestProposal {
    const text = command.toLowerCase();
    
    // Category detection
    let category: QuestCategory = 'LIFE';
    let attributeRewards: Record<string, number> = { productivity: 1 };
    
    if (text.includes('code') || text.includes('python') || text.includes('rust') || text.includes('app') || text.includes('dbms') || text.includes('dev') || text.includes('build') || text.includes('menav')) {
      category = 'CODING';
      attributeRewards = { intelligence: 2, focus: 2 };
    } else if (text.includes('study') || text.includes('read') || text.includes('assignment') || text.includes('exam') || text.includes('learn')) {
      category = 'STUDY';
      attributeRewards = { intelligence: 2, discipline: 1 };
    } else if (text.includes('exercise') || text.includes('workout') || text.includes('gym') || text.includes('run') || text.includes('pushup') || text.includes('squat')) {
      category = 'FITNESS';
      attributeRewards = { strength: 2, energy: 2 };
    } else if (text.includes('sleep') || text.includes('water') || text.includes('diet') || text.includes('meditat') || text.includes('walk')) {
      category = 'HEALTH';
      attributeRewards = { energy: 2, consistency: 1 };
    } else if (text.includes('job') || text.includes('client') || text.includes('meeting') || text.includes('resume') || text.includes('pitch')) {
      category = 'CAREER';
      attributeRewards = { productivity: 2, focus: 1 };
    }

    // Priority & Difficulty detection
    let priority: QuestPriority = 'MEDIUM';
    let difficulty: RankTier = 'E';
    let isMandatory = false;

    if (text.includes('urgent') || text.includes('asap') || text.includes('mandatory') || text.includes('must') || text.includes('by 9 pm') || text.includes('tonight')) {
      priority = 'URGENT';
      isMandatory = true;
    } else if (text.includes('important') || text.includes('high priority')) {
      priority = 'HIGH';
    }

    if (text.includes('hour') || text.includes('hard') || text.includes('deep') || text.includes('finish') || text.includes('project')) {
      difficulty = 'D';
    }
    if (text.includes('2 hour') || text.includes('3 hour') || text.includes('exam') || text.includes('master')) {
      difficulty = 'C';
    }

    // Recurrence detection
    let recurrence: QuestRecurrence = 'ONE_TIME';
    if (text.includes('every weekday') || text.includes('weekdays')) {
      recurrence = 'WEEKDAYS';
    } else if (text.includes('every day') || text.includes('daily')) {
      recurrence = 'DAILY';
    } else if (text.includes('every week') || text.includes('weekly')) {
      recurrence = 'WEEKLY';
    }

    // Deadline detection
    let deadline: string | undefined;
    const now = new Date();
    if (text.includes('9 pm') || text.includes('9pm')) {
      const d = new Date(now);
      d.setHours(21, 0, 0, 0);
      if (d.getTime() < now.getTime()) {
        d.setDate(d.getDate() + 1);
      }
      deadline = d.toISOString();
    } else if (text.includes('today') || text.includes('tonight')) {
      const d = new Date(now);
      d.setHours(23, 59, 59, 0);
      deadline = d.toISOString();
    } else if (text.includes('tomorrow')) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(23, 59, 59, 0);
      deadline = d.toISOString();
    }

    // Subtasks generation
    const subtasks: string[] = [];
    if (text.includes('1 hour') || text.includes('2 hour') || text.includes('hours')) {
      subtasks.push('Initialize distraction-free environment');
      subtasks.push('Deep execution block');
      subtasks.push('Log progress and wrap up');
    } else {
      subtasks.push('Execute primary objective');
      subtasks.push('Verify completion against standards');
    }

    const xpReward = difficulty === 'C' ? 300 : difficulty === 'D' ? 150 : 80;
    const goldReward = difficulty === 'C' ? 100 : difficulty === 'D' ? 50 : 25;

    // Clean Title formatting
    let title = command.replace(/\.$/, '').trim();
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return {
      title: `[QUEST] ${title}`,
      description: `Target objective: "${command}". Complete with full focus.`,
      category,
      priority,
      difficulty,
      xpReward,
      goldReward,
      deadline,
      isMandatory,
      recurrence,
      subtasks,
      attributeRewards,
      confidenceScore: 94,
      rationale: `Extracted category [${category}], priority [${priority}], difficulty [${difficulty}-Rank] from command intent.`,
    };
  }

  private mockPerformanceAnalysis(
    analytics: AnalyticsSummary,
    profile: HunterProfile
  ): AIAdvisorAnalysisResponse {
    const healthScore = Math.min(
      100,
      Math.max(20, Math.round(analytics.weeklyCompletionRate * 0.7 + Math.min(10, analytics.currentStreakDays) * 3))
    );

    const strengths: string[] = [];
    const burnoutRisks: string[] = [];
    const tacticalRecommendations: string[] = [];

    if (analytics.currentStreakDays >= 3) {
      strengths.push(`Excellent consistency: ${analytics.currentStreakDays}-day streak active.`);
    }
    if (analytics.totalQuestsCompleted >= 5) {
      strengths.push(`Solid execution velocity with ${analytics.totalQuestsCompleted} completed objectives.`);
    } else {
      strengths.push('Early momentum building in progress.');
    }

    // Burnout risk analysis
    const intel = profile.attributes.intelligence || 10;
    const energy = profile.attributes.energy || 10;
    if (intel > energy + 8) {
      burnoutRisks.push('Cognitive load heavily exceeds Energy attribute. Sleep or recovery routines needed.');
    }
    if (analytics.mandatoryQuestsFailed > 0) {
      burnoutRisks.push(`${analytics.mandatoryQuestsFailed} mandatory task failure(s) recorded. Re-align schedule realism.`);
    }
    if (burnoutRisks.length === 0) {
      burnoutRisks.push('No acute burnout patterns detected. Workload appears sustainable.');
    }

    // Tactical recommendations
    if (analytics.weeklyCompletionRate < 70) {
      tacticalRecommendations.push('Lower daily quest volume by 20% to guarantee 100% completion rate.');
    }
    if (analytics.questsByCategory.FITNESS === 0) {
      tacticalRecommendations.push('Add a mandatory daily 20-minute physical quest to reinforce Strength & Energy.');
    }
    tacticalRecommendations.push('Execute highest priority quest in the first 2 hours of your wake cycle.');

    let suggestedFocusCategory: QuestCategory = 'CODING';
    if (energy < 15) suggestedFocusCategory = 'HEALTH';
    else if (profile.attributes.discipline < 15) suggestedFocusCategory = 'DISCIPLINE';

    return {
      healthScore,
      summary: `Hunter operational efficiency stands at ${healthScore}%. Current completion rate is ${analytics.weeklyCompletionRate}% across ${analytics.totalQuestsCompleted} finished objectives.`,
      strengths,
      burnoutRisks,
      tacticalRecommendations,
      suggestedFocusCategory,
      motivationalDirective: 'Discipline is the bridge between goals and monarch power. Do not compromise.',
    };
  }
}
