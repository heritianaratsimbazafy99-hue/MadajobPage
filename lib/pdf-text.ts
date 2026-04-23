import { inflateSync } from "node:zlib";

type PdfObject = {
  body: string;
  start: number;
};

function getPdfObjects(source: string) {
  const objects = new Map<number, PdfObject>();
  const objectPattern = /(\d+)\s+0\s+obj([\s\S]*?)endobj/g;
  let match: RegExpExecArray | null;

  while ((match = objectPattern.exec(source)) !== null) {
    objects.set(Number(match[1]), {
      body: match[2] ?? "",
      start: match.index
    });
  }

  return objects;
}

function getInflatedStreams(buffer: Buffer, source: string, objects: Map<number, PdfObject>) {
  const streams = new Map<number, string>();

  for (const [objectId, object] of objects) {
    const objectSource = source.slice(object.start);
    const streamStartOffset = objectSource.indexOf("stream");
    const streamEndOffset = objectSource.indexOf("endstream");

    if (streamStartOffset < 0 || streamEndOffset < 0) {
      continue;
    }

    let start = object.start + streamStartOffset + "stream".length;

    if (source[start] === "\r" && source[start + 1] === "\n") {
      start += 2;
    } else if (source[start] === "\n") {
      start += 1;
    }

    const end = object.start + streamEndOffset;
    let chunk = buffer.subarray(start, end);

    while (
      chunk.length > 0 &&
      (chunk[chunk.length - 1] === 10 || chunk[chunk.length - 1] === 13)
    ) {
      chunk = chunk.subarray(0, -1);
    }

    try {
      const text = object.body.includes("/FlateDecode")
        ? inflateSync(chunk).toString("latin1")
        : chunk.toString("latin1");
      streams.set(objectId, text);
    } catch {
      // Some streams are binary assets or use unsupported filters; ignore them for text extraction.
    }
  }

  return streams;
}

function parseUnicodeHex(hex: string) {
  let output = "";

  for (let index = 0; index < hex.length; index += 4) {
    const codePoint = Number.parseInt(hex.slice(index, index + 4), 16);

    if (Number.isFinite(codePoint) && codePoint > 0) {
      output += String.fromCharCode(codePoint);
    }
  }

  return output;
}

function parseCMap(stream: string) {
  const map = new Map<string, string>();
  const characterPattern = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
  let match: RegExpExecArray | null;

  while ((match = characterPattern.exec(stream)) !== null) {
    const sourceCode = (match[1] ?? "").toLowerCase().padStart(4, "0");
    const unicodeCode = match[2] ?? "";
    map.set(sourceCode, parseUnicodeHex(unicodeCode));
  }

  return map;
}

function buildFontMaps(objects: Map<number, PdfObject>, streams: Map<number, string>) {
  const cmapByObjectId = new Map<number, Map<string, string>>();
  const fontObjectToCMap = new Map<number, Map<string, string>>();
  const fontNameToCMap = new Map<string, Map<string, string>>();

  for (const [objectId, stream] of streams) {
    if (stream.includes("begincmap")) {
      cmapByObjectId.set(objectId, parseCMap(stream));
    }
  }

  for (const [objectId, object] of objects) {
    const toUnicodeMatch = object.body.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);

    if (!toUnicodeMatch) {
      continue;
    }

    const cmap = cmapByObjectId.get(Number(toUnicodeMatch[1]));

    if (cmap) {
      fontObjectToCMap.set(objectId, cmap);
    }
  }

  for (const object of objects.values()) {
    const fontReferencePattern = /\/(F[\w-]+)\s+(\d+)\s+0\s+R/g;
    let match: RegExpExecArray | null;

    while ((match = fontReferencePattern.exec(object.body)) !== null) {
      const fontName = match[1] ?? "";
      const fontObjectId = Number(match[2]);
      const cmap = fontObjectToCMap.get(fontObjectId);

      if (fontName && cmap) {
        fontNameToCMap.set(fontName, cmap);
      }
    }
  }

  return fontNameToCMap;
}

function decodePdfHexText(hex: string, cmap: Map<string, string> | null) {
  let output = "";

  for (let index = 0; index < hex.length; index += 4) {
    const sourceCode = hex.slice(index, index + 4).toLowerCase();
    output += cmap?.get(sourceCode) ?? "";
  }

  return output;
}

function extractTextChunks(stream: string, fontNameToCMap: Map<string, Map<string, string>>) {
  const chunks: string[] = [];
  const textPattern =
    /\/(F[\w-]+)\s+[\d.]+\s+Tf|\[((?:.|\n)*?)\]\s*TJ|<([0-9a-fA-F]+)>\s*Tj/g;
  let currentCMap: Map<string, string> | null = null;
  let match: RegExpExecArray | null;

  while ((match = textPattern.exec(stream)) !== null) {
    if (match[1]) {
      currentCMap = fontNameToCMap.get(match[1]) ?? null;
      continue;
    }

    if (match[2]) {
      const chunk = Array.from(match[2].matchAll(/<([0-9a-fA-F]+)>/g))
        .map((hexMatch) => decodePdfHexText(hexMatch[1] ?? "", currentCMap))
        .join("");

      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }

    if (match[3]) {
      const chunk = decodePdfHexText(match[3], currentCMap);

      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }
  }

  return chunks;
}

export function extractPdfTextFromBuffer(buffer: Buffer) {
  const source = buffer.toString("latin1");
  const objects = getPdfObjects(source);
  const streams = getInflatedStreams(buffer, source, objects);
  const fontNameToCMap = buildFontMaps(objects, streams);
  const chunks: string[] = [];

  for (const stream of streams.values()) {
    if (stream.includes(" BT") || stream.includes("\nBT")) {
      chunks.push(...extractTextChunks(stream, fontNameToCMap));
    }
  }

  return chunks
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function extractPdfTextFromFile(file: File) {
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "";
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return extractPdfTextFromBuffer(buffer);
}
