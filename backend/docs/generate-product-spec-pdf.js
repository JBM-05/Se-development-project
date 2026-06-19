const { execFileSync } = require("child_process");
const { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require("fs");
const { resolve } = require("path");

const docsDir = __dirname;
const sourcePath = resolve(docsDir, "event-registration-product-spec.md");
const htmlPath = resolve(docsDir, ".event-registration-product-spec.print.html");
const pdfPath = resolve(docsDir, "event-registration-product-spec.pdf");
const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const userDataDir = resolve(docsDir, ".pdf-browser-profile");

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineCode(value) {
  return value.replace(/`([^`]+)`/g, "<code>$1</code>");
}

function parseInline(value) {
  let parsed = escapeHtml(value);
  parsed = parsed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  parsed = inlineCode(parsed);
  return parsed;
}

function renderTable(lines) {
  const rows = lines
    .filter((line) => !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => parseInline(cell.trim())),
    );

  const [head = [], ...body] = rows;
  return [
    "<table>",
    "<thead><tr>",
    ...head.map((cell) => `<th>${cell}</th>`),
    "</tr></thead>",
    "<tbody>",
    ...body.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`),
    "</tbody>",
    "</table>",
  ].join("");
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = [];
  let table = [];
  let inCode = false;
  let code = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    html.push(`<p>${parseInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0) return;
    html.push("<ul>", ...list.map((item) => `<li>${parseInline(item)}</li>`), "</ul>");
    list = [];
  }

  function flushTable() {
    if (table.length === 0) return;
    html.push(renderTable(table));
    table = [];
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
      } else {
        flushParagraph();
        flushList();
        flushTable();
      }
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    }

    flushTable();

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushParagraph();
      flushList();
      html.push(`<figure><img src="${escapeHtml(imageMatch[2])}" alt="${escapeHtml(imageMatch[1])}" /></figure>`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${parseInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const listMatch = line.match(/^- (.+)$/);
    if (listMatch) {
      flushParagraph();
      list.push(listMatch[1]);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushTable();

  return html.join("\n");
}

const body = renderMarkdown(readFileSync(sourcePath, "utf8"));
const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Event Registration System Project Book</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      color: #111827;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      margin: 0;
    }
    h1, h2, h3, h4 { color: #0f172a; line-height: 1.2; margin: 1.1em 0 0.45em; page-break-after: avoid; }
    h1 { font-size: 26pt; text-align: center; margin-top: 0; }
    h2 { font-size: 18pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    h3 { font-size: 14pt; }
    h4 { font-size: 12pt; }
    p { margin: 0 0 0.7em; }
    ul { margin: 0 0 0.8em 1.3em; padding: 0; }
    li { margin: 0.15em 0; }
    table {
      border-collapse: collapse;
      margin: 0.8em 0 1em;
      page-break-inside: avoid;
      width: 100%;
    }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #eef2f7; font-weight: 700; }
    code { background: #f1f5f9; border-radius: 3px; font-family: Consolas, "Courier New", monospace; padding: 1px 4px; }
    pre { background: #0f172a; border-radius: 6px; color: #e2e8f0; overflow-wrap: break-word; padding: 10px 12px; white-space: pre-wrap; }
    pre code { background: transparent; color: inherit; padding: 0; }
    figure { margin: 1em 0 1.4em; page-break-inside: avoid; text-align: center; }
    img { display: block; height: auto; margin: 0 auto; max-height: 245mm; max-width: 100%; }
    a { color: #1d4ed8; text-decoration: none; }
    strong { font-weight: 700; }
  </style>
</head>
<body>${body}</body>
</html>`;

const browserPath = browserCandidates.find((candidate) => existsSync(candidate));
if (!browserPath) {
  throw new Error(`No supported Chromium browser was found. Checked: ${browserCandidates.join(", ")}`);
}

writeFileSync(htmlPath, html);

try {
  mkdirSync(userDataDir, { recursive: true });
  execFileSync(browserPath, [
    "--headless",
    "--disable-software-rasterizer",
    "--disable-gpu",
    "--disable-gpu-compositing",
    "--disable-dev-shm-usage",
    "--disable-features=UseSkiaRenderer,VizDisplayCompositor",
    "--no-pdf-header-footer",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${userDataDir}`,
    `--print-to-pdf=${pdfPath}`,
    `file:///${htmlPath.replace(/\\/g, "/")}`,
  ]);
} finally {
  rmSync(htmlPath, { force: true });
  rmSync(userDataDir, { force: true, recursive: true });
}
