import { describe, it, expect, beforeEach } from 'vitest';
import { getMermaidSvgElement } from './pdfExport';

describe('pdfExport Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('getMermaidSvgElement', () => {
    it('should find mermaid svg with mermaid id prefix', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'mermaid-abc1234');
      document.body.appendChild(svg);

      const found = getMermaidSvgElement();
      expect(found).toBe(svg);
    });

    it('should ignore lucide UI icons', () => {
      const lucideIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      lucideIcon.setAttribute('class', 'lucide lucide-sparkles');
      document.body.appendChild(lucideIcon);

      const found = getMermaidSvgElement();
      expect(found).toBeNull();
    });

    it('should find svg inside .mermaid-rendered-diagram container', () => {
      const container = document.createElement('div');
      container.className = 'mermaid-rendered-diagram';

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);
      document.body.appendChild(container);

      const found = getMermaidSvgElement();
      expect(found).toBe(svg);
    });
  });
});
