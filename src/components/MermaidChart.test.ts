import { describe, it, expect } from 'vitest';

// Function mirrored for direct unit testing of syntax sanitization
function sanitizeMermaid(raw: string): string {
  if (!raw) return 'graph TD\n  Empty[No diagram code provided]';

  let cleaned = raw.trim()
    .replace(/^```(mermaid|flowchart)?\n?/i, '')
    .replace(/```$/, '')
    .trim();

  if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)/m.test(cleaned)) {
    cleaned = 'graph TD\n' + cleaned;
  }

  cleaned = cleaned.replace(/\[([^"\]\n]*[\(\)\/\:\,\&\#\-\@\%\$\!\?][^"\]\n]*)\]/g, (match, inner) => {
    if (inner.startsWith('"') && inner.endsWith('"')) return match;
    const safeInner = inner.replace(/"/g, "'");
    return `["${safeInner}"]`;
  });

  cleaned = cleaned.replace(/\|([^"\|\n]*[\(\)\/\:\,\&\#\@\%\$\!\?][^"\|\n]*)\|/g, (match, inner) => {
    if (inner.startsWith('"') && inner.endsWith('"')) return match;
    const safeInner = inner.replace(/"/g, "'");
    return `|"${safeInner}"|`;
  });

  return cleaned;
}

describe('Mermaid Sanitizer Unit Tests', () => {
  it('should auto-quote unquoted labels containing parentheses', () => {
    const raw = 'graph TD\n  A[HTTP Request (GET/POST)] --> B[Server]';
    const sanitized = sanitizeMermaid(raw);
    expect(sanitized).toContain('["HTTP Request (GET/POST)"]');
  });

  it('should strip markdown code blocks', () => {
    const raw = '```mermaid\ngraph TD\n  A --> B\n```';
    const sanitized = sanitizeMermaid(raw);
    expect(sanitized).toBe('graph TD\n  A --> B');
  });

  it('should auto-add graph TD if header is omitted', () => {
    const raw = 'A --> B';
    const sanitized = sanitizeMermaid(raw);
    expect(sanitized).toBe('graph TD\nA --> B');
  });
});
