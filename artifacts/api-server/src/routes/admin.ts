import { Router, type IRouter, type Request, type Response } from "express";
import {
  CreateAdminPatientNoteBody,
  UpdateAdminPatientPlanBody,
} from "@workspace/api-zod";
import {
  chatMessagesTable as _chatMessagesTable,
  clinicianNotesTable,
  db,
  patientProfilesTable,
  recoveryPlansTable,
  trackingEntriesTable,
  usersTable,
} from "@workspace/db";
import { and, desc, eq, gte, ilike, or } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../middlewares/requireAuth";
import { getConditionLabel } from "../lib/conditions";
import type { PlanContent } from "../services/aiPlanGenerator";

const router: IRouter = Router();

function displayName(
  user: typeof usersTable.$inferSelect | undefined,
): string {
  if (!user) return "Unknown";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (user.email) return user.email.split("@")[0];
  return "Patient";
}

router.get(
  "/admin/dashboard",
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    const patients = await db.select().from(patientProfilesTable);
    const tracking = await db.select().from(trackingEntriesTable);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await db
      .select()
      .from(trackingEntriesTable)
      .where(gte(trackingEntriesTable.createdAt, since))
      .orderBy(desc(trackingEntriesTable.createdAt))
      .limit(15);

    const activeIds = new Set(recent.map((r) => r.patientId));

    const totalCheckins = tracking.length;
    const averagePainScore =
      totalCheckins === 0
        ? null
        : Number(
            (
              tracking.reduce((s, r) => s + r.painScore, 0) / totalCheckins
            ).toFixed(1),
          );
    const averageAdherence =
      totalCheckins === 0
        ? null
        : Math.round(
            tracking.reduce((s, r) => s + r.adherencePercent, 0) /
              totalCheckins,
          );

    const conditionMap = new Map<string, number>();
    for (const p of patients) {
      const label = getConditionLabel(p.conditionId);
      conditionMap.set(label, (conditionMap.get(label) ?? 0) + 1);
    }

    const patientById = new Map(patients.map((p) => [p.id, p]));
    const userIds = patients.map((p) => p.userId);
    const userRows = userIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(or(...userIds.map((id) => eq(usersTable.id, id))))
      : [];
    const userById = new Map(userRows.map((u) => [u.id, u]));

    res.json({
      totalPatients: patients.length,
      activePatientsLast7Days: activeIds.size,
      averagePainScore,
      averageAdherence,
      conditionBreakdown: Array.from(conditionMap.entries()).map(
        ([conditionLabel, count]) => ({ conditionLabel, count }),
      ),
      recentCheckins: recent.map((r) => {
        const p = patientById.get(r.patientId);
        const u = p ? userById.get(p.userId) : undefined;
        return {
          patientId: r.patientId,
          displayName: displayName(u),
          conditionLabel: p ? getConditionLabel(p.conditionId) : "—",
          painScore: r.painScore,
          adherencePercent: r.adherencePercent,
          date: r.date,
        };
      }),
    });
  },
);

router.get(
  "/admin/patients",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const q =
      typeof req.query.q === "string" ? req.query.q.trim() : "";
    const condition =
      typeof req.query.condition === "string" ? req.query.condition : "";

    let patients = await db.select().from(patientProfilesTable);
    if (condition) {
      patients = patients.filter((p) => p.conditionId === condition);
    }

    const userIds = patients.map((p) => p.userId);
    const userRows = userIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(or(...userIds.map((id) => eq(usersTable.id, id))))
      : [];
    const userById = new Map(userRows.map((u) => [u.id, u]));

    const patientIds = patients.map((p) => p.id);
    const tracking = patientIds.length
      ? await db
          .select()
          .from(trackingEntriesTable)
          .where(or(...patientIds.map((id) => eq(trackingEntriesTable.patientId, id))))
          .orderBy(desc(trackingEntriesTable.createdAt))
      : [];
    const latestByPatient = new Map<string, typeof tracking[number]>();
    for (const t of tracking) {
      if (!latestByPatient.has(t.patientId)) latestByPatient.set(t.patientId, t);
    }

    const plans = patientIds.length
      ? await db
          .select()
          .from(recoveryPlansTable)
          .where(or(...patientIds.map((id) => eq(recoveryPlansTable.patientId, id))))
      : [];
    const planByPatient = new Set(plans.map((p) => p.patientId));

    let rows = patients.map((p) => {
      const u = userById.get(p.userId);
      const latest = latestByPatient.get(p.id);
      return {
        patientId: p.id,
        userId: p.userId,
        displayName: displayName(u),
        email: u?.email ?? null,
        conditionLabel: getConditionLabel(p.conditionId),
        painLevel: p.painLevel,
        latestPainScore: latest?.painScore ?? null,
        latestAdherence: latest?.adherencePercent ?? null,
        lastCheckinAt: latest?.createdAt.toISOString() ?? null,
        hasPlan: planByPatient.has(p.id),
        createdAt: p.createdAt.toISOString(),
      };
    });

    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.displayName.toLowerCase().includes(needle) ||
          (r.email ?? "").toLowerCase().includes(needle) ||
          r.conditionLabel.toLowerCase().includes(needle),
      );
    }

    rows.sort(
      (a, b) =>
        new Date(b.lastCheckinAt ?? b.createdAt).getTime() -
        new Date(a.lastCheckinAt ?? a.createdAt).getTime(),
    );
    res.json(rows);
  },
);

router.get(
  "/admin/patients/:patientId",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params.patientId;
    const patientId = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!patientId) {
      res.status(400).json({ error: "patientId required" });
      return;
    }
    const [patient] = await db
      .select()
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.id, patientId));
    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, patient.userId));
    const [plan] = await db
      .select()
      .from(recoveryPlansTable)
      .where(eq(recoveryPlansTable.patientId, patient.id));
    const recentTracking = await db
      .select()
      .from(trackingEntriesTable)
      .where(eq(trackingEntriesTable.patientId, patient.id))
      .orderBy(desc(trackingEntriesTable.date))
      .limit(14);
    const notes = await db
      .select()
      .from(clinicianNotesTable)
      .where(eq(clinicianNotesTable.patientId, patient.id))
      .orderBy(desc(clinicianNotesTable.createdAt));

    const noteAuthorIds = Array.from(new Set(notes.map((n) => n.authorId)));
    const noteAuthors = noteAuthorIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(or(...noteAuthorIds.map((id) => eq(usersTable.id, id))))
      : [];
    const authorById = new Map(noteAuthors.map((u) => [u.id, u]));

    res.json({
      profile: {
        id: patient.id,
        userId: patient.userId,
        age: patient.age,
        gender: patient.gender,
        conditionId: patient.conditionId,
        conditionLabel: getConditionLabel(patient.conditionId),
        symptoms: patient.symptoms,
        painLevel: patient.painLevel,
        medicalHistory: patient.medicalHistory,
        reportFileName: patient.reportFileName,
        createdAt: patient.createdAt.toISOString(),
        updatedAt: patient.updatedAt.toISOString(),
      },
      user: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          }
        : null,
      plan: plan
        ? {
            id: plan.id,
            patientId: plan.patientId,
            content: plan.content as PlanContent,
            generatedBy: plan.generatedBy,
            createdAt: plan.createdAt.toISOString(),
            updatedAt: plan.updatedAt.toISOString(),
          }
        : null,
      recentTracking: recentTracking.map((t) => ({
        id: t.id,
        patientId: t.patientId,
        date: t.date,
        painScore: t.painScore,
        completedExercises: t.completedExercises,
        totalExercises: t.totalExercises,
        adherencePercent: t.adherencePercent,
        notes: t.notes,
        createdAt: t.createdAt.toISOString(),
      })),
      notes: notes.map((n) => ({
        id: n.id,
        patientId: n.patientId,
        authorId: n.authorId,
        authorName: displayName(authorById.get(n.authorId)),
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  },
);

router.put(
  "/admin/patients/:patientId/plan",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params.patientId;
    const patientId = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!patientId) {
      res.status(400).json({ error: "patientId required" });
      return;
    }
    const parsed = UpdateAdminPatientPlanBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [patient] = await db
      .select()
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.id, patientId));
    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }
    const content = parsed.data as unknown as Record<string, unknown>;
    const [existing] = await db
      .select()
      .from(recoveryPlansTable)
      .where(eq(recoveryPlansTable.patientId, patient.id));
    let row;
    if (existing) {
      [row] = await db
        .update(recoveryPlansTable)
        .set({ content, generatedBy: "admin", updatedAt: new Date() })
        .where(eq(recoveryPlansTable.id, existing.id))
        .returning();
    } else {
      [row] = await db
        .insert(recoveryPlansTable)
        .values({ patientId: patient.id, content, generatedBy: "admin" })
        .returning();
    }
    res.json({
      id: row.id,
      patientId: row.patientId,
      content: row.content as PlanContent,
      generatedBy: row.generatedBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  },
);

router.get(
  "/admin/patients/:patientId/notes",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params.patientId;
    const patientId = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!patientId) {
      res.status(400).json({ error: "patientId required" });
      return;
    }
    const notes = await db
      .select()
      .from(clinicianNotesTable)
      .where(eq(clinicianNotesTable.patientId, patientId))
      .orderBy(desc(clinicianNotesTable.createdAt));

    const authorIds = Array.from(new Set(notes.map((n) => n.authorId)));
    const authors = authorIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(or(...authorIds.map((id) => eq(usersTable.id, id))))
      : [];
    const byId = new Map(authors.map((u) => [u.id, u]));

    res.json(
      notes.map((n) => ({
        id: n.id,
        patientId: n.patientId,
        authorId: n.authorId,
        authorName: displayName(byId.get(n.authorId)),
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      })),
    );
  },
);

router.post(
  "/admin/patients/:patientId/notes",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params.patientId;
    const patientId = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!patientId) {
      res.status(400).json({ error: "patientId required" });
      return;
    }
    const parsed = CreateAdminPatientNoteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [patient] = await db
      .select()
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.id, patientId));
    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }
    const [row] = await db
      .insert(clinicianNotesTable)
      .values({
        patientId,
        authorId: req.auth!.userId,
        content: parsed.data.content,
      })
      .returning();
    const [author] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, row.authorId));
    res.json({
      id: row.id,
      patientId: row.patientId,
      authorId: row.authorId,
      authorName: displayName(author),
      content: row.content,
      createdAt: row.createdAt.toISOString(),
    });
  },
);

void ilike;

export default router;
