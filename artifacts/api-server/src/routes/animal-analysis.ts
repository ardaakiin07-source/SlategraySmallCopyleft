import { Router, type IRouter } from "express";
import multer from "multer";

const router: IRouter = Router();

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const VALID_ANIMAL_IDS = new Set(["dog", "cat", "cow", "chicken", "sheep", "goat"]);

const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

router.post(
  "/animal-analysis",
  (req, res, next) => {
    uploadAudio.single("audio")(req, res, (error) => {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "FILE_TOO_LARGE" });
        return;
      }

      if (error) {
        res.status(400).json({ error: "INVALID_FILE_TYPE" });
        return;
      }

      next();
    });
  },
  (req, res) => {
    const animalId = typeof req.body?.animalId === "string" ? req.body.animalId : "";
    const locale = typeof req.body?.locale === "string" ? req.body.locale : "";

    if (!VALID_ANIMAL_IDS.has(animalId)) {
      res.status(400).json({ error: "INVALID_ANIMAL" });
      return;
    }

    if (locale !== "tr") {
      res.status(400).json({ error: "INVALID_LOCALE" });
      return;
    }

    if (!req.file || !req.file.mimetype.toLowerCase().startsWith("audio/")) {
      res.status(400).json({ error: "INVALID_FILE_TYPE" });
      return;
    }

    res.status(200).json({
      analysisId: "test-id-123",
      animalId,
      interpretation: "Bu geçici bir test yanıtıdır, gerçek AI analizi henüz bağlanmadı.",
      mood: "test",
      createdAt: new Date().toISOString(),
    });
  },
);

export default router;