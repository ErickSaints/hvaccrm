import PDFDocument from 'pdfkit';
import { Response } from 'express';

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

export function generateInvoicePdf(res: Response, invoice: InvoiceData): void {
  const doc = new PDFDocument({ margin: 50, size: 'Letter' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=factura-${invoice.number}.pdf`);
  doc.pipe(res);

  doc.fontSize(24).font('Helvetica-Bold').text('FACTURA', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(`No. ${invoice.number}`, { align: 'center' });
  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(10).font('Helvetica-Bold').text('RFC: HVAC-CRM-123456-ABC');
  doc.font('Helvetica').text('HVAC-R CRM - by semasi');
  doc.text('www.hvaccrm.com');
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Cliente:');
  doc.font('Helvetica')
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
    .text(`Total: ${formatCurrency(invoice.total)}`, { underline: true });
  doc.moveDown();

  if (invoice.notes) {
    doc.font('Helvetica-Bold').text('Notas:');
    doc.font('Helvetica').text(invoice.notes);
  }

  doc.moveDown();
  doc.fontSize(8).font('Helvetica').fillColor('#666')
    .text('Documento generado electrónicamente por HVAC-R CRM.', { align: 'center' })
    .text(`Generado el: ${formatDate(new Date())}`, { align: 'center' });

  doc.end();
}

export function generateQuotationPdf(res: Response, quotation: QuotationData): void {
  const doc = new PDFDocument({ margin: 50, size: 'Letter' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${quotation.number}.pdf`);
  doc.pipe(res);

  doc.fontSize(24).font('Helvetica-Bold').text('COTIZACIÓN', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(`No. ${quotation.number}`, { align: 'center' });
  if (quotation.title) {
    doc.fontSize(14).font('Helvetica-Bold').text(quotation.title, { align: 'center' });
  }
  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(10).font('Helvetica-Bold').text('Cliente:');
  doc.font('Helvetica')
    .text(`${quotation.customer.companyName || quotation.customer.contactName}`)
    .text(`Contacto: ${quotation.customer.contactName}`)
    .text(`Dirección: ${quotation.customer.address}`)
    .text(`Tel: ${quotation.customer.phone}`)
    .text(`Email: ${quotation.customer.email || 'N/A'}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Vigencia:');
  doc.font('Helvetica').text(quotation.validUntil ? `Válida hasta: ${formatDate(quotation.validUntil)}` : 'No especificada');
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Partidas:', { underline: true });
  doc.moveDown();

  const tableTop = doc.y;
  const colDescriptions = 220;
  const colQty = 60;
  const colUnitPrice = 100;
  const colTotal = 100;

  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Descripción', 50, tableTop);
  doc.text('Cant.', 50 + colDescriptions, tableTop, { width: colQty, align: 'center' });
  doc.text('Precio Unit.', 50 + colDescriptions + colQty, tableTop, { width: colUnitPrice, align: 'right' });
  doc.text('Total', 50 + colDescriptions + colQty + colUnitPrice, tableTop, { width: colTotal, align: 'right' });

  doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
  doc.moveDown();

  doc.font('Helvetica').fontSize(9);
  let y = doc.y;
  for (const item of quotation.items) {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    const descLines = doc.heightOfString(item.description, { width: colDescriptions });
    doc.text(item.description, 50, y, { width: colDescriptions });
    doc.text(String(item.quantity), 50 + colDescriptions, y, { width: colQty, align: 'center' });
    doc.text(formatCurrency(item.unitPrice), 50 + colDescriptions + colQty, y, { width: colUnitPrice, align: 'right' });
    doc.text(formatCurrency(item.total), 50 + colDescriptions + colQty + colUnitPrice, y, { width: colTotal, align: 'right' });

    y += Math.max(descLines, 20);
  }

  doc.moveDown(2);
  doc.font('Helvetica-Bold');
  doc.text(`Subtotal: ${formatCurrency(quotation.subtotal)}`, { align: 'right' });
  doc.text(`Descuento: ${formatCurrency(quotation.discount)}`, { align: 'right' });
  doc.text(`IVA: ${formatCurrency(quotation.tax)}`, { align: 'right' });
  doc.font('Helvetica-Bold').fontSize(12)
    .text(`Total: ${formatCurrency(quotation.total)}`, { align: 'right', underline: true });
  doc.moveDown();

  if (quotation.notes) {
    doc.fontSize(10).font('Helvetica-Bold').text('Notas:');
    doc.font('Helvetica').text(quotation.notes);
  }

  if (quotation.terms) {
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Términos y Condiciones:');
    doc.font('Helvetica').text(quotation.terms);
  }

  doc.moveDown();
  doc.fontSize(8).font('Helvetica').fillColor('#666')
    .text('Documento generado electrónicamente por HVAC-R CRM.', { align: 'center' })
    .text(`Generado el: ${formatDate(new Date())}`, { align: 'center' });

  doc.end();
}
