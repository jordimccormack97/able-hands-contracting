import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import adminRouter from "./admin";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
