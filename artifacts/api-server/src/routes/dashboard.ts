import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  patientProfilesTable,
  recoveryPlansTable,
  trackingEntriesTable,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import type { PlanContent } from "../services/aiPlanGenerator";

const router: IRouter = Router();

function pickTodayActivities(plan: PlanContent | null): PlanContent["exercises"] {
  if (!plan) return [];
  return plan.exercises.slice(0, 3);
}

function buildNextActions(args: {
  hasProfile: boolean;
  hasPlan: boolean;
  hasCheckinToday: boolean;
}): string[] {
  const actions: string[] = [];
  if (!args.hasProfile) {
    actions.push("Complete onboarding so we can build your plan");
    return actions;
  }
  if (!args.hasPlan) {
    actions.push("Generate your personalized recovery plan");
  }
  if (!args.hasCheckinToday) {
    actions.push("Log today's check-in (pain + completed exercises)");
  }
  actions.push("Open chat if anything feels off — your assistant is here");
  return actions;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

router.get(
  "/patient/dashboard",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.auth!.userId;
    const [patient] = await db
      .select()
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.userId, userId));

    if (!patient) {
      res.json({
        hasProfile: false,
        hasPlan: false,
        streakDays: 0,
        latestPainScore: null,
        averagePainScore: null,
        averageAdherence: null,
        totalCheckins: 0,
        weeklyTrend: [],
        todaysActivities: [],
        nextActions: buildNextActions({
          hasProfile: false,
          hasPlan: false,
          hasCheckinToday: false,
        }),
      });
      return;
    }

    const [plan] = await db
      .select()
      .from(recoveryPlansTable)
      .where(eq(recoveryPlansTable.patientId, patient.id));

    const tracking = await db
      .select()
      .from(trackingEntriesTable)
      .where(eq(trackingEntriesTable.patientId, patient.id))
      .orderBy(desc(trackingEntriesTable.date))
      .limit(7);

    const ordered = [...tracking].reverse();
    const today = todayString();
    const hasCheckinToday = tracking.some((t) => t.date === today);

    const totalCheckinsRows = await db
      .select()
      .from(trackingEntriesTable)
      .where(eq(trackingEntriesTable.patientId, patient.id));

    const totalCheckins = totalCheckinsRows.length;
    const averagePainScore =
      totalCheckins === 0
        ? null
        : Number(
            (
              totalCheckinsRows.reduce((s, r) => s + r.painScore, 0) /
              totalCheckins
            ).toFixed(1),
          );
    const averageAdherence =
      totalCheckins === 0
        ? null
        : Math.round(
            totalCheckinsRows.reduce((s, r) => s + r.adherencePercent, 0) /
              totalCheckins,
          );

    let streak = 0;
    const dateSet = new Set(totalCheckinsRows.map((r) => r.date));
    const cursor = new Date();
    while (true) {
      const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      if (dateSet.has(ds)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({
      hasProfile: true,
      hasPlan: !!plan,
      streakDays: streak,
      latestPainScore: tracking[0]?.painScore ?? null,
      averagePainScore,
      averageAdherence,
      totalCheckins,
      weeklyTrend: ordered.map((t) => ({
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
      todaysActivities: pickTodayActivities(
        plan ? (plan.content as PlanContent) : null,
      ),
      nextActions: buildNextActions({
        hasProfile: true,
        hasPlan: !!plan,
        hasCheckinToday,
      }),
    });
  },
);

export default router;
