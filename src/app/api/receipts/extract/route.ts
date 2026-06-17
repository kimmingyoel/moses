import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import {
  normalizeReceiptExtraction,
  validateReceiptExtraction,
} from "@/lib/receipt";
import { MAX_UPLOAD_SIZE, validateUploadFile } from "@/lib/upload";

const MODEL = "gpt-5.4-mini";
const DETAIL = "high";

type ExtractionAssets = {
  prompt: string;
  schema: unknown;
  promptSha256: string;
  schemaSha256: string;
};

// The prompt and schema are static files that never change at runtime, so read,
// parse, and hash them once and reuse the result across every request instead
// of doing two disk reads + a JSON.parse + two SHA-256 digests per upload.
let extractionAssets: Promise<ExtractionAssets> | null = null;

function loadExtractionAssets(): Promise<ExtractionAssets> {
  if (!extractionAssets) {
    extractionAssets = (async () => {
      const [prompt, schemaText] = await Promise.all([
        readFile(join(process.cwd(), "prompts/receipt-extraction.md"), "utf8"),
        readFile(join(process.cwd(), "schemas/receipt-extraction.schema.json"), "utf8"),
      ]);
      return {
        prompt,
        schema: JSON.parse(schemaText),
        promptSha256: sha256(prompt),
        schemaSha256: sha256(schemaText),
      };
    })().catch((error) => {
      // Don't cache a failed read — a transient error shouldn't poison every
      // subsequent request.
      extractionAssets = null;
      throw error;
    });
  }
  return extractionAssets;
}

export async function POST(request: Request) {
  try {
    // Reject grossly oversized uploads from the Content-Length header before
    // formData() buffers the whole body into memory. The 1MB margin covers
    // multipart overhead; the exact file.size check below catches the rest.
    const declaredSize = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_UPLOAD_SIZE + 1024 * 1024) {
      return Response.json(
        { error: "이미지 용량이 너무 커요. 더 작은 사진으로 올려 주세요." },
        { status: 413 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "영수증 이미지 파일을 선택해 주세요." }, { status: 400 });
    }
    const fileError = validateUploadFile(file);
    if (fileError) {
      return Response.json(
        { error: fileError },
        { status: file.size > MAX_UPLOAD_SIZE ? 413 : 400 },
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error:
            "OPENAI_API_KEY가 설정되지 않아 영수증을 분석할 수 없어요. 키를 설정한 뒤 다시 시도해 주세요.",
        },
        { status: 503 },
      );
    }

    const [assets, imageBuffer] = await Promise.all([
      loadExtractionAssets(),
      file.arrayBuffer(),
    ]);
    const { prompt, schema } = assets;
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              {
                type: "input_image",
                image_url: `data:${file.type};base64,${imageBase64}`,
                detail: DETAIL,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "receipt_extraction",
            strict: true,
            schema,
          },
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return Response.json(
        { error: openAiErrorMessage(payload) },
        { status: response.status },
      );
    }

    const outputText = extractOutputText(payload);
    if (!outputText) {
      return Response.json(
        { error: "OpenAI 응답에서 추출 JSON을 찾지 못했어요." },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(outputText) as unknown;
    const validation = validateReceiptExtraction(parsed);
    if (!validation.ok) {
      return Response.json(
        { error: "추출 결과가 영수증 스키마와 맞지 않아요.", details: validation.errors },
        { status: 502 },
      );
    }

    const draft = normalizeReceiptExtraction(
      validation.value,
      crypto.randomUUID(),
    );

    // A non-receipt image (or one too unclear to read) comes back with neither
    // line items nor a total. Surface it as a clear recognition failure instead
    // of a "successful" empty draft that misleads the next step into showing an
    // empty receipt to edit by hand.
    if (draft.items.length === 0 && draft.totalAmount === 0) {
      return Response.json(
        {
          error:
            "영수증을 인식하지 못했어요. 영수증이 맞는지, 사진이 흐리거나 잘리지 않았는지 확인하고 다시 올려 주세요.",
        },
        { status: 422 },
      );
    }

    return Response.json({
      extraction: validation.value,
      draft,
      observability: {
        responseId: typeof payload.id === "string" ? payload.id : null,
        model: MODEL,
        detail: DETAIL,
        promptSha256: assets.promptSha256,
        schemaSha256: assets.schemaSha256,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "영수증 분석 중 오류가 발생했어요.";
    return Response.json({ error: message }, { status: 500 });
  }
}

function extractOutputText(payload: unknown): string | null {
  if (isRecord(payload) && typeof payload.output_text === "string") {
    return payload.output_text;
  }
  if (!isRecord(payload) || !Array.isArray(payload.output)) return null;

  for (const output of payload.output) {
    if (!isRecord(output) || !Array.isArray(output.content)) continue;
    for (const content of output.content) {
      if (isRecord(content) && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

function openAiErrorMessage(payload: unknown): string {
  if (
    isRecord(payload) &&
    isRecord(payload.error) &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }
  return "OpenAI 영수증 분석 요청이 실패했어요.";
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
