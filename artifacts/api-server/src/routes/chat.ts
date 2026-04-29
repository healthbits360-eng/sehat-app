import { Router, type IRouter, type Request, type Response } from "express";
import { SendMyChatMessageBody } from "@workspace/api-zod";
import {
  chatMessagesTable,
  db,
  patientProfilesTable,
} from "@workspace/db";
import { and, asc, eq, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { generateChatReply } from "../services/aiPlanGenerator";
import { getConditionLabel } from "../lib/conditions";

const router: IRouter = Router();

router.get(
  "/patient/chat",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const rows = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.userId, req.auth!.userId))
      .orderBy(asc(chatMessagesTable.createdAt))
      .limit(200);
    res.json(
      rows.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  },
);

router.post(
  "/patient/chat",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = SendMyChatMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    if (req.auth!.subscriptionTier === "free") {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const todayMessages = await db
        .select()
        .from(chatMessagesTable)
        .where(
          and(
            eq(chatMessagesTable.userId, req.auth!.userId),
            eq(chatMessagesTable.role, "user"),
            gte(chatMessagesTable.createdAt, since),
          ),
        );
      if (todayMessages.length >= 10) {
        res.status(402).json({
          error:
            "You've used your 10 free messages for today. Upgrade for unlimited chat.",
        });
        return;
      }
    }

    const [patient] = await db
      .select()
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.userId, req.auth!.userId));

    const history = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.userId, req.auth!.userId))
      .orderBy(asc(chatMessagesTable.createdAt))
      .limit(40);

    const [userRow] = await db
      .insert(chatMessagesTable)
      .values({
        userId: req.auth!.userId,
        role: "user",
        content: parsed.data.content,
      })
      .returning();

    const replyContent = await generateChatReply(
      [
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: parsed.data.content },
      ],
      patient
        ? {
            conditionLabel: getConditionLabel(patient.conditionId),
            painLevel: patient.painLevel,
          }
        : null,
      parsed.data.language ?? "en",
    );

    const [assistantRow] = await db
      .insert(chatMessagesTable)
      .values({
        userId: req.auth!.userId,
        role: "assistant",
        content: replyContent,
      })
      .returning();

    res.json({
      userMessage: {
        id: userRow.id,
        role: userRow.role,
        content: userRow.content,
        createdAt: userRow.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantRow.id,
        role: assistantRow.role,
        content: assistantRow.content,
        createdAt: assistantRow.createdAt.toISOString(),
      },
    });
  },
);

export default router;
