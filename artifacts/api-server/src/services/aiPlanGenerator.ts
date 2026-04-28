import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger";
import { getConditionLabel } from "../lib/conditions";

export interface PlanInput {
  conditionId: string;
  age: number;
  gender: string;
  symptoms: string;
  painLevel: number;
  medicalHistory: string;
}

export interface PlanContent {
  summary: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    durationMinutes: number;
    instructions: string;
  }>;
  lifestyleTips: string[];
  precautions: string[];
  weeklyPlan: Array<{ day: string; focus: string; activities: string[] }>;
}

const FALLBACK: PlanContent = {
  summary:
    "A balanced recovery plan focused on gentle mobility, gradual strengthening, and consistent self-monitoring. Adjust intensity based on your daily comfort.",
  exercises: [
    {
      name: "Diaphragmatic breathing",
      sets: 2,
      reps: 10,
      durationMinutes: 5,
      instructions:
        "Lie comfortably, place a hand on your belly, breathe in slowly through the nose for four counts and exhale for six. Helps regulate pain perception.",
    },
    {
      name: "Gentle mobility flow",
      sets: 2,
      reps: 8,
      durationMinutes: 8,
      instructions:
        "Move slowly through your full pain-free range. Stop if anything sharp shows up.",
    },
    {
      name: "Walking",
      sets: 1,
      reps: 1,
      durationMinutes: 15,
      instructions:
        "A relaxed flat-ground walk. Keep your breathing easy and your posture tall.",
    },
  ],
  lifestyleTips: [
    "Aim for 7–9 hours of sleep — recovery happens overnight.",
    "Drink water through the day; mild dehydration can amplify pain.",
    "Apply heat for stiffness and ice for swelling, 10–15 minutes at a time.",
    "Take short movement breaks every hour you sit.",
  ],
  precautions: [
    "Stop any exercise that causes sharp or shooting pain.",
    "If pain stays above 7/10 for more than 48 hours, contact your clinician.",
    "Don't skip rest days — they're part of the plan, not optional.",
  ],
  weeklyPlan: [
    {
      day: "Monday",
      focus: "Mobility and breathing",
      activities: ["Diaphragmatic breathing", "Gentle mobility flow", "10 min walk"],
    },
    {
      day: "Tuesday",
      focus: "Light strength",
      activities: ["Mobility flow", "Bodyweight strength circuit"],
    },
    {
      day: "Wednesday",
      focus: "Active recovery",
      activities: ["20 min walk", "Stretching"],
    },
    {
      day: "Thursday",
      focus: "Strength and balance",
      activities: ["Mobility flow", "Balance work", "Strength circuit"],
    },
    {
      day: "Friday",
      focus: "Cardio and breathing",
      activities: ["20 min walk", "Breathing practice"],
    },
    {
      day: "Saturday",
      focus: "Longer movement",
      activities: ["30 min walk or swim", "Stretching"],
    },
    {
      day: "Sunday",
      focus: "Rest and reflect",
      activities: ["Restorative stretching", "Journal how the week felt"],
    },
  ],
};

function isPlanContent(value: unknown): value is PlanContent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.summary === "string" &&
    Array.isArray(v.exercises) &&
    Array.isArray(v.lifestyleTips) &&
    Array.isArray(v.precautions) &&
    Array.isArray(v.weeklyPlan)
  );
}

export async function generatePlan(input: PlanInput): Promise<PlanContent> {
  const condition = getConditionLabel(input.conditionId);
  const prompt = `You are a senior physiotherapist designing a 7-day recovery plan.

Patient profile:
- Condition: ${condition}
- Age: ${input.age}
- Gender: ${input.gender}
- Current pain level (1-10): ${input.painLevel}
- Symptoms: ${input.symptoms}
- Medical history: ${input.medicalHistory}

Return ONLY a JSON object matching this exact shape:
{
  "summary": string (2-4 sentences, warm and reassuring),
  "exercises": [
    { "name": string, "sets": number, "reps": number, "durationMinutes": number, "instructions": string }
  ] (5-7 exercises tailored to the condition),
  "lifestyleTips": string[] (4-6 tips),
  "precautions": string[] (3-5 safety items),
  "weeklyPlan": [
    { "day": "Monday"|"Tuesday"|...|"Sunday", "focus": string, "activities": string[] }
  ] (exactly 7 entries, Monday through Sunday)
}

Rules:
- Calibrate intensity to the pain level (lower pain = more challenge).
- Respect medical history (skip contraindicated movements).
- Keep instructions actionable and one paragraph max.
- Never recommend medication or diagnosis.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You produce structured JSON recovery plans. Output only valid JSON, no commentary.",
        },
        { role: "user", content: prompt },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as unknown;
    if (isPlanContent(parsed)) return parsed;
    logger.warn({ raw }, "AI plan output failed shape check, using fallback");
    return FALLBACK;
  } catch (err) {
    logger.error({ err }, "Failed to generate AI plan, using fallback");
    return FALLBACK;
  }
}

const SYSTEM_CHAT_PROMPT = `You are a calm, encouraging recovery assistant for the RecoveryOS app.
- Patients use you to ask about their plan, pain, exercises, and general wellbeing.
- Keep replies short (2-5 sentences) and warm.
- You are NOT a doctor. For red flags (chest pain, numbness, fainting, fever) tell them to seek urgent care.
- Reference the patient's condition and plan when given to you.
- Never recommend specific medications or doses.`;

export async function generateChatReply(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  context: { conditionLabel: string; painLevel: number } | null,
): Promise<string> {
  try {
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system", content: SYSTEM_CHAT_PROMPT },
    ];
    if (context) {
      messages.push({
        role: "system",
        content: `Patient context: condition = ${context.conditionLabel}, baseline pain = ${context.painLevel}/10.`,
      });
    }
    for (const m of history) messages.push({ role: m.role, content: m.content });

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 600,
      messages,
    });
    return (
      completion.choices[0]?.message?.content?.trim() ||
      "I'm here. Could you share a little more about how you're feeling?"
    );
  } catch (err) {
    logger.error({ err }, "Chat reply generation failed");
    return "I'm having a hard time thinking right now — please try sending that again in a moment.";
  }
}
