import PDFDocument from 'pdfkit';
import { Response } from 'express';

const PRIMARY = '#1e40af';
const PRIMARY_LIGHT = '#dbeafe';
const GRAY_DARK = '#1f2937';
const GRAY_MEDIUM = '#6b7280';
const GRAY_LIGHT = '#f3f4f6';
const BORDER = '#e5e7eb';

const COMPANY = {
  name: 'HVAC-R CRM',
  tagline: 'El CRM inteligente para HVAC-R',
  address: 'Av. Principal 123, Col. Centro',
  city: 'Ciudad de México, CDMX',
  phone: '(55) 1234-5678',
  email: 'contacto@hvaccrm.com',
  website: 'www.hvaccrm.com',
};

const MARGIN_TOP = 50;
const MARGIN_BOTTOM = 50;
const CONTENT_HEIGHT = 720;
const CONTENT_START = 150;

interface QuotationData {
  number: string;
  title?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  validUntil?: Date | null;
  notes?: string | null;
  terms?: string | null;
  customer: {
    companyName?: string | null;
    contactName: string;
    email?: string | null;
    phone: string;
    address: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

function fmt(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function drawHeader(doc: PDFKit.PDFDocument): void {
  doc.rect(0, 0, 612, 90).fill(PRIMARY);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(COMPANY.name, 50, 18);
  doc.fontSize(9).font('Helvetica').text(COMPANY.tagline, 50, 44);
  doc.fontSize(7).font('Helvetica')
    .text(COMPANY.address, 50, 60)
    .text(`${COMPANY.city} | ${COMPANY.phone}`, 50, 72);
  doc.fontSize(7).font('Helvetica')
    .text(COMPANY.email, 380, 60)
    .text(COMPANY.website, 380, 72);
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  doc.fillColor(GRAY_MEDIUM).fontSize(7).font('Helvetica');
  doc.moveTo(50, 740).lineTo(562, 740).stroke(BORDER);
  doc.text('Documento generado electrónicamente por HVAC-R CRM.', 50, 748, { align: 'center' });
  doc.text(`Generado el: ${fmtDate(new Date())}`, 50, 760, { align: 'center' });
}

function needPage(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed > CONTENT_HEIGHT) {
    doc.addPage();
    return CONTENT_START;
  }
  return y;
}

export function generateQuotationPdf(res: Response, quotation: QuotationData): void {
  const doc = new PDFDocument({ margin: 50, size: 'Letter' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${quotation.number}.pdf`);
  doc.pipe(res);

  doc.on('pageAdded', () => {
    drawHeader(doc);
    drawFooter(doc);
  });

  drawHeader(doc);
  drawFooter(doc);

  let y = CONTENT_START;

  doc.fontSize(18).font('Helvetica-Bold').fillColor(PRIMARY).text('COTIZACIÓN', 50, y);
  y += 24;
  doc.fontSize(9).font('Helvetica').fillColor(GRAY_MEDIUM).text(`No. ${quotation.number}`, 50, y);
  y += 16;

  if (quotation.title) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor(GRAY_DARK).text(quotation.title, 50, y);
    y += 18;
  }

  y += 4;
  doc.moveTo(50, y).lineTo(562, y).stroke(BORDER);
  y += 12;

  y = needPage(doc, y, 120);

  doc.rect(50, y, 250, 4).fill(PRIMARY_LIGHT);
  doc.rect(310, y, 252, 4).fill(PRIMARY_LIGHT);

  doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY_DARK);
  doc.text('CLIENTE', 58, y + 10);
  doc.text('VIGENCIA', 318, y + 10);

  const cy = y + 24;
  doc.fontSize(9).font('Helvetica').fillColor(GRAY_DARK);
  const customerLines = quotation.customer.companyName
    ? `${quotation.customer.companyName}\n${quotation.customer.contactName}\n${quotation.customer.address}`
    : `${quotation.customer.contactName}\n${quotation.customer.address}`;

  doc.text(customerLines, 58, cy, { width: 240 });
  const ch = doc.heightOfString(customerLines, { width: 240 }) + 8;

  doc.text(quotation.validUntil ? `Válida hasta: ${fmtDate(quotation.validUntil)}` : 'No especificada', 318, cy);
  doc.text(`Tel: ${quotation.customer.phone}`, 318, cy + 20);
  if (quotation.customer.email) {
    doc.text(`Email: ${quotation.customer.email}`, 318, cy + 34);
  }

  y = cy + Math.max(ch, 70) + 8;

  y = needPage(doc, y, 40);

  const left = 50;
  const right = 562;
  const tw = right - left;
  const cd = tw * 0.44;
  const cq = tw * 0.13;
  const cp = tw * 0.21;
  const ct = tw * 0.22;
  const rh = 20;

  doc.rect(left, y, tw, 24).fill(PRIMARY);
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('Descripción', left + 8, y + 7);
  doc.text('Cant.', left + cd, y + 7, { width: cq, align: 'center' });
  doc.text('Precio Unit.', left + cd + cq, y + 7, { width: cp, align: 'right' });
  doc.text('Total', left + cd + cq + cp, y + 7, { width: ct, align: 'right' });

  y += 24;
  doc.fillColor(GRAY_DARK).fontSize(8).font('Helvetica');

  for (let i = 0; i < quotation.items.length; i++) {
    y = needPage(doc, y, rh + 4);

    if (i % 2 === 1) {
      doc.rect(left, y, tw, rh).fill(GRAY_LIGHT);
      doc.fillColor(GRAY_DARK);
    }
    doc.fillColor(GRAY_DARK);
    doc.text(quotation.items[i].description, left + 8, y + 3, { width: cd - 16 });
    doc.text(String(quotation.items[i].quantity), left + cd, y + 3, { width: cq, align: 'center' });
    doc.text(fmt(quotation.items[i].unitPrice), left + cd + cq, y + 3, { width: cp, align: 'right' });
    doc.text(fmt(quotation.items[i].total), left + cd + cq + cp, y + 3, { width: ct, align: 'right' });
    doc.moveTo(left, y + rh - 1).lineTo(right, y + rh - 1).stroke(BORDER);
    y += rh;
  }

  y += 4;
  doc.moveTo(left, y).lineTo(right, y).stroke(GRAY_MEDIUM);
  y += 10;

  y = needPage(doc, y, 100);

  const tl = 562 - 190;
  const totLines: { label: string; value: string; bold?: boolean; red?: boolean }[] = [
    { label: 'Subtotal:', value: fmt(quotation.subtotal) },
    { label: 'Descuento:', value: `-${fmt(quotation.discount)}`, red: quotation.discount > 0 },
    { label: 'IVA:', value: fmt(quotation.tax) },
    { label: 'Total:', value: fmt(quotation.total), bold: true },
  ];

  for (const line of totLines) {
    if (line.bold) {
      doc.rect(tl - 8, y - 2, 198, 22).fill(PRIMARY_LIGHT);
      doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold');
    } else {
      doc.fillColor(line.red ? '#dc2626' : GRAY_DARK).fontSize(8).font('Helvetica');
    }
    doc.text(line.label, tl, y, { width: 90, align: 'left' });
    doc.text(line.value, tl + 90, y, { width: 90, align: 'right' });
    y += 18;
  }

  y += 8;

  if (quotation.notes) {
    y = needPage(doc, y, 40);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY_DARK).text('Notas:', 50, y);
    y += 14;
    doc.fontSize(8).font('Helvetica').fillColor(GRAY_MEDIUM).text(quotation.notes, 50, y, { width: 512 });
    y = doc.y + 12;
  }

  if (quotation.terms) {
    y = needPage(doc, y, 40);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY_DARK).text('Términos y Condiciones:', 50, y);
    y += 14;
    doc.fontSize(8).font('Helvetica').fillColor(GRAY_MEDIUM).text(quotation.terms, 50, y, { width: 512 });
  }

  doc.end();
}

export function generateInvoicePdf(res: Response, invoice: any): void {
  const doc = new PDFDocument({ margin: 50, size: 'Letter' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=factura-${invoice.number}.pdf`);
  doc.pipe(res);

  doc.on('pageAdded', () => {
    drawHeader(doc);
    drawFooter(doc);
  });

  drawHeader(doc);
  drawFooter(doc);

  let y = MARGIN_TOP + 100;

  doc.fontSize(18).font('Helvetica-Bold').fillColor(PRIMARY).text('FACTURA', 50, y);
  y += 22;
  doc.fontSize(9).font('Helvetica').fillColor(GRAY_MEDIUM).text(`No. ${invoice.number}`, 50, y);
  y += 16;

  doc.moveTo(50, y).lineTo(562, y).stroke(BORDER);
  y += 12;

  y = needPage(doc, y, 180);

  doc.rect(50, y, 250, 4).fill(PRIMARY_LIGHT);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY_DARK).text('CLIENTE', 58, y + 10);
  y += 18;
  doc.fontSize(9).font('Helvetica').fillColor(GRAY_DARK);
  doc.text(`${invoice.customer.companyName || invoice.customer.contactName}`, 58, y);
  y += 12;
  doc.text(`Contacto: ${invoice.customer.contactName}`, 58, y);
  y += 10;
  doc.text(`RFC: ${invoice.customer.taxId || 'N/A'}`, 58, y);
  y += 10;
  doc.text(`Dirección: ${invoice.customer.address}`, 58, y);
  y += 10;
  doc.text(`Tel: ${invoice.customer.phone}`, 58, y);
  y += 10;
  if (invoice.customer.email) {
    doc.text(`Email: ${invoice.customer.email}`, 58, y);
    y += 10;
  }
  y += 8;

  y = needPage(doc, y, 100);
  doc.rect(50, y, 250, 4).fill(PRIMARY_LIGHT);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY_DARK).text('DATOS DE LA FACTURA', 58, y + 10);
  y += 18;
  doc.fontSize(9).font('Helvetica').fillColor(GRAY_DARK);
  doc.text(`Estado: ${invoice.status}`, 58, y); y += 10;
  doc.text(`Fecha de Vencimiento: ${fmtDate(invoice.dueDate)}`, 58, y); y += 10;
  doc.text(`Fecha de Pago: ${fmtDate(invoice.paidAt)}`, 58, y); y += 10;
  doc.text(`Creada por: ${invoice.createdBy.name}`, 58, y); y += 14;

  doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY_DARK).text('Resumen:', 58, y); y += 14;
  doc.fontSize(9).font('Helvetica').fillColor(GRAY_DARK);
  doc.text(`Subtotal: ${fmt(invoice.subtotal)}`, 58, y); y += 10;
  doc.text(`Descuento: ${fmt(invoice.discount)}`, 58, y); y += 10;
  doc.text(`IVA: ${fmt(invoice.tax)}`, 58, y); y += 10;
  doc.font('Helvetica-Bold').fillColor(PRIMARY).fontSize(11).text(`Total: ${fmt(invoice.total)}`, 58, y); y += 16;

  if (invoice.notes) {
    y = needPage(doc, y, 30);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY_DARK).text('Notas:', 50, y); y += 12;
    doc.fontSize(8).font('Helvetica').fillColor(GRAY_MEDIUM).text(invoice.notes, 50, y, { width: 512 });
  }

  doc.end();
}
