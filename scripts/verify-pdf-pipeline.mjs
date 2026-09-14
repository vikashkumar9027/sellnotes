import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {
  isValidPdfBuffer,
  detectPdfPageCountFromBuffer,
  storeOriginalPdf,
  getOriginalPdfBuffer,
} from '../lib/server-pdf-vault.ts';

// Helper to construct genuine raw PDF documents with unique page streams
function createTestPdf(pageContents) {
  const pageObjIds = [];
  let currentObj = 3;

  for (let i = 0; i < pageContents.length; i++) {
    const pageId = currentObj++;
    const contentId = currentObj++;
    pageObjIds.push({ pageId, contentId, content: pageContents[i] });
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
      pageContents.length +
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

    const stream = `BT /F1 14 Tf 50 750 Td (${p.content}) Tj ET`;
    addObj(
      p.contentId +
        ' 0 obj\n<< /Length ' +
        stream.length +
        ' >>\nstream\n' +
        stream +
        '\nendstream\nendobj'
    );
  }

  addObj(fontId + ' 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  const startXref = body.length;
  body += 'xref\n0 ' + xref.length + '\n';
  body += '0000000000 65535 f \n';
  for (let i = 1; i < xref.length; i++) {
    body += ('' + xref[i]).padStart(10, '0') + ' 00000 n \n';
  }
  body += 'trailer\n<< /Size ' + xref.length + ' /Root 1 0 R >>\nstartxref\n' + startXref + '\n%%EOF';

  return Buffer.from(body);
}

async function runTests() {
  console.log('--- STARTING PDF PIPELINE VERIFICATION SUITE ---\n');

  // TEST A: A normal text PDF with distinct content on every page
  console.log('▶ TEST A: Text PDF with distinct content per page');
  const pagesA = [
    'UNIT 1: Introduction to Algorithms and Big-O Analysis',
    'UNIT 2: Binary Search Trees and AVL Rotations',
    'UNIT 3: Graph Traversal - BFS and DFS',
  ];
  const pdfA = createTestPdf(pagesA);
  assert(isValidPdfBuffer(pdfA), 'TEST A: Buffer must be valid PDF');
  const countA = detectPdfPageCountFromBuffer(pdfA);
  assert.strictEqual(countA, 3, `TEST A: Expected 3 pages, detected ${countA}`);
  const storedA = await storeOriginalPdf(pdfA, 'algorithms_unit1_3.pdf');
  const fetchedA = await getOriginalPdfBuffer(storedA.pdfPath);
  assert(fetchedA && fetchedA.equals(pdfA), 'TEST A: Fetched PDF must be byte-for-byte identical to original');
  console.log('✓ TEST A PASSED: Page count = 3, byte-for-byte match verified.\n');

  // TEST B: Handwritten/Scanned notes simulation with distinct ink/strokes content
  console.log('▶ TEST B: Handwritten notes PDF simulation with distinct visual contents');
  const pagesB = [
    'Handwritten Page 1: Derivation of Maxwell Equations [Ink Stroke 0x1A]',
    'Handwritten Page 2: Poynting Vector Proof & Surface Integral [Ink Stroke 0x2B]',
    'Handwritten Page 3: Electromagnetic Wave Propagation [Ink Stroke 0x3C]',
    'Handwritten Page 4: Reflection & Refraction at Dielectric Interface [Ink Stroke 0x4D]',
  ];
  const pdfB = createTestPdf(pagesB);
  assert(isValidPdfBuffer(pdfB), 'TEST B: Buffer must be valid PDF');
  const countB = detectPdfPageCountFromBuffer(pdfB);
  assert.strictEqual(countB, 4, `TEST B: Expected 4 pages, detected ${countB}`);
  const storedB = await storeOriginalPdf(pdfB, 'maxwell_handwritten_notes.pdf');
  const fetchedB = await getOriginalPdfBuffer(storedB.pdfPath);
  assert(fetchedB && fetchedB.equals(pdfB), 'TEST B: Fetched PDF must match handwritten original');
  console.log('✓ TEST B PASSED: Page count = 4, handwritten original preserved 100%.\n');

  // TEST C: PDF containing tables, formulas, and diagrams
  console.log('▶ TEST C: PDF with tables and formulas');
  const pagesC = [
    'Table 1: Truth Table for Full Adder (A, B, Cin, Sum, Cout)',
    'Diagram 1: K-Map 4-variable logic minimization diagram',
    'Formula Sheet: Boolean Algebra DeMorgan Theorems and Duals',
  ];
  const pdfC = createTestPdf(pagesC);
  const countC = detectPdfPageCountFromBuffer(pdfC);
  assert.strictEqual(countC, 3, `TEST C: Expected 3 pages, detected ${countC}`);
  const storedC = await storeOriginalPdf(pdfC, 'digital_logic_tables.pdf');
  const fetchedC = await getOriginalPdfBuffer(storedC.pdfPath);
  assert(fetchedC && fetchedC.equals(pdfC), 'TEST C: Byte-for-byte identical match');
  console.log('✓ TEST C PASSED: Tables and diagram PDF verified.\n');

  // TEST D: 1-Page PDF
  console.log('▶ TEST D: Single-page (1 page) PDF');
  const pdfD = createTestPdf(['Single Page Cheat Sheet: Laplace Transforms']);
  const countD = detectPdfPageCountFromBuffer(pdfD);
  assert.strictEqual(countD, 1, `TEST D: Expected 1 page, detected ${countD}`);
  const storedD = await storeOriginalPdf(pdfD, 'cheatsheet_1p.pdf');
  const fetchedD = await getOriginalPdfBuffer(storedD.pdfPath);
  assert(fetchedD && fetchedD.equals(pdfD), 'TEST D: 1-page byte-for-byte exact');
  console.log('✓ TEST D PASSED: 1-page PDF count and byte accuracy verified.\n');

  // TEST E: 50+ Page PDF
  console.log('▶ TEST E: 50+ Page PDF');
  const pagesE = [];
  for (let i = 1; i <= 55; i++) {
    pagesE.push(`Comprehensive Lecture ${i} - Chapter ${i}: Section details and proofs`);
  }
  const pdfE = createTestPdf(pagesE);
  const countE = detectPdfPageCountFromBuffer(pdfE);
  assert.strictEqual(countE, 55, `TEST E: Expected 55 pages, detected ${countE}`);
  const storedE = await storeOriginalPdf(pdfE, 'data_analytics_full_55p.pdf');
  const fetchedE = await getOriginalPdfBuffer(storedE.pdfPath);
  assert(fetchedE && fetchedE.equals(pdfE), 'TEST E: 55-page PDF matches byte-for-byte');
  console.log('✓ TEST E PASSED: 55-page count detected correctly and original file preserved.\n');

  // TEST F: Strict Non-Fallback Verification (No dummy template on missing file)
  console.log('▶ TEST F: Missing file returns null (never dummy data-analytics.pdf)');
  const missingResult = await getOriginalPdfBuffer('/uploads/non-existent-random-file.pdf');
  assert.strictEqual(missingResult, null, 'TEST F: Missing file MUST return null and NEVER a dummy fallback');
  console.log('✓ TEST F PASSED: No silent dummy fallback returned.\n');

  console.log('====================================================');
  console.log('ALL 6 TESTS PASSED SUCCESSFULLY! ZERO DEFECTS FOUND.');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
