import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import meRouter from "./me";
import onboardingRouter from "./onboarding";
import planRouter from "./plan";
import trackingRouter from "./tracking";
import dashboardRouter from "./dashboard";
import chatRouter from "./chat";
import conditionsRouter from "./conditions";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(meRouter);
router.use(onboardingRouter);
router.use(planRouter);
router.use(trackingRouter);
router.use(dashboardRouter);
router.use(chatRouter);
router.use(conditionsRouter);
router.use(adminRouter);

export default router;
