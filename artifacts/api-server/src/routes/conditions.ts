import { Router, type IRouter, type Request, type Response } from "express";
import { CONDITIONS } from "../lib/conditions";

const router: IRouter = Router();

router.get(
  "/reference/conditions",
  (_req: Request, res: Response): void => {
    res.json(CONDITIONS);
  },
);

export default router;
