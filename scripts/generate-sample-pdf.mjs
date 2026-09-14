import fs from 'fs';
import path from 'path';

export function generatePdfBuffer(title = 'NoteMart Study Notes', pagesCount = 10) {
  const pageObjIds = [];
  let currentObj = 3;

  for (let i = 1; i <= pagesCount; i++) {
    const pageId = currentObj++;
    const contentId = currentObj++;
    pageObjIds.push({ pageId, contentId, pageNum: i });
  }

  const fontId = currentObj++;

  let body = '%PDF-1.4\n';
  const xref = [0];

  function addObj(str) {
    xref.push(body.length);
    body += str + '\n';
  }

  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  addObj(
    '2 0 obj\n<< /Type /Pages /Kids [' +
      pageObjIds.map((p) => p.pageId + ' 0 R').join(' ') +
      '] /Count ' +
      pagesCount +
      ' >>\nendobj'
  );

  for (const p of pageObjIds) {
    addObj(
      p.pageId +
        ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ' +
        p.contentId +
        ' 0 R /Resources << /Font << /F1 ' +
        fontId +
        ' 0 R >> >> >>\nendobj'
    );

    const sanitizedTitle = title.replace(/[()]/g, '');
    const textStream = [
      'BT',
      '/F1 18 Tf',
      '50 790 Td',
      `(${sanitizedTitle}) Tj`,
      '/F1 12 Tf',
      '0 -35 Td',
      `(NoteMart Verified Handwritten Study Material - Page ${p.pageNum} of ${pagesCount}) Tj`,
      '0 -30 Td',
      `(Chapter ${p.pageNum}: Core Concepts, Solved Examples & Exam Formulas) Tj`,
      '0 -35 Td',
      '(1. Key Concept Overview:) Tj',
      '0 -22 Td',
      '(These comprehensive handwritten notes cover all syllabus units thoroughly.) Tj',
      '0 -20 Td',
      '(Includes definitions, structural diagrams, step-by-step algorithms and derivations.) Tj',
      '0 -35 Td',
      '(2. Solved Formulas & Important Highlights:) Tj',
      '0 -22 Td',
      '(High-yield university question patterns and rapid revision shortcuts.) Tj',
      '0 -20 Td',
      '(Formula / Technique: Comprehensive examination highlights and proofs.) Tj',
      '0 -35 Td',
      '(3. Summary & Practice Points:) Tj',
      '0 -22 Td',
      '(Prepared and verified by toppers for university and competitive exam prep.) Tj',
      '0 -350 Td',
      '/F1 10 Tf',
      '(Protected by NoteMart Digital Content Rights - In-Platform & Download Access) Tj',
      'ET',
    ].join('\n');

    addObj(
      p.contentId +
        ' 0 obj\n<< /Length ' +
        textStream.length +
        ' >>\nstream\n' +
        textStream +
        '\nendstream\nendobj'
    );
  }

  addObj(fontId + ' 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  const startXref = body.length;
  body += 'xref\n';
  body += '0 ' + xref.length + '\n';
  body += '0000000000 65535 f \n';
  for (let i = 1; i < xref.length; i++) {
    body += ('' + xref[i]).padStart(10, '0') + ' 00000 n \n';
  }
  body += 'trailer\n<< /Size ' + xref.length + ' /Root 1 0 R >>\nstartxref\n' + startXref + '\n%%EOF';

  return Buffer.from(body);
}

// Generate files if executed directly
const targetDir = path.join(process.cwd(), 'public', 'sample-notes');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, 'sample.pdf'), generatePdfBuffer('NoteMart Master Study Guide', 15));
fs.writeFileSync(
  path.join(targetDir, 'data-analytics.pdf'),
  generatePdfBuffer('Data Analytics B.Tech CSE AKTU Complete Notes', 50)
);

console.log('Sample PDFs created successfully.');
