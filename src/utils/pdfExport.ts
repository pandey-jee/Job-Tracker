import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Finds the Mermaid diagram SVG element
 */
export function getMermaidSvgElement(): SVGElement | null {
  const specific = document.querySelector('.mermaid-rendered-diagram svg, svg[id^="mermaid-"]') as SVGElement;
  if (specific) return specific;

  const allSvgs = Array.from(document.querySelectorAll('svg'));
  const diagramSvg = allSvgs.find(svg => {
    const box = svg.getBoundingClientRect();
    const id = svg.getAttribute('id') || '';
    return (id.startsWith('mermaid') || (box.width > 200 && box.height > 100)) && !svg.classList.contains('lucide');
  });

  return (diagramSvg as SVGElement) || null;
}

/**
 * Section-Aware Multi-Page PDF Exporter using Calculated A4 Page Model
 * 
 * Flow:
 * 1. Parse markdown elements into complete logical sections (Heading + Content).
 * 2. Pre-measure each section's exact rendered height in an offscreen staging container.
 * 3. Deterministically place sections using calculated CONTENT_HEIGHT:
 *    - If section fits in remaining page capacity → place on current page.
 *    - If section overflows → start a new page.
 * 4. Render each page using A4 Model: [Header] + [Content Area] + [Footer].
 */
export async function exportNotesToPDF(title: string, markdownContainerElement: HTMLElement) {
  // A4 Page Constants (at 96 DPI)
  const PAGE_WIDTH = 794;
  const PAGE_HEIGHT = 1123;
  const PADDING_X = 48;
  const PADDING_TOP = 40;
  const PADDING_BOTTOM = 36;
  const USABLE_WIDTH = PAGE_WIDTH - (PADDING_X * 2); // 698px

  const HEADER_HEIGHT_P1 = 70; // Title banner
  const HEADER_HEIGHT_SUBSEQUENT = 28; // Small running header
  const FOOTER_HEIGHT = 30; // Page number bar
  const SECTION_MARGIN = 14; // Gap between sections

  const CONTENT_HEIGHT_P1 = PAGE_HEIGHT - PADDING_TOP - PADDING_BOTTOM - HEADER_HEIGHT_P1 - FOOTER_HEIGHT; // ~947px
  const CONTENT_HEIGHT_SUBSEQUENT = PAGE_HEIGHT - PADDING_TOP - PADDING_BOTTOM - HEADER_HEIGHT_SUBSEQUENT - FOOTER_HEIGHT; // ~989px

  // Isolated Sandbox Root
  const sandbox = document.createElement('div');
  sandbox.id = 'pdf-isolated-sandbox';
  sandbox.style.position = 'absolute';
  sandbox.style.top = '-99999px';
  sandbox.style.left = '-99999px';
  sandbox.style.width = `${PAGE_WIDTH}px`;
  sandbox.style.zIndex = '-1000';
  sandbox.style.visibility = 'hidden';

  // Scoped typography and styling (100% isolated)
  const style = document.createElement('style');
  style.innerHTML = `
    #pdf-isolated-sandbox * {
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #pdf-isolated-sandbox .pdf-a4-page {
      width: ${PAGE_WIDTH}px;
      height: ${PAGE_HEIGHT}px;
      background-color: #ffffff;
      color: #111827;
      padding: ${PADDING_TOP}px ${PADDING_X}px ${PADDING_BOTTOM}px ${PADDING_X}px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      box-sizing: border-box;
    }
    #pdf-isolated-sandbox .pdf-content-area {
      width: 100%;
      flex: 1;
      overflow: hidden;
    }
    #pdf-isolated-sandbox .pdf-section-unit {
      width: 100%;
      margin-bottom: ${SECTION_MARGIN}px;
    }
    #pdf-isolated-sandbox h1 { font-size: 16.5px; font-weight: 700; color: #1e3a8a; margin: 0 0 8px 0; padding-bottom: 5px; border-bottom: 1.5px solid #e2e8f0; }
    #pdf-isolated-sandbox h2 { font-size: 14px; font-weight: 700; color: #1d4ed8; margin: 0 0 6px 0; }
    #pdf-isolated-sandbox h3 { font-size: 12.5px; font-weight: 600; color: #2563eb; margin: 0 0 4px 0; }
    #pdf-isolated-sandbox p { font-size: 11.5px; line-height: 1.68; color: #1f2937; margin: 0 0 8px 0; }
    #pdf-isolated-sandbox ul, #pdf-isolated-sandbox ol { margin: 0 0 10px 0; padding-left: 22px; }
    #pdf-isolated-sandbox li { font-size: 11.5px; line-height: 1.62; color: #1f2937; margin-bottom: 4px; }
    #pdf-isolated-sandbox code { background: #f1f5f9; color: #1e40af; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 11px; border: 1px solid #e2e8f0; }
    #pdf-isolated-sandbox pre { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 14px; margin: 8px 0; overflow: hidden; }
    #pdf-isolated-sandbox pre code { background: none; color: #0f172a; font-size: 10.5px; line-height: 1.45; padding: 0; border: none; white-space: pre-wrap; word-break: break-word; }
    #pdf-isolated-sandbox table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
    #pdf-isolated-sandbox th, #pdf-isolated-sandbox td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; vertical-align: top; }
    #pdf-isolated-sandbox th { background: #f1f5f9; color: #0f172a; font-weight: 700; }
    #pdf-isolated-sandbox tr:nth-child(even) td { background: #f8fafc; }
    #pdf-isolated-sandbox blockquote { border-left: 3.5px solid #2563eb; padding: 6px 12px; margin: 10px 0; color: #374151; font-style: italic; background: #eff6ff; border-radius: 0 4px 4px 0; }
    #pdf-isolated-sandbox strong { color: #0f172a; font-weight: 600; }
    #pdf-isolated-sandbox hr { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }
  `;
  sandbox.appendChild(style);
  document.body.appendChild(sandbox);

  try {
    // 1. Group markdown elements into complete logical sections (Heading + immediate content)
    const sourceElements = Array.from(markdownContainerElement.children) as HTMLElement[];
    const logicalSections: HTMLElement[] = [];

    for (let i = 0; i < sourceElements.length; i++) {
      const el = sourceElements[i];
      const tagName = el.tagName.toUpperCase();

      const sectionWrapper = document.createElement('div');
      sectionWrapper.className = 'pdf-section-unit';

      if (tagName.startsWith('H')) {
        // Append heading
        sectionWrapper.appendChild(el.cloneNode(true));

        // Pull following sibling elements until the next major heading (H1 or H2)
        while (i + 1 < sourceElements.length && !['H1', 'H2'].includes(sourceElements[i + 1].tagName.toUpperCase())) {
          const nextEl = sourceElements[i + 1];
          // If next is a large standalone sub-block (like an H3 or table or code block) and we already have content, we can treat it as part of this section or split
          sectionWrapper.appendChild(nextEl.cloneNode(true));
          i++;
        }
      } else {
        sectionWrapper.appendChild(el.cloneNode(true));
      }

      logicalSections.push(sectionWrapper);
    }

    // 2. Measure section heights in an offscreen measurement container
    const measureBox = document.createElement('div');
    measureBox.style.width = `${USABLE_WIDTH}px`;
    measureBox.style.position = 'absolute';
    measureBox.style.visibility = 'hidden';
    sandbox.appendChild(measureBox);

    const measuredSections: { element: HTMLElement; height: number }[] = [];

    for (const sec of logicalSections) {
      measureBox.appendChild(sec);
      const measuredHeight = sec.getBoundingClientRect().height;
      measuredSections.push({ element: sec, height: measuredHeight });
    }
    sandbox.removeChild(measureBox);

    // 3. Section-Aware Pagination Loop with Calculated CONTENT_HEIGHT
    const pages: HTMLElement[][] = [[]];
    let currentPageIdx = 0;
    let currentRemainingHeight = CONTENT_HEIGHT_P1;

    for (const item of measuredSections) {
      const neededHeight = item.height + SECTION_MARGIN;

      // Decision: Does section fit in current page's remaining CONTENT_HEIGHT?
      if (neededHeight <= currentRemainingHeight) {
        // YES: Place on same page
        pages[currentPageIdx].push(item.element);
        currentRemainingHeight -= neededHeight;
      } else {
        // NO: Move to new page
        // If current page is empty (i.e. single giant section), place it anyway
        if (pages[currentPageIdx].length === 0) {
          pages[currentPageIdx].push(item.element);
          currentPageIdx++;
          pages.push([]);
          currentRemainingHeight = CONTENT_HEIGHT_SUBSEQUENT;
        } else {
          // Start a clean new page
          currentPageIdx++;
          pages.push([item.element]);
          currentRemainingHeight = CONTENT_HEIGHT_SUBSEQUENT - neededHeight;
        }
      }
    }

    // Remove trailing empty page if any
    const finalPages = pages.filter(p => p.length > 0);
    const totalPages = finalPages.length;

    // 4. Build A4 DOM Pages using [Header] + [Content Area] + [Footer] Model
    const pageDoms: HTMLElement[] = [];

    finalPages.forEach((pageSections, pageIdx) => {
      const pageContainer = document.createElement('div');
      pageContainer.className = 'pdf-a4-page';

      // Header Area
      const headerArea = document.createElement('div');
      if (pageIdx === 0) {
        headerArea.style.height = `${HEADER_HEIGHT_P1}px`;
        headerArea.innerHTML = `
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; font-weight: 700; margin-bottom: 3px;">
              Job Tracker • Technical Study Guide
            </div>
            <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 3px 0; line-height: 1.3; border: none; padding: 0;">
              ${title}
            </h1>
            <div style="font-size: 10.5px; color: #64748b;">
              Published on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        `;
      } else {
        headerArea.style.height = `${HEADER_HEIGHT_SUBSEQUENT}px`;
        headerArea.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; font-size: 8.5px; color: #64748b;">
            <span>Job Tracker • ${title}</span>
            <span>Technical Study Guide</span>
          </div>
        `;
      }
      pageContainer.appendChild(headerArea);

      // Content Area
      const contentArea = document.createElement('div');
      contentArea.className = 'pdf-content-area';
      pageSections.forEach(sec => contentArea.appendChild(sec));
      pageContainer.appendChild(contentArea);

      // Footer Area
      const footerArea = document.createElement('div');
      footerArea.style.height = `${FOOTER_HEIGHT}px`;
      footerArea.style.borderTop = '1px solid #e2e8f0';
      footerArea.style.paddingTop = '8px';
      footerArea.style.display = 'flex';
      footerArea.style.justifyContent = 'space-between';
      footerArea.style.fontSize = '8.5px';
      footerArea.style.color = '#94a3b8';
      footerArea.innerHTML = `
        <span>Job Tracker Study Guide</span>
        <span>Page ${pageIdx + 1} of ${totalPages}</span>
      `;
      pageContainer.appendChild(footerArea);

      sandbox.appendChild(pageContainer);
      pageDoms.push(pageContainer);
    });

    // 5. Render pages into jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    sandbox.style.visibility = 'visible';

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      const pageDom = pageDoms[i];
      const canvas = await html2canvas(pageDom, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: PAGE_WIDTH,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfPageWidth, pdfPageHeight, undefined, 'FAST');
    }

    pdf.save(`${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-study-guide.pdf`);
  } finally {
    document.body.removeChild(sandbox);
  }
}

/**
 * Exports a Mermaid SVG flowchart to a transparent, high-resolution PNG image
 */
export async function exportSvgToPNG(svgElement: SVGElement, filename: string) {
  try {
    const targetSvg = svgElement.tagName?.toLowerCase() === 'svg' ? svgElement : getMermaidSvgElement();
    if (!targetSvg) throw new Error('Could not locate diagram SVG');

    const clonedSvg = targetSvg.cloneNode(true) as SVGElement;
    const bBox = targetSvg.getBoundingClientRect();
    const viewBox = targetSvg.getAttribute('viewBox');
    let width = bBox.width;
    let height = bBox.height;

    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        width = parts[2];
        height = parts[3];
      }
    }

    width = Math.max(width, 1200);
    height = Math.max(height, 750);

    clonedSvg.setAttribute('width', `${width}px`);
    clonedSvg.setAttribute('height', `${height}px`);

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const base64Data = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = base64Data;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const scale = 3;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pngURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngURL;
    link.download = `${filename.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    link.click();
  } catch (err) {
    console.error('Error exporting flowchart PNG:', err);
    throw err;
  }
}

/**
 * Exports a Mermaid SVG flowchart to a clean white landscape PDF
 */
export async function exportSvgToPDF(svgElement: SVGElement, filename: string, title: string) {
  try {
    const targetSvg = svgElement.tagName?.toLowerCase() === 'svg' ? svgElement : getMermaidSvgElement();
    if (!targetSvg) throw new Error('Could not locate diagram SVG');

    const clonedSvg = targetSvg.cloneNode(true) as SVGElement;
    const bBox = targetSvg.getBoundingClientRect();
    const viewBox = targetSvg.getAttribute('viewBox');
    let width = bBox.width;
    let height = bBox.height;

    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        width = parts[2];
        height = parts[3];
      }
    }

    width = Math.max(width, 1200);
    height = Math.max(height, 750);

    clonedSvg.setAttribute('width', `${width}px`);
    clonedSvg.setAttribute('height', `${height}px`);

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const base64Data = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = base64Data;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const scale = 3;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const isLandscape = canvas.width >= canvas.height;
    const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(13);
    pdf.text(title, 14, 13);

    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Architecture Flowchart • Job Tracker • ${new Date().toLocaleDateString()}`, 14, 19);

    const margin = 12;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2 - 14;

    let targetWidth = maxWidth;
    let targetHeight = (canvas.height * targetWidth) / canvas.width;

    if (targetHeight > maxHeight) {
      targetHeight = maxHeight;
      targetWidth = (canvas.width * targetHeight) / canvas.height;
    }

    const posX = margin + (maxWidth - targetWidth) / 2;
    const posY = 22 + (maxHeight - targetHeight) / 2;

    pdf.addImage(imgData, 'JPEG', posX, posY, targetWidth, targetHeight, undefined, 'FAST');
    pdf.save(`${filename.toLowerCase().replace(/[^a-z0-9]/g, '-')}-diagram.pdf`);
  } catch (err) {
    console.error('Error exporting flowchart PDF:', err);
    throw err;
  }
}
