import { Router, type IRouter } from "express";
import animalAnalysisRouter from "./animal-analysis";
import healthRouter from "./health";
import animalVideosRouter from "./animal-videos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(animalAnalysisRouter);
router.use(animalVideosRouter);

export default router;