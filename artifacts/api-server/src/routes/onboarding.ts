import { Router, type IRouter, type Request, type Response } from "express";
import { SubmitOnboardingBody } from "@workspace/api-zod";
import { db, patientProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { setUserRole, ensureUserProfile } from "../lib/profile";
import { CONDITIONS, getConditionLabel } from "../lib/conditions";

const router: IRouter = Router();

function serialize(row: typeof patientProfilesTable.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    age: row.age,
    gender: row.gender,
    conditionId: row.conditionId,
    conditionLabel: getConditionLabel(row.conditionId),
    symptoms: row.symptoms,
    painLevel: row.painLevel,
    medicalHistory: row.medicalHistory,
    reportFileName: row.reportFileName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.post(
  "/onboarding",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = SubmitOnboardingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const data = parsed.data;
    if (!CONDITIONS.find((c) => c.id === data.conditionId)) {
      res.status(400).json({ error: "Unknown conditionId" });
      return;
    }

    const profile = await ensureUserProfile(req.auth!.userId);
    if (!profile.role) {
      await setUserRole(req.auth!.userId, "patient");
    }

    const values = {
      userId: req.auth!.userId,
      age: data.age,
      gender: data.gender,
      conditionId: data.conditionId,
      symptoms: data.symptoms,
      painLevel: data.painLevel,
      medicalHistory: data.medicalHistory,
      reportFileName: data.reportFileName ?? null,
    };

    const [row] = await db
      .insert(patientProfilesTable)
      .values(values)
      .onConflictDoUpdate({
        target: patientProfilesTable.userId,
        set: { ...values, updatedAt: new Date() },
      })
      .returning();

    res.json(serialize(row));
  },
);

router.get(
  "/patient/profile",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const [row] = await db
      .select()
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.userId, req.auth!.userId));
    if (!row) {
      res.status(404).json({ error: "No patient profile yet" });
      return;
    }
    res.json(serialize(row));
  },
);

export default router;
