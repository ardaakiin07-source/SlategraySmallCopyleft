import { Router, type IRouter, type Request } from "express";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import multer from "multer";

const router: IRouter = Router();

// ---- AYARLAR ----
const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // en fazla 15 MB (yaklaşık 30 saniyelik video)
const GEMINI_MODEL = "gemini-3.6-flash"; // ses analizindeki modelle aynı olmalı
const GEMINI_TIMEOUT_MS = 60_000;
const REPORTS_TO_HIDE = 1; // kaç bildirimde video otomatik gizlensin
const MAX_VIDEOS_IN_FEED = 50;
// -----------------

const DATA_DIR = path.resolve(process.cwd(), "video-data");
const FILES_DIR = path.join(DATA_DIR, "files");
const DB_FILE = path.join(DATA_DIR, "videos.json");

type VideoRecord = {
  id: string;
  fileName: string;
  animal: "cat" | "dog";
  createdAt: string;
  ownerDeviceId: string;
  likes: string[];
  reports: string[];
  hidden: boolean;
};

type VideoCheck = {
  animal: "cat" | "dog" | "other" | "none";
  inappropriate: boolean;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

// ---------- Basit kayıt sistemi (dosyaya yazar) ----------
let videos: VideoRecord[] = [];
let loaded: Promise<void> | null = null;
let saveChain: Promise<void> = Promise.resolve();

function ensureLoaded(): Promise<void> {
  if (!loaded) {
    loaded = (async () => {
      await fs.mkdir(FILES_DIR, { recursive: true });
      try {
        const raw = await fs.readFile(DB_FILE, "utf8");
        videos = JSON.parse(raw) as VideoRecord[];
      } catch {
        videos = [];
      }
    })();
  }
  return loaded;
}

function persist(): Promise<void> {
  const snapshot = JSON.stringify(videos);
  saveChain = saveChain
    .then(async () => {
      const tmp = `${DB_FILE}.tmp`;
      await fs.writeFile(tmp, snapshot);
      await fs.rename(tmp, DB_FILE);
    })
    .catch((error: unknown) => {
      console.error(
        "Video database save failed:",
        error instanceof Error ? error.message : "unknown error",
      );
    });
  return saveChain;
}

// ---------- Yardımcılar ----------
function getDeviceId(req: Request): string | null {
  const raw = req.header("x-device-id");
  if (!raw || !/^[A-Za-z0-9_-]{8,100}$/.test(raw)) return null;
  return raw;
}

function extensionFor(mimeType: string): string {
  const type = mimeType.toLowerCase();
  if (type.includes("quicktime")) return ".mov";
  if (type.includes("webm")) return ".webm";
  if (type.includes("3gpp")) return ".3gp";
  return ".mp4";
}

function toPublic(video: VideoRecord, deviceId: string | null) {
  return {
    id: video.id,
    url: `/api/videos/${video.id}/file`,
    animal: video.animal,
    createdAt: video.createdAt,
    likeCount: video.likes.length,
    likedByMe: deviceId ? video.likes.includes(deviceId) : false,
  };
}

// ---------- Gemini ile kedi/köpek kontrolü ----------
const CHECK_PROMPT = `Bu videoyu incele ve yalnızca geçerli JSON döndür, markdown kullanma.

"animal": Videonun ana konusu bir kedi ise "cat", bir köpek ise "dog",
başka bir hayvan ise "other", videoda hiç hayvan yoksa "none".

"inappropriate": Videoda şiddet, hayvana kötü muamele, çıplaklık, cinsel içerik,
nefret söylemi veya başka uygunsuz bir içerik varsa true, yoksa false.`;

async function checkVideoWithGemini(video: Express.Multer.File): Promise<VideoCheck> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: CHECK_PROMPT },
                {
                  inline_data: {
                    mime_type: video.mimetype,
                    data: video.buffer.toString("base64"),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                animal: { type: "STRING", enum: ["cat", "dog", "other", "none"] },
                inappropriate: { type: "BOOLEAN" },
              },
              required: ["animal", "inappropriate"],
            },
            maxOutputTokens: 1024,
          },
        }),
        signal: controller.signal,
      },
    );

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const data = JSON.parse(body) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    const parsed = JSON.parse(text) as { animal?: unknown; inappropriate?: unknown };
    if (
      (parsed.animal !== "cat" &&
        parsed.animal !== "dog" &&
        parsed.animal !== "other" &&
        parsed.animal !== "none") ||
      typeof parsed.inappropriate !== "boolean"
    ) {
      throw new Error("Gemini returned an unexpected response shape");
    }

    return { animal: parsed.animal, inappropriate: parsed.inappropriate };
  } finally {
    clearTimeout(timeout);
  }
}

// ---------- Video yükleme ----------
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES },
});

router.post(
  "/videos",
  (req, res, next) => {
    uploadVideo.single("video")(req, res, (error) => {
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
  async (req, res) => {
    const deviceId = getDeviceId(req);
    if (!deviceId) {
      res.status(400).json({ error: "INVALID_DEVICE" });
      return;
    }

    if (!req.file || !req.file.mimetype.toLowerCase().startsWith("video/")) {
      res.status(400).json({ error: "INVALID_FILE_TYPE" });
      return;
    }

    try {
      const check = await checkVideoWithGemini(req.file);

      if (check.inappropriate) {
        res.status(422).json({ error: "INAPPROPRIATE_CONTENT" });
        return;
      }

      if (check.animal !== "cat" && check.animal !== "dog") {
        res.status(422).json({ error: "NOT_CAT_OR_DOG" });
        return;
      }

      await ensureLoaded();
      const id = randomUUID();
      const fileName = `${id}${extensionFor(req.file.mimetype)}`;
      await fs.writeFile(path.join(FILES_DIR, fileName), req.file.buffer);

      const record: VideoRecord = {
        id,
        fileName,
        animal: check.animal,
        createdAt: new Date().toISOString(),
        ownerDeviceId: deviceId,
        likes: [],
        reports: [],
        hidden: false,
      };
      videos.push(record);
      await persist();

      res.status(201).json({ video: toPublic(record, deviceId) });
    } catch (error: unknown) {
      console.error(
        "Video check failed:",
        error instanceof Error ? error.message : "unknown error",
      );
      res.status(503).json({ error: "CHECK_FAILED" });
    }
  },
);

// ---------- Video listesi ----------
router.get("/videos", async (req, res) => {
  try {
    await ensureLoaded();
    const deviceId = getDeviceId(req);
    const items = videos
      .filter((video) => !video.hidden)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_VIDEOS_IN_FEED)
      .map((video) => toPublic(video, deviceId));
    res.status(200).json({ videos: items });
  } catch {
    res.status(500).json({ error: "LIST_FAILED" });
  }
});

// ---------- Video dosyasını izlet ----------
router.get("/videos/:id/file", async (req, res) => {
  try {
    await ensureLoaded();
    const video = videos.find((item) => item.id === String(req.params.id));
    if (!video || video.hidden) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.sendFile(path.join(FILES_DIR, video.fileName));
  } catch {
    res.status(500).json({ error: "FILE_FAILED" });
  }
});

// ---------- Beğeni (tekrar basınca geri alır) ----------
router.post("/videos/:id/like", async (req, res) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    res.status(400).json({ error: "INVALID_DEVICE" });
    return;
  }

  try {
    await ensureLoaded();
    const video = videos.find((item) => item.id === String(req.params.id));
    if (!video || video.hidden) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }

    if (video.likes.includes(deviceId)) {
      video.likes = video.likes.filter((id) => id !== deviceId);
    } else {
      video.likes.push(deviceId);
    }
    await persist();

    res.status(200).json({
      likeCount: video.likes.length,
      likedByMe: video.likes.includes(deviceId),
    });
  } catch {
    res.status(500).json({ error: "LIKE_FAILED" });
  }
});

// ---------- Bildir (yeterli bildirimde video otomatik gizlenir) ----------
router.post("/videos/:id/report", async (req, res) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    res.status(400).json({ error: "INVALID_DEVICE" });
    return;
  }

  try {
    await ensureLoaded();
    const video = videos.find((item) => item.id === String(req.params.id));
    if (!video) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }

    if (!video.reports.includes(deviceId)) {
      video.reports.push(deviceId);
    }
    if (video.reports.length >= REPORTS_TO_HIDE) {
      video.hidden = true;
    }
    await persist();

    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ error: "REPORT_FAILED" });
  }
});

export default router;