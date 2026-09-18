import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DatabaseService } from './db/database.js';
import { AIService } from './services/ai/AIService.js';
import { createApiRouter } from './api/routes.js';
import { QuestEngine } from './core/quest/QuestEngine.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.json());

const db = new DatabaseService();
const ai = new AIService();

// Seed starter quests if empty
const existingQuests = db.getAllQuests();
if (existingQuests.length === 0) {
  const dailyQuest = QuestEngine.createQuest({
    title: '[DAILY QUEST] Getting Stronger - Physical Conditioning',
    description: 'Mandatory daily habit. Complete physical calibration to maintain hunter physical vessel.',
    category: 'FITNESS',
    priority: 'HIGH',
    difficulty: 'E',
    xpReward: 100,
    goldReward: 50,
    isMandatory: true,
    recurrence: 'DAILY',
    attributeRewards: { strength: 2, energy: 2, consistency: 2 },
    subtasks: [
      '100 Push-ups (or equivalent)',
      '100 Sit-ups',
      '100 Squats',
      '10km Run (or 30m cardio)',
    ],
  });

  const deepWorkQuest = QuestEngine.createQuest({
    title: '[MAIN QUEST] Deep Work Sprint: Architectural Mastery',
    description: 'Enter hyper-focus mode and complete a high-leverage knowledge work sprint without distractions.',
    category: 'CODING',
    priority: 'HIGH',
    difficulty: 'D',
    xpReward: 250,
    goldReward: 100,
    isMandatory: false,
    recurrence: 'ONE_TIME',
    attributeRewards: { intelligence: 3, focus: 3, productivity: 2 },
    subtasks: [
      'Zero notifications environment for 60 minutes',
      'Execute key milestone deliverable',
      'Review output and document progress',
    ],
  });

  const studyQuest = QuestEngine.createQuest({
    title: '[SIDE QUEST] Knowledge Synthesis: DBMS & Systems',
    description: 'Study database transactions, WAL logging, and query optimization patterns.',
    category: 'STUDY',
    priority: 'MEDIUM',
    difficulty: 'D',
    xpReward: 180,
    goldReward: 60,
    isMandatory: false,
    recurrence: 'ONE_TIME',
    attributeRewards: { intelligence: 2, discipline: 2 },
    subtasks: [
      'Review isolation levels (ACID)',
      'Solve 2 complex query problems',
      'Summarize key insights',
    ],
  });

  db.saveQuest(dailyQuest);
  db.saveQuest(deepWorkQuest);
  db.saveQuest(studyQuest);
}

// Mount API router
app.use('/api', createApiRouter(db, ai));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'SYSTEM_ONLINE',
    version: '2.0.0',
    mode: 'DETERMINISTIC_CORE',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`   [THE SYSTEM] ONLINE & OPERATIONAL    `);
  console.log(`   Backend API running on http://localhost:${PORT}`);
  console.log(`=========================================`);
});
