export interface Tweet {
  index: number;
  text: string;
  charCount: number;
  isOverLimit: boolean;
}

const CHAR_LIMIT = 280;

export function parseThread(output: string): Tweet[] {
  if (!output.trim()) return [];

  const parts = output.split(/\n---\n/).map((s) => s.trim()).filter(Boolean);

  if (parts.length <= 1) {
    const text = output.trim();
    return [
      {
        index: 0,
        text,
        charCount: text.length,
        isOverLimit: text.length > CHAR_LIMIT,
      },
    ];
  }

  return parts.map((text, i) => ({
    index: i,
    text,
    charCount: text.length,
    isOverLimit: text.length > CHAR_LIMIT,
  }));
}

export function isThread(output: string): boolean {
  return output.includes("\n---\n");
}

export { CHAR_LIMIT };
