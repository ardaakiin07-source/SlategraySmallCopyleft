import { Router, type IRouter } from "express";
import animalAnalysisRouter from "./animal-analysis";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(animalAnalysisRouter);

export default router;
