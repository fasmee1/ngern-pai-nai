// Reads JSON that is still being written, so a streaming answer can be shown as it arrives.

// Closes any open string, array, or object so the text parses.
function closeJson(text: string): string {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (const ch of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  let out = text;
  if (inString) {
    if (escaped) out = out.slice(0, -1);
    out += '"';
  }
  out = out.replace(/[\s,]+$/, "");
  return out + stack.reverse().join("");
}

// Parses the part of a JSON document received so far. Returns null when nothing usable is there yet.
// A half-written value (a key with no value yet, a cut number) is dropped until the rest arrives.
export function parsePartialJson(raw: string): unknown {
  let text = raw.trim();
  for (let attempt = 0; attempt < 60 && text; attempt++) {
    try {
      return JSON.parse(closeJson(text));
    } catch {
      // Cut back to the previous boundary and try again.
    }
    const cut = Math.max(text.lastIndexOf(","), text.lastIndexOf("{"), text.lastIndexOf("["));
    if (cut < 0) return null;
    text = text.slice(0, text[cut] === "," ? cut : cut + 1);
  }
  return null;
}
