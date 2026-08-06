import fs from "fs";
import path from "path";

export type ParsedTopic = {
  title: string;
  section: string | null;
  description: string;
  sortOrder: number;
};

export type ParsedCategory = {
  name: string;
  slug: string;
  topics: ParsedTopic[];
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTitle(title: string) {
  return title
    .replace(/\*+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanTopicTitle(raw: string) {
  return raw
    .replace(/\*+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip lone UTF-16 surrogates that break JSON/Neon HTTP inserts */
export function sanitizeText(text: string) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += text[i] + text[i + 1];
        i++;
      } else {
        out += "\uFFFD";
      }
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      out += "\uFFFD";
    } else if (c !== 0) {
      out += text[i];
    }
  }
  return out;
}

/** Extract checklist topics and optional section headers from a Topics.md file */
export function parseTopicsFile(content: string): Omit<ParsedTopic, "description">[] {
  const lines = content.split(/\r?\n/);
  const topics: Omit<ParsedTopic, "description">[] = [];
  let currentSection: string | null = null;
  let sortOrder = 0;

  const sectionRe = /^\*\*[✅📌]?\s*(.+?)\*\*\s*$/;
  const topicRe = /^\s*-\s*\[[ xX]?\]\s+(.+)\s*$/;

  for (const line of lines) {
    const sectionMatch = line.match(sectionRe);
    if (sectionMatch) {
      currentSection = sectionMatch[1].replace(/\*+/g, "").trim();
      continue;
    }

    const topicMatch = line.match(topicRe);
    if (topicMatch) {
      const title = cleanTopicTitle(topicMatch[1]);
      if (!title) continue;
      topics.push({
        title,
        section: currentSection,
        sortOrder: sortOrder++,
      });
    }
  }

  return topics;
}

/** Extract ### headings and their body text from a Guide.md file */
export function parseGuideFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  const parts = content.split(/^### /m);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const newline = part.indexOf("\n");
    const title =
      newline === -1 ? part.trim() : part.slice(0, newline).trim();
    let body = newline === -1 ? "" : part.slice(newline + 1);

    // Stop at horizontal rule that typically separates topics, keep content before next ###
    body = body.replace(/\n---\s*$/m, "").trim();

    if (title) {
      map.set(normalizeTitle(title), body);
      // Also store original casing key for debugging
      map.set(`__raw__:${title}`, body);
    }
  }

  return map;
}

function findGuidePath(contentDir: string, topicsBasename: string): string | null {
  // "React Topics.md" -> try "React Topics Guide.md" and "React Guide.md"
  const withoutExt = topicsBasename.replace(/\.md$/i, "");
  const candidates = [
    `${withoutExt} Guide.md`,
    `${withoutExt.replace(/ Topics$/i, "")} Guide.md`,
  ];

  for (const candidate of candidates) {
    const full = path.join(contentDir, candidate);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

export function parseAllContent(contentDir: string): ParsedCategory[] {
  const files = fs.readdirSync(contentDir);
  const topicsFiles = files.filter(
    (f) =>
      f.endsWith("Topics.md") &&
      !f.includes("Guide") &&
      fs.statSync(path.join(contentDir, f)).isFile()
  );

  const categories: ParsedCategory[] = [];

  for (const topicsFile of topicsFiles) {
    const topicsPath = path.join(contentDir, topicsFile);
    const topicsContent = fs.readFileSync(topicsPath, "utf8");
    const topicRows = parseTopicsFile(topicsContent);

    const guidePath = findGuidePath(contentDir, topicsFile);
    const guideMap = guidePath
      ? parseGuideFile(fs.readFileSync(guidePath, "utf8"))
      : new Map<string, string>();

    const name = topicsFile
      .replace(/\.md$/i, "")
      .replace(/ Topics$/i, "")
      .trim();

    const topics: ParsedTopic[] = topicRows.map((t) => {
      const description =
        guideMap.get(normalizeTitle(t.title)) ??
        "_No guide description found for this topic._";
      return {
        ...t,
        title: sanitizeText(t.title),
        section: t.section ? sanitizeText(t.section) : null,
        description: sanitizeText(description),
      };
    });

    categories.push({
      name,
      slug: slugify(name),
      topics,
    });
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}
