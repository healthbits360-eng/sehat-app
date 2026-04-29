import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger";
import { getConditionLabel } from "../lib/conditions";

export type SupportedLanguage = "en" | "hi";

export interface PlanInput {
  conditionId: string;
  age: number;
  gender: string;
  symptoms: string;
  painLevel: number;
  medicalHistory: string;
}

const HINDI_PLAN_INSTRUCTIONS = `STRICT LANGUAGE RULE — RESPOND ONLY IN SIMPLE HINDI. DO NOT USE ENGLISH.
- Every string value (summary, exercise names, instructions, lifestyle tips, precautions, weekly focus, activities) MUST be written in simple Hindi using Latin script (Hinglish), the way a rural patient with no English background would speak.
- Use very easy everyday words like: "dard" (pain), "saans lena" (breathing), "aasan vyayam" (easy exercise), "aaram" (rest), "paani" (water), "neend" (sleep), "chalna" (walking), "halka" (light/gentle), "garam paani" (warm water), "thoda" (a little), "roz" (daily).
- Keep sentences SHORT and CLEAR. Avoid ALL technical medical terms. No Sanskrit. No English words except where unavoidable (like "minute" or proper nouns).
- ONLY two exceptions, which MUST stay in English: the "day" field values ("Monday".."Sunday"), and numeric fields (sets, reps, durationMinutes).
- DO NOT mix English sentences with Hindi. If you write any English sentence in a value field, your output will be REJECTED.
Example summary (this is the style required): "Aapke liye yeh 7 din ka aasan plan hai. Roz thoda chalna, halki vyayam aur achhi neend zaruri hai. Dard badhe to ruk jaayein aur aaram karein."`;

const HINDI_CHAT_INSTRUCTIONS = `STRICT LANGUAGE RULE — RESPOND ONLY IN SIMPLE HINDI. DO NOT USE ENGLISH.
- Reply in simple Hindi using Latin script (Hinglish), the way a rural user with no English background would speak.
- Use very easy everyday words: "dard", "saans", "aaram", "paani", "neend", "halka vyayam", "garam paani", "thoda", "roz".
- Short sentences. 2-4 sentences total. No technical medical terms. No Sanskrit. No English.
- Warm and encouraging. Example: "Aapka dard kam ho raha hai, yeh achhi baat hai. Aaj halki walk karein aur paani peete rahein."`;

const HINDI_SYSTEM_GUARD =
  "You are a Hindi-only assistant. The user has set their language to Hindi. " +
  "EVERY user-visible string MUST be in simple Latin-script Hindi (Hinglish). " +
  "Never reply in English. Never mix in English sentences.";

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

const FALLBACK_HI: PlanContent = {
  summary:
    "Yeh ek halka aur sahaj recovery plan hai. Roz thoda chalna, aasan vyayam aur achhi neend par dhyan dein. Dard badhe to ruk jaayein aur aaram karein.",
  exercises: [
    {
      name: "Gehri saans (Diaphragmatic breathing)",
      sets: 2,
      reps: 10,
      durationMinutes: 5,
      instructions:
        "Aaram se letein, ek haath pet par rakhein. Naak se 4 ginti tak saans lein, phir 6 ginti tak chhodein. Yeh dard kam karne mein madad karta hai.",
    },
    {
      name: "Halki mobility flow",
      sets: 2,
      reps: 8,
      durationMinutes: 8,
      instructions:
        "Apne sharir ko dheere-dheere ghoomayein, sirf utna jitna bina dard ke ho. Tej dard ho to ruk jaayein.",
    },
    {
      name: "Chalna",
      sets: 1,
      reps: 1,
      durationMinutes: 15,
      instructions:
        "Samtal jagah par aaram se chalein. Saans normal rakhein aur seedha khade rahein.",
    },
  ],
  lifestyleTips: [
    "Roz 7-9 ghante ki neend lein — recovery raat ko hoti hai.",
    "Din bhar paani peete rahein; kam paani se dard badh sakta hai.",
    "Akadan ke liye garam, sujan ke liye thanda 10-15 minute lagayein.",
    "Har ghante mein thoda uthkar movement karein.",
  ],
  precautions: [
    "Tej ya chubhne wala dard ho to vyayam turant rok dein.",
    "Agar dard 7/10 se zyada 48 ghante tak rahe to doctor se baat karein.",
    "Aaram ke din mat chhodein — woh bhi plan ka hissa hain.",
  ],
  weeklyPlan: [
    {
      day: "Monday",
      focus: "Mobility aur saans",
      activities: ["Gehri saans", "Halki mobility flow", "10 min walk"],
    },
    {
      day: "Tuesday",
      focus: "Halki strength",
      activities: ["Mobility flow", "Bodyweight strength circuit"],
    },
    {
      day: "Wednesday",
      focus: "Active recovery",
      activities: ["20 min walk", "Stretching"],
    },
    {
      day: "Thursday",
      focus: "Strength aur balance",
      activities: ["Mobility flow", "Balance work", "Strength circuit"],
    },
    {
      day: "Friday",
      focus: "Cardio aur saans",
      activities: ["20 min walk", "Saans ki practice"],
    },
    {
      day: "Saturday",
      focus: "Lambi movement",
      activities: ["30 min walk ya swim", "Stretching"],
    },
    {
      day: "Sunday",
      focus: "Aaram aur sochna",
      activities: ["Halki stretching", "Hafte ke baare mein sochein"],
    },
  ],
};

export async function generatePlan(
  input: PlanInput,
  language: SupportedLanguage = "en",
): Promise<PlanContent> {
  const condition = getConditionLabel(input.conditionId);
  const fallback = language === "hi" ? FALLBACK_HI : FALLBACK;
  const languageBlock = language === "hi" ? `\n\n${HINDI_PLAN_INSTRUCTIONS}` : "";
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
- Never recommend medication or diagnosis.${languageBlock}`;

  try {
    const systemMessages: Array<{ role: "system"; content: string }> = [
      {
        role: "system",
        content:
          "You produce structured JSON recovery plans. Output only valid JSON, no commentary.",
      },
    ];
    if (language === "hi") {
      systemMessages.push({ role: "system", content: HINDI_SYSTEM_GUARD });
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [...systemMessages, { role: "user", content: prompt }],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as unknown;
    if (!isPlanContent(parsed)) {
      logger.warn({ raw, language }, "AI plan output failed shape check, using fallback");
      return fallback;
    }
    if (language === "hi" && planLooksEnglish(parsed)) {
      logger.warn({ language }, "Hindi plan output still contains English, translating");
      const translated = await translatePlanToHindi(parsed);
      return translated ?? fallback;
    }
    return parsed;
  } catch (err) {
    logger.error({ err, language }, "Failed to generate AI plan, using fallback");
    return fallback;
  }
}

const ENGLISH_MARKERS = /\b(the|and|with|your|please|exercise|breathing|recovery|pain|minutes|seconds|sets|reps|daily|weekly|focus|gentle|strength|mobility|walking|stretching|posture|patient|rest|water|sleep|hours|times|repeat|hold|days?|week|level|movement|activity|activities|tip|tips|precaution|safe|safely|comfortable|advised|recommend|recommended|please|consult|doctor|do not|don't|avoid|caution|important|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;

function isEnglishHeavy(text: string): boolean {
  if (!text) return false;
  const matches = text.match(ENGLISH_MARKERS);
  return (matches?.length ?? 0) >= 3;
}

function planLooksEnglish(plan: PlanContent): boolean {
  // Concatenate all user-visible strings except day names (which must stay English).
  const parts: string[] = [
    plan.summary,
    ...plan.exercises.flatMap((e) => [e.name, e.instructions]),
    ...plan.lifestyleTips,
    ...plan.precautions,
    ...plan.weeklyPlan.flatMap((d) => [d.focus, ...d.activities]),
  ];
  return isEnglishHeavy(parts.join(" \n "));
}

async function translatePlanToHindi(plan: PlanContent): Promise<PlanContent | null> {
  const prompt = `Translate every string value in this JSON recovery plan into SIMPLE Latin-script Hindi (Hinglish) that a rural patient can understand. Use easy words like "dard", "saans", "aaram", "paani", "neend", "halka vyayam", "thoda", "roz". Keep sentences short. No technical medical terms. No Sanskrit.

STRICT RULES:
- Output ONLY the JSON object, same shape as input.
- The "day" field values MUST stay in English ("Monday".."Sunday").
- Numbers (sets, reps, durationMinutes) MUST stay numeric and unchanged.
- Translate everything else: summary, exercise name, exercise instructions, lifestyleTips, precautions, weekly focus, weekly activities.

Input JSON:
${JSON.stringify(plan)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: HINDI_SYSTEM_GUARD },
        {
          role: "system",
          content:
            "You translate JSON content into simple Hindi while preserving the JSON shape exactly. Output ONLY valid JSON.",
        },
        { role: "user", content: prompt },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as unknown;
    if (isPlanContent(parsed)) return parsed;
    return null;
  } catch (err) {
    logger.error({ err }, "Hindi translation pass failed");
    return null;
  }
}

const SYSTEM_CHAT_PROMPT = `You are a calm, encouraging recovery assistant for the Sehat app.
- Patients use you to ask about their plan, pain, exercises, and general wellbeing.
- Keep replies short (2-5 sentences) and warm.
- You are NOT a doctor. For red flags (chest pain, numbness, fainting, fever) tell them to seek urgent care.
- Reference the patient's condition and plan when given to you.
- Never recommend specific medications or doses.`;

export async function generateChatReply(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  context: { conditionLabel: string; painLevel: number } | null,
  language: SupportedLanguage = "en",
): Promise<string> {
  const fallback =
    language === "hi"
      ? "Abhi soch nahi pa raha hoon — thodi der mein phir se bhejein."
      : "I'm having a hard time thinking right now — please try sending that again in a moment.";
  const empty =
    language === "hi"
      ? "Main yahan hoon. Thoda aur bataiye, kaisa lag raha hai?"
      : "I'm here. Could you share a little more about how you're feeling?";

  try {
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: SYSTEM_CHAT_PROMPT }];
    if (language === "hi") {
      messages.push({ role: "system", content: HINDI_SYSTEM_GUARD });
      messages.push({ role: "system", content: HINDI_CHAT_INSTRUCTIONS });
    }
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
    let reply = completion.choices[0]?.message?.content?.trim() || empty;

    if (language === "hi" && isEnglishHeavy(reply)) {
      logger.warn({ language }, "Hindi chat reply contains English, translating");
      const translated = await translateTextToHindi(reply);
      if (translated) reply = translated;
    }

    return reply;
  } catch (err) {
    logger.error({ err, language }, "Chat reply generation failed");
    return fallback;
  }
}

async function translateTextToHindi(text: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 600,
      messages: [
        { role: "system", content: HINDI_SYSTEM_GUARD },
        {
          role: "system",
          content:
            "Translate the user's message into simple Latin-script Hindi (Hinglish). Use easy everyday words like dard, saans, aaram, paani, neend. Keep it short and warm. Output ONLY the translated text, nothing else.",
        },
        { role: "user", content: text },
      ],
    });
    const out = completion.choices[0]?.message?.content?.trim();
    return out || null;
  } catch (err) {
    logger.error({ err }, "Hindi text translation failed");
    return null;
  }
}
