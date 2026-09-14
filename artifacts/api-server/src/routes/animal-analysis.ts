import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import multer from "multer";

const router: IRouter = Router();

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
// Gemini API currently rejects gemini-2.5-flash for newly created API keys
// and recommends this active replacement model.
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_TIMEOUT_MS = 30_000;
const VALID_ANIMAL_IDS = new Set(["dog", "cat", "cow", "chicken", "sheep", "goat"]);
const DISCLAIMER =
  "Bu, gerçek hayvan dili çevirisi değil; ses özelliklerine dayalı eğlence amaçlı AI yorumudur.";

const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

const ANALYSIS_PROMPT = `Bu ses kaydı için Türkçe, eğlence amaçlı bir hayvan sesi yorumu üret.
Bu bilimsel bir çeviri değildir. Yalnızca sesin tonuna, enerjisine, ritmine ve tekrar yapısına
dayalı olası bir yorum yap. Kesin iddialarda bulunma ve "kesinlikle şunu söyledi" gibi ifadeler
kullanma; bunun yerine "... istiyor olabilir", "... anlatıyor gibi duyuluyor" veya
"muhtemelen ... ifade ediyor" gibi ihtimalli bir dil kullan.

Yanıtı yalnızca geçerli JSON olarak döndür, markdown kullanma:
{
  "interpretation": "Kısa, eğlenceli ve ihtimalli Türkçe yorum",
  "mood": "kısa ton/duygu etiketi"
}`;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type GeminiAnalysis = {
  interpretation: string;
  mood: string;
};

function extractGeminiAnalysis(response: GeminiResponse): GeminiAnalysis {
  const text = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { interpretation?: unknown }).interpretation !== "string" ||
    typeof (parsed as { mood?: unknown }).mood !== "string"
  ) {
    throw new Error("Gemini returned an unexpected response shape");
  }

  const interpretation = (parsed as { interpretation: string }).interpretation.trim();
  const mood = (parsed as { mood: string }).mood.trim();

  if (!interpretation || !mood) {
    throw new Error("Gemini returned empty analysis fields");
  }

  return { interpretation, mood };
}

async function analyzeAudioWithGemini(
  audio: Express.Multer.File,
  animalId: string,
): Promise<GeminiAnalysis> {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `Hayvan türü: ${animalId}\n\n${ANALYSIS_PROMPT}` },
                {
                  inline_data: {
                    mime_type: audio.mimetype,
                    data: audio.buffer.toString("base64"),
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
                interpretation: {
                  type: "STRING",
                },
                mood: {
                  type: "STRING",
                },
              },
              required: ["interpretation", "mood"],
            },
            maxOutputTokens: 8192,
          },
        }),
        signal: controller.signal,
      },
    );

    const responseBody = await response.text();

    if (!response.ok) {
      let providerMessage = "";
      try {
        const errorPayload = JSON.parse(responseBody) as {
          error?: { message?: unknown };
        };
        providerMessage =
          typeof errorPayload.error?.message === "string"
            ? errorPayload.error.message.slice(0, 300)
            : "";
      } catch {
        providerMessage = "";
      }

      throw new Error(
        `Gemini request failed with status ${response.status}${
          providerMessage ? `: ${providerMessage}` : ""
        }`,
      );
    }

    return extractGeminiAnalysis(JSON.parse(responseBody) as GeminiResponse);
  } finally {
    clearTimeout(timeout);
  }
}

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

    void analyzeAudioWithGemini(req.file, animalId)
      .then(({ interpretation, mood }) => {
        res.status(200).json({
          analysisId: randomUUID(),
          animalId,
          interpretation,
          mood,
          disclaimer: DISCLAIMER,
          createdAt: new Date().toISOString(),
        });
      })
      .catch((error: unknown) => {
        console.error(
          "Animal audio analysis failed:",
          error instanceof Error ? error.message : "unknown error",
        );
        res.status(500).json({ error: "AI_ANALYSIS_FAILED" });
      });
  },
);

export default router;