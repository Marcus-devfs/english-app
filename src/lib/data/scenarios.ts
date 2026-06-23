import type { LearningGoal } from "@/types";
import { GOAL_LABELS } from "@/types";

export interface RolePlayScenario {
  id: string;
  goal: LearningGoal | "all";
  title: string;
  description: string;
  setting: string;
  aiRole: string;
  studentRole: string;
  openingLine: string;
}

export const ROLEPLAY_SCENARIOS: RolePlayScenario[] = [
  {
    id: "standup",
    goal: "tech_career",
    title: "Daily stand-up",
    description: "Pratique o que você fez ontem e o que vai fazer hoje.",
    setting: "Remote team stand-up meeting",
    aiRole: "Scrum Master facilitating the stand-up",
    studentRole: "Software developer on the team",
    openingLine: "Good morning! You're up. What did you work on yesterday?",
  },
  {
    id: "airport",
    goal: "travel",
    title: "No aeroporto",
    description: "Check-in e perguntas no balcão.",
    setting: "Airport check-in counter",
    aiRole: "Airline staff member",
    studentRole: "Traveler checking in for a flight",
    openingLine: "Good afternoon! May I see your passport and booking reference?",
  },
  {
    id: "meeting",
    goal: "business",
    title: "Reunião de projeto",
    description: "Apresente uma ideia em uma reunião.",
    setting: "Weekly project sync with international clients",
    aiRole: "Project manager",
    studentRole: "Team member presenting an update",
    openingLine: "Thanks for joining. Can you walk us through your progress this week?",
  },
  {
    id: "interview-intro",
    goal: "career_abroad",
    title: "Entrevista: tell me about yourself",
    description: "A pergunta clássica de entrevistas internacionais.",
    setting: "Job interview for an international company",
    aiRole: "Hiring manager",
    studentRole: "Job candidate",
    openingLine: "Thanks for coming in today. Tell me a bit about yourself.",
  },
  {
    id: "coffee-chat",
    goal: "conversation",
    title: "Conversa casual",
    description: "Small talk em um café.",
    setting: "Coffee shop meeting a new colleague",
    aiRole: "Friendly colleague",
    studentRole: "New team member",
    openingLine: "Hey! I don't think we've met. How's your first week going?",
  },
  {
    id: "presentation",
    goal: "academic",
    title: "Apresentação acadêmica",
    description: "Introduza seu tema de pesquisa.",
    setting: "University seminar presentation",
    aiRole: "Professor moderating Q&A",
    studentRole: "Graduate student presenting research",
    openingLine: "Please introduce your research topic to the class.",
  },
];

export function getScenariosForGoal(goal: LearningGoal): RolePlayScenario[] {
  return ROLEPLAY_SCENARIOS.filter((s) => s.goal === goal || s.goal === "all");
}

export function getScenarioById(id: string): RolePlayScenario | undefined {
  return ROLEPLAY_SCENARIOS.find((s) => s.id === id);
}

export function buildRolePlayPrompt(scenario: RolePlayScenario): string {
  return `You are role-playing in a scenario for an English learner.

Scenario: ${scenario.title} (${GOAL_LABELS[scenario.goal as LearningGoal] ?? scenario.goal})
Setting: ${scenario.setting}
Your role: ${scenario.aiRole}
Student's role: ${scenario.studentRole}

Rules:
- Stay in character throughout the conversation
- Use English appropriate for the scenario
- Correct the student's mistakes gently in Portuguese at the end of your response if needed
- Keep responses under 100 words
- Ask follow-up questions to keep the role-play going
- Start with: "${scenario.openingLine}"`;
}
