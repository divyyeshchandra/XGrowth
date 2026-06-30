// Deterministic post-processing applied to every generated post. These run
// server-side on the full text (generation is buffered, not streamed) so they
// can fix things the LLM won't reliably do itself: kill AI-tell cliches and
// symbols, and enforce consistent white space.

// Cliche / symbol fixes. Order matters. Each is unambiguous, so replacement is
// always safe. The article/intensifier capture on "game-changer" avoids the
// "a total game-changer" -> "a total a big deal" grammar bug.
const REPLACEMENTS: [RegExp, string][] = [
  [/^[ \t]*[*•]\s+/gm, "- "], // * or bullet dots -> hyphen bullets
  // Formulaic opinion/label colons ("My honest take:", "The bottom line:") -> drop the label
  [
    /^(?:my honest take|my take|honest take|the bottom line|bottom line|the takeaway|my verdict|the verdict|in short|the point|the reason|the real question)\s*:\s*/gim,
    "",
  ],
  [
    /\b(?:a\s+|an\s+)?(?:total\s+|real\s+|complete\s+|absolute\s+)?game[\s-]?changer\b/gi,
    "a big deal",
  ],
  [/\bgame[\s-]?changing\b/gi, "major"],
  [/\bchange the game\b/gi, "make a real difference"],
  [/\bchanged the game\b/gi, "made a real difference"],
  [/\bchanges the game\b/gi, "makes a real difference"],
  [/\bchanging the game\b/gi, "making a real difference"],
  [/\bshaking things up\b/gi, "making a real change"],
  [/\bmaking waves\b/gi, "getting real attention"],
  // Formal/complex words the model reaches for. Plain swaps a human would use.
  [/\blucrative ventures\b/gi, "ways to make money"],
  [/\bfollowing suit\b/gi, "doing the same"],
  [/\bkey to symbiosis\b/gi, "key to working together"],
  [/\ba plethora of\b/gi, "a lot of"],
  [/\btak(?:e|es|ing) notice of\b/gi, "paying attention to"],
  [/\btak(?:e|es|ing) notice\b/gi, "paying attention"],
  [/\bwake[\s-]?up call\b/gi, "a warning sign"],
  [/\bseismic shift\b/gi, "a big shift"],
  [/\bparadigm shift\b/gi, "a big shift"],
  [/\bdisrupts the market\b/gi, "shakes things up"],
  [/(\d)\s*[–—]\s*(\d)/g, "$1-$2"], // numeric en/em dash range -> hyphen
  [/\s*—\s*/g, ", "], // em dash -> comma
  [/\s+–\s+/g, ", "], // spaced en dash -> comma
  [/(\S) - (\S)/g, "$1, $2"], // mid-sentence " - " connector -> comma (AI tell)
  [/[ \t]+[-–—]+[ \t]*$/gm, ""], // stray trailing dash on a line
];

export function clean(s: string): string {
  let out = s
    .replace(/‑/g, "-") // non-breaking hyphen
    .replace(/[   ]/g, " "); // exotic spaces
  for (const [re, rep] of REPLACEMENTS) out = out.replace(re, rep);
  return out;
}

// Some models (qwen) leak a <think>...</think> reasoning block. Drop it.
function stripThink(s: string): string {
  const trimmed = s.replace(/^\s+/, "");
  if (trimmed.startsWith("<think>")) {
    const close = trimmed.indexOf("</think>");
    if (close !== -1) return trimmed.slice(close + "</think>".length);
  }
  return s;
}

type LineKind = "item" | "detail" | "prose";

function kindOf(line: string): LineKind {
  const t = line.trimStart();
  if (t.startsWith("- ") || t === "-") return "item";
  if (t.startsWith("> ")) return "detail";
  return "prose";
}

// Enforces consistent white space: a blank line between every "beat", with the
// exception of consecutive bullets / their detail lines, which stay tight. This
// makes spacing reliable regardless of how the model formatted its output.
export function normalizeSpacing(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => l.trim().length > 0);

  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) {
      const a = kindOf(lines[i - 1]);
      const b = kindOf(lines[i]);
      let blank = true;
      if (a === "item" && b === "detail") blank = false; // detail under its item
      else if (a === "detail" && b === "detail") blank = false; // stacked details
      else if (a === "item" && b === "item") blank = false; // a plain bullet list
      if (blank) out.push("");
    }
    out.push(lines[i]);
  }
  return out.join("\n");
}

// Flattens nested bullets. The model sometimes indents "-" bullets (or ">"
// details) under another bullet; X has no nested lists, so we pull every bullet
// back to the left edge.
function deNest(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s+([->] )/, "$1"))
    .join("\n");
}

// Removes any URL the output contains that was NOT in the original draft. The
// model sometimes hallucinates a plausible-looking link (e.g. "devin.ai"). We
// only allow links that actually appear in the draft.
function stripUnknownUrls(text: string, draftUrls: Set<string>): string {
  const norm = (u: string) =>
    u.replace(/^https?:\/\//i, "").replace(/[/.,);]+$/, "").toLowerCase();
  const allowed = new Set([...draftUrls].map(norm));
  return text
    .split("\n")
    .map((line) =>
      line.replace(/https?:\/\/\S+/g, (url) => (allowed.has(norm(url)) ? url : ""))
    )
    .join("\n");
}

// A bare URL is never a "> detail" — the model sometimes attaches a standalone
// link to a random list item as a detail. Strip the "> " so it becomes a plain
// link line (which the spacing normalizer then sets apart cleanly).
function unwrapUrlDetails(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const m = line.match(/^(\s*)>\s+(https?:\/\/\S+)\s*$/);
      return m ? `${m[1]}${m[2]}` : line;
    })
    .join("\n");
}

// Drops misplaced/repeated standalone-URL lines. The model sometimes scatters a
// link onto its own line (e.g. next to a list item) while the same URL also sits
// inside a sentence/step where it belongs. We drop the standalone copy if that
// URL appears inline elsewhere, and drop any repeated standalone occurrence.
function dedupeUrlLines(text: string): string {
  const lines = text.split("\n");

  // URLs that appear inline (in a line with other text besides the URL).
  const inline = new Set<string>();
  for (const line of lines) {
    const t = line.trim();
    const m = t.match(/https?:\/\/\S+/);
    if (m && t.replace(m[0], "").trim().length > 0) inline.add(m[0]);
  }

  const seen = new Set<string>();
  return lines
    .filter((line) => {
      const t = line.trim();
      const m = t.match(/^(https?:\/\/\S+)$/);
      if (m) {
        const url = m[1];
        if (inline.has(url)) return false; // belongs inline elsewhere
        if (seen.has(url)) return false; // duplicate standalone
        seen.add(url);
      }
      return true;
    })
    .join("\n");
}

export function finalizePost(raw: string, draftUrls: Set<string> = new Set()): string {
  return normalizeSpacing(
    dedupeUrlLines(
      unwrapUrlDetails(stripUnknownUrls(deNest(clean(stripThink(raw))), draftUrls))
    )
  ).trim();
}
