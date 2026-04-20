import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import invoicesRouter from "./invoices";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(invoicesRouter);
router.use(settingsRouter);

export default router;
