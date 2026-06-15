import PDFDocument from 'pdfkit';
import { Response } from 'express';

const PRIMARY = '#1e40af';
const PRIMARY_LIGHT = '#dbeafe';
const GRAY_DARK = '#1f2937';
const GRAY_MEDIUM = '#6b7280';
const GRAY_LIGHT = '#f3f4f6';
const BORDER = '#e5e7eb';
const WHITE = '#ffffff';

const COMPANY = {
  name: 'HVAC-R CRM',
  tagline: 'El CRM inteligente para HVAC-R',
  rfc: 'HCRM-123456-ABC',
  address: 'Av. Principal 123, Col. Centro',
  city: 'Ciudad de México, CDMX',
  phone: '(55) 1234-5678',
  email: 'contacto@hvaccrm.com',
  website: 'www.hvaccrm.com',
};

interface InvoiceData {
  number: string;
  title: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  dueDate?: Date | null;
  paidAt?: Date | null;
  notes?: string | null;
  customer: {
    companyName?: string | null;
    contactName: string;
    email?: string | null;
    phone: string;
    address: string;
    taxId?: string | null;
  };
  createdBy: {
    name: string;
  };
}

interface QuotationData {
  number: string;
  title?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status?: string;
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

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function drawHeader(doc: PDFKit.PDFDocument): void {
  doc.rect(0, 0, 612, 100).fill(PRIMARY);

  doc.fillColor(WHITE).fontSize(22).font('Helvetica-Bold')
    .text(COMPANY.name, 50, 20);

  doc.fontSize(10).font('Helvetica')
    .text(COMPANY.tagline, 50, 48);

  doc.fontSize(8).font('Helvetica')
    .text(COMPANY.address, 50, 65)
    .text(`${COMPANY.city} | ${COMPANY.phone}`, 50, 78);

  doc.fontSize(8).font('Helvetica')
    .text(COMPANY.email, 380, 65)
    .text(COMPANY.website, 380, 78);

  doc.fillColor(GRAY_DARK);
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  doc.fillColor(GRAY_MEDIUM).fontSize(7).font('Helvetica');

  const bottomY = 740;

  doc.moveTo(50, bottomY).lineTo(562, bottomY).stroke(BORDER);

  doc.text('Documento generado electrónicamente por HVAC-R CRM.', 50, bottomY + 8, { align: 'center' })
    .text(`Generado el: ${formatDate(new Date())}`, 50, bottomY + 20, { align: 'center' });

  doc.fillColor(GRAY_DARK);
}

function drawItemsTable(doc: PDFKit.PDFDocument, items: QuotationData['items'], startY: number): number {
  const left = 50;
  const right = 562;
  const tableWidth = right - left;

  const colDesc = tableWidth * 0.45;
  const colQty = tableWidth * 0.12;
  const colPrice = tableWidth * 0.21;
  const colTotal = tableWidth * 0.22;
  const rowHeight = 22;
  const headerHeight = 28;
  let y = startY;

  if (y + headerHeight + 20 > 700) {
    doc.addPage();
    y = 50;
  }

  doc.rect(left, y, tableWidth, headerHeight).fill(PRIMARY);
  doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold');
  doc.text('Descripción', left + 8, y + 8);
  doc.text('Cant.', left + colDesc, y + 8, { width: colQty, align: 'center' });
  doc.text('Precio Unit.', left + colDesc + colQty, y + 8, { width: colPrice, align: 'right' });
  doc.text('Total', left + colDesc + colQty + colPrice, y + 8, { width: colTotal, align: 'right' });

  y += headerHeight;

  doc.fillColor(GRAY_DARK).fontSize(9).font('Helvetica');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (y + rowHeight > 700) {
      doc.addPage();
      y = 50;
    }

    if (i % 2 === 1) {
      doc.rect(left, y, tableWidth, rowHeight).fill(GRAY_LIGHT);
    }

    doc.fillColor(GRAY_DARK).font('Helvetica');
    doc.text(item.description, left + 8, y + 4, { width: colDesc - 16 });
    doc.text(String(item.quantity), left + colDesc, y + 4, { width: colQty, align: 'center' });
    doc.text(formatCurrency(item.unitPrice), left + colDesc + colQty, y + 4, { width: colPrice, align: 'right' });
    doc.text(formatCurrency(item.total), left + colDesc + colQty + colPrice, y + 4, { width: colTotal, align: 'right' });

    doc.moveTo(left, y + rowHeight - 1).lineTo(right, y + rowHeight - 1).stroke(BORDER);

    y += rowHeight;
  }

  y += 6;

  doc.moveTo(left, y).lineTo(right, y).stroke(GRAY_MEDIUM);

  return y + 10;
}

function drawTotals(doc: PDFKit.PDFDocument, data: { subtotal: number; discount: number; tax: number; total: number }, y: number): number {
  const left = 562 - 200;
  const labelWidth = 100;
  const valueWidth = 100;
  const rowH = 20;

  const lines: { label: string; value: string; bold?: boolean; color?: string }[] = [
    { label: 'Subtotal:', value: formatCurrency(data.subtotal) },
    { label: 'Descuento:', value: `-${formatCurrency(data.discount)}`, color: data.discount > 0 ? '#dc2626' : GRAY_MEDIUM },
    { label: 'IVA:', value: formatCurrency(data.tax) },
    { label: 'Total:', value: formatCurrency(data.total), bold: true },
  ];

  for (const line of lines) {
    if (line.bold) {
      doc.rect(left - 8, y - 2, 208, rowH + 4).fill(PRIMARY_LIGHT);
      doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold');
    } else {
      doc.fillColor(line.color || GRAY_DARK).fontSize(9).font('Helvetica');
    }

    doc.text(line.label, left, y, { width: labelWidth, align: 'left' });
    doc.text(line.value, left + labelWidth, y, { width: valueWidth, align: 'right' });
    y += rowH;
  }

  doc.fillColor(GRAY_DARK);
  return y;
}

export function generateInvoicePdf(res: Response, invoice: InvoiceData): void {
  const doc = new PDFDocument({ margin: 50, size: 'Letter' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=factura-${invoice.number}.pdf`);
  doc.pipe(res);

  drawHeader(doc);

  doc.fontSize(20).font('Helvetica-Bold').fillColor(PRIMARY)
    .text('FACTURA', 50, 120);
  doc.fontSize(10).font('Helvetica').fillColor(GRAY_MEDIUM)
    .text(`No. ${invoice.number}`, 50, 145);

  doc.fillColor(GRAY_DARK);
  doc.moveTo(50, doc.y + 10).lineTo(562, doc.y + 10).stroke(BORDER);
  doc.moveDown(2);

  doc.fontSize(10).font('Helvetica-Bold').text('Cliente:');
  doc.font('Helvetica').fontSize(9)
    .text(`${invoice.customer.companyName || invoice.customer.contactName}`)
    .text(`Contacto: ${invoice.customer.contactName}`)
    .text(`RFC: ${invoice.customer.taxId || 'N/A'}`)
    .text(`Dirección: ${invoice.customer.address}`)
    .text(`Tel: ${invoice.customer.phone}`)
    .text(`Email: ${invoice.customer.email || 'N/A'}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Datos de la Factura:');
  doc.font('Helvetica')
    .text(`Estado: ${invoice.status}`)
    .text(`Fecha de Vencimiento: ${formatDate(invoice.dueDate)}`)
    .text(`Fecha de Pago: ${formatDate(invoice.paidAt)}`)
    .text(`Creada por: ${invoice.createdBy.name}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Resumen:');
  doc.font('Helvetica')
    .text(`Subtotal: ${formatCurrency(invoice.subtotal)}`)
    .text(`Descuento: ${formatCurrency(invoice.discount)}`)
    .text(`IVA: ${formatCurrency(invoice.tax)}`)
    .font('Helvetica-Bold')
    .text(`Total: ${formatCurrency(invoice.total)}`);
  doc.moveDown();

  if (invoice.notes) {
    doc.font('Helvetica-Bold').text('Notas:');
    doc.font('Helvetica').text(invoice.notes);
  }

  drawFooter(doc);
  doc.end();
}

export function generateQuotationPdf(res: Response, quotation: QuotationData): void {
  const doc = new PDFDocument({ margin: 50, size: 'Letter' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${quotation.number}.pdf`);
  doc.pipe(res);

  drawHeader(doc);

  doc.fontSize(20).font('Helvetica-Bold').fillColor(PRIMARY)
    .text('COTIZACIÓN', 50, 120);
  doc.fontSize(9).font('Helvetica').fillColor(GRAY_MEDIUM)
    .text(`No. ${quotation.number}`, 50, 145);

  if (quotation.title) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor(GRAY_DARK)
      .text(quotation.title, 50, 162);
  }

  doc.fillColor(GRAY_DARK);

  const infoY = quotation.title ? 185 : 170;
  doc.moveTo(50, infoY).lineTo(562, infoY).stroke(BORDER);
  let y = infoY + 15;

  doc.rect(50, y, 250, 4).fill(PRIMARY_LIGHT);
  doc.rect(310, y, 252, 4).fill(PRIMARY_LIGHT);

  doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY_DARK);
  doc.text('Cliente', 58, y + 10);
  doc.text('Vigencia', 318, y + 10);

  doc.fontSize(9).font('Helvetica').fillColor(GRAY_DARK);
  const customerLine = y + 26;

  const customerInfo = quotation.customer.companyName
    ? `${quotation.customer.companyName}\n${quotation.customer.contactName}\n${quotation.customer.address}`
    : `${quotation.customer.contactName}\n${quotation.customer.address}`;

  doc.text(customerInfo, 58, customerLine, { width: 240 });

  const validUntilText = quotation.validUntil
    ? `Válida hasta: ${formatDate(quotation.validUntil)}`
    : 'No especificada';
  doc.text(validUntilText, 318, customerLine);
  doc.text(`Tel: ${quotation.customer.phone}`, 318, customerLine + 30);
  if (quotation.customer.email) {
    doc.text(`Email: ${quotation.customer.email}`, 318, customerLine + 45);
  }

  const customerBlockHeight = Math.max(
    60,
    30 + doc.heightOfString(customerInfo, { width: 240 }) + 10
  );

  y = customerLine + customerBlockHeight + 10;
  y = drawItemsTable(doc, quotation.items, y);

  y = drawTotals(doc, quotation, y);
  y += 10;

  if (quotation.notes) {
    if (y + 60 > 700) {
      doc.addPage();
      y = 50;
    }
    doc.fontSize(10).font('Helvetica-Bold').fillColor(GRAY_DARK).text('Notas:');
    doc.fontSize(9).font('Helvetica').fillColor(GRAY_MEDIUM).text(quotation.notes, { width: 512 });
    y = doc.y + 15;
  }

  if (quotation.terms) {
    if (y + 60 > 700) {
      doc.addPage();
      y = 50;
    }
    doc.fontSize(10).font('Helvetica-Bold').fillColor(GRAY_DARK).text('Términos y Condiciones:');
    doc.fontSize(9).font('Helvetica').fillColor(GRAY_MEDIUM).text(quotation.terms, { width: 512 });
  }

  drawFooter(doc);
  doc.end();
}
