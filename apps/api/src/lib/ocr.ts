import fs from "fs";
import type Anthropic from "@anthropic-ai/sdk";

const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png"]);

/** Returns true for image MIME types we accept */
export function isImageMime(mimeType: string): boolean {
  return ALLOWED_IMAGE_MIMES.has(mimeType);
}

/** Read a file and return its raw base64 string */
function toBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString("base64");
}

const EXTRACTION_PROMPT = `You are an invoice data extractor. Look at this invoice carefully and extract all fields into a single JSON object.

Return ONLY valid JSON — no markdown, no code fences, no explanation. If a field is not present or cannot be determined, use null.

Required JSON schema:
{
  "supplier_name": string | null,
  "invoice_number": string | null,
  "invoice_date": string | null,   // ISO format YYYY-MM-DD if possible
  "due_date": string | null,        // ISO format YYYY-MM-DD if possible
  "currency": string | null,        // e.g. "SGD", "USD", "AUD"
  "subtotal": number | null,
  "tax": number | null,
  "total": number | null,
  "line_items": [
    {
      "description": string,
      "quantity": number | null,
      "unit_price": number | null,
      "amount": number | null
    }
  ] | null
}

Rules:
- Extract numbers as plain numbers (no currency symbols, no commas)
- If there are multiple pages, combine all line items
- Use the document's own currency symbol/code to determine the currency field
- If the document shows GST/VAT/tax separately, put it in the "tax" field
- supplier_name is the company or person who ISSUED the invoice (the seller/vendor)`;

/**
 * Send an invoice to Claude and return structured JSON.
 * Supports both image files (JPEG/PNG) and PDFs natively via the Anthropic API.
 */
export async function extractInvoiceFromFile(
  filePath: string,
  mimeType: string,
  anthropicClient: Anthropic,
  model: string
): Promise<Record<string, unknown>> {
  const base64 = toBase64(filePath);

  let contentBlock: Anthropic.MessageParam["content"][number];

  if (isImageMime(mimeType)) {
    const mediaType = mimeType === "image/jpeg" ? "image/jpeg" : "image/png";
    contentBlock = {
      type: "image",
      source: { type: "base64", media_type: mediaType, data: base64 },
    };
  } else {
    // PDF — send directly as a document block (supported by claude-3-5-sonnet and later)
    contentBlock = {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    } as Anthropic.MessageParam["content"][number];
  }

  const response = await anthropicClient.messages.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPT },
          contentBlock,
        ],
      },
    ],
  });

  const firstBlock = response.content[0];
  const raw = firstBlock.type === "text" ? firstBlock.text.trim() : "";

  // Strip markdown fences if the model wraps its output
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned) as Record<string, unknown>;
}
