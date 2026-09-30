// Markdown helpers: find "### <id>" headings each followed by a ```yaml fence.
import { parseYaml } from "./yaml.mjs";

/**
 * Returns [{heading, line, yamlStart, yamlEnd, yamlText, data, error}] where
 * line = 1-based heading line, yamlStart/yamlEnd = 1-based first/last content lines of the fence.
 */
export function parseMdBlocks(text) {
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*```/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const h = l.match(/^###\s+`?([^\s`]+)`?\s*$/);
    if (!h) continue;
    // look ahead for a yaml fence before the next heading
    let j = i + 1;
    while (j < lines.length && !/^\s*```\s*ya?ml\s*$/i.test(lines[j]) && !/^#{1,3}\s/.test(lines[j])) j++;
    const block = { heading: h[1], line: i + 1, yamlStart: null, yamlEnd: null, yamlText: null, data: null, error: null };
    if (j < lines.length && /^\s*```\s*ya?ml\s*$/i.test(lines[j])) {
      let k = j + 1;
      while (k < lines.length && !/^\s*```\s*$/.test(lines[k])) k++;
      block.yamlStart = j + 2;
      block.yamlEnd = k;
      block.yamlText = lines.slice(j + 1, k).join("\n");
      try { block.data = parseYaml(block.yamlText); } catch (e) { block.error = e.message; }
      i = k;
    }
    blocks.push(block);
  }
  return blocks;
}
