import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  patientProfilesTable,
  recoveryPlansTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { generatePlan, type PlanContent, type SupportedLanguage } from "../services/aiPlanGenerator";

function pickLanguage(value: unknown): SupportedLanguage {
  return value === "hi" ? "hi" : "en";
}

const router: IRouter = Router();

function serialize(row: typeof recoveryPlansTable.$inferSelect) {
  return {
    id: row.id,
    patientId: row.patientId,
    content: row.content as PlanContent,
    generatedBy: row.generatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get(
  "/patient/plan",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const [patient] = await db
      .select()
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.userId, req.auth!.userId));
    if (!patient) {
      res.status(404).json({ error: "Complete onboarding first" });
      return;
    }
    const [plan] = await db
      .select()
      .from(recoveryPlansTable)
      .where(eq(recoveryPlansTable.patientId, patient.id));
    if (!plan) {
      res.status(404).json({ error: "No plan generated yet" });
      return;
    }
    res.json(serialize(plan));
  },
);

router.post(
  "/patient/plan/generate",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const [patient] = await db
      .select()
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.userId, req.auth!.userId));
    if (!patient) {
      res.status(400).json({ error: "Complete onboarding first" });
      return;
    }

    const [existing] = await db
      .select()
      .from(recoveryPlansTable)
      .where(eq(recoveryPlansTable.patientId, patient.id));

    if (existing && req.auth!.subscriptionTier === "free") {
      res.status(402).json({
        error:
          "Free plan only includes the initial recovery plan. Upgrade to regenerate.",
      });
      return;
    }

    const language = pickLanguage(
      (req.body as { language?: unknown } | undefined)?.language,
    );

    const content = await generatePlan(
      {
        conditionId: patient.conditionId,
        age: patient.age,
        gender: patient.gender,
        symptoms: patient.symptoms,
        painLevel: patient.painLevel,
        medicalHistory: patient.medicalHistory,
      },
      language,
    );

    if (existing) {
      const [updated] = await db
        .update(recoveryPlansTable)
        .set({
          content: content as unknown as Record<string, unknown>,
          generatedBy: "ai",
          updatedAt: new Date(),
        })
        .where(eq(recoveryPlansTable.id, existing.id))
        .returning();
      res.json(serialize(updated));
      return;
    }

    const [created] = await db
      .insert(recoveryPlansTable)
      .values({
        patientId: patient.id,
        content: content as unknown as Record<string, unknown>,
        generatedBy: "ai",
      })
      .returning();
    res.json(serialize(created));
  },
);

export default router;
