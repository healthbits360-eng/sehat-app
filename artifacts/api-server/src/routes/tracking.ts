import { Router, type IRouter, type Request, type Response } from "express";
import { UpsertMyTrackingEntryBody } from "@workspace/api-zod";
import {
  db,
  patientProfilesTable,
  trackingEntriesTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function serialize(row: typeof trackingEntriesTable.$inferSelect) {
  return {
    id: row.id,
    patientId: row.patientId,
    date: row.date,
    painScore: row.painScore,
    completedExercises: row.completedExercises,
    totalExercises: row.totalExercises,
    adherencePercent: row.adherencePercent,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

router.get(
  "/patient/tracking",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const [patient] = await db
      .select()
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.userId, req.auth!.userId));
    if (!patient) {
      res.json([]);
      return;
    }
    const limitRaw = Array.isArray(req.query.limit)
      ? req.query.limit[0]
      : req.query.limit;
    const limit = Math.min(
      Math.max(parseInt(typeof limitRaw === "string" ? limitRaw : "30", 10) || 30, 1),
      90,
    );
    const rows = await db
      .select()
      .from(trackingEntriesTable)
      .where(eq(trackingEntriesTable.patientId, patient.id))
      .orderBy(desc(trackingEntriesTable.date))
      .limit(limit);
    res.json(rows.map(serialize));
  },
);

router.post(
  "/patient/tracking",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = UpsertMyTrackingEntryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [patient] = await db
      .select()
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.userId, req.auth!.userId));
    if (!patient) {
      res.status(400).json({ error: "Complete onboarding first" });
      return;
    }

    const total = parsed.data.totalExercises;
    const completed = parsed.data.completedExercises;
    const adherence =
      total > 0 ? Math.round((Math.min(completed, total) / total) * 100) : 0;
    const date = todayString();

    const [existing] = await db
      .select()
      .from(trackingEntriesTable)
      .where(
        and(
          eq(trackingEntriesTable.patientId, patient.id),
          eq(trackingEntriesTable.date, date),
        ),
      );

    if (existing) {
      const [updated] = await db
        .update(trackingEntriesTable)
        .set({
          painScore: parsed.data.painScore,
          completedExercises: completed,
          totalExercises: total,
          adherencePercent: adherence,
          notes: parsed.data.notes,
        })
        .where(eq(trackingEntriesTable.id, existing.id))
        .returning();
      res.json(serialize(updated));
      return;
    }

    const [created] = await db
      .insert(trackingEntriesTable)
      .values({
        patientId: patient.id,
        date,
        painScore: parsed.data.painScore,
        completedExercises: completed,
        totalExercises: total,
        adherencePercent: adherence,
        notes: parsed.data.notes,
      })
      .returning();
    res.json(serialize(created));
  },
);

export default router;
