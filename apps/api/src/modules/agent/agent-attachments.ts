import { BadRequestException } from '@nestjs/common';
import type { UIMessage } from 'ai' with { 'resolution-mode': 'import' };
import { clipText } from './agent-message-text.js';

const MAX_FILES = 5;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 150_000;

const BINARY_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);
const TEXT_TYPE = /^(text\/[\w.+-]+|application\/json)$/;
const DATA_URL =
  /^data:([\w.+-]+\/[\w.+-]+)(?:;[\w-]+=[\w-]+)*;base64,([A-Za-z0-9+/=]+)$/;

interface FilePart {
  type: 'file';
  mediaType: string;
  filename?: string;
  url: string;
}

function isFilePart(part: UIMessage['parts'][number]): part is FilePart {
  return part.type === 'file';
}

function decodedSize(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * Files only arrive inline as base64 data URLs from the chat composer, so a
 * remote URL is rejected instead of letting the provider fetch it.
 */
export function assertValidAttachments(message: UIMessage): void {
  if (message.role !== 'user') return;
  const files = message.parts.filter(isFilePart);
  if (files.length === 0) return;
  if (files.length > MAX_FILES) {
    throw new BadRequestException(
      `Puedes adjuntar hasta ${MAX_FILES} archivos por mensaje.`,
    );
  }

  for (const file of files) {
    const name = file.filename ?? 'el archivo';
    const match = DATA_URL.exec(file.url);
    if (!match || match[1] !== file.mediaType) {
      throw new BadRequestException(`No se pudo leer ${name}.`);
    }
    if (!BINARY_TYPES.has(file.mediaType) && !TEXT_TYPE.test(file.mediaType)) {
      throw new BadRequestException(
        `${name} no es compatible. Adjunta imágenes, PDF, Excel, CSV o texto.`,
      );
    }
    if (decodedSize(match[2]) > MAX_FILE_BYTES) {
      throw new BadRequestException(
        `${name} supera el límite de ${MAX_FILE_BYTES / 1024 / 1024} MB.`,
      );
    }
  }
}

/**
 * Text-like files (CSV, spreadsheets converted on the client, Markdown…) are
 * inlined as text so every provider can read them; images and PDFs stay as
 * file parts.
 */
export function inlineTextAttachments(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => {
    if (message.role !== 'user' || !message.parts.some(isTextFile)) {
      return message;
    }
    return {
      ...message,
      parts: message.parts.map((part) => {
        if (!isTextFile(part)) return part;
        const base64 = part.url.slice(part.url.indexOf(',') + 1);
        const content = Buffer.from(base64, 'base64').toString('utf8');
        return {
          type: 'text' as const,
          text: `Archivo adjunto "${part.filename ?? 'sin nombre'}" (${part.mediaType}):\n\n${clipText(content, MAX_TEXT_CHARS)}`,
        };
      }),
    };
  });
}

function isTextFile(part: UIMessage['parts'][number]): part is FilePart {
  return isFilePart(part) && TEXT_TYPE.test(part.mediaType);
}

export function attachmentNames(message: UIMessage): string[] {
  return message.parts
    .filter(isFilePart)
    .map((file) => file.filename ?? file.mediaType);
}
