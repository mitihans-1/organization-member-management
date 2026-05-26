
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const prisma = new PrismaClient();

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  const counter = await prisma.invoiceCounter.upsert({
    where: { year },
    update: { sequence: { increment: 1 } },
    create: { year, sequence: 1 },
  });
  
  const sequence = counter.sequence.toString().padStart(4, '0');
  return `INV-${year}-${sequence}`;
}

export async function createInvoice(data: {
  organizationId: string;
  memberId?: string;
  subscriptionId?: string;
  planId?: string;
  planType?: 'organization' | 'member';
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  dueDate: Date;
  notes?: string;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  isRecurring?: boolean;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}) {
  const invoiceNumber = await generateInvoiceNumber();
  
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      organizationId: data.organizationId,
      memberId: data.memberId,
      subscriptionId: data.subscriptionId,
      planId: data.planId,
      planType: data.planType,
      status: 'draft',
      subtotal: data.subtotal,
      tax: data.tax || 0,
      discount: data.discount || 0,
      total: data.total,
      dueDate: data.dueDate,
      notes: data.notes,
      billingPeriodStart: data.billingPeriodStart,
      billingPeriodEnd: data.billingPeriodEnd,
      isRecurring: data.isRecurring || false,
      items: {
        create: data.items.map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
      },
    },
    include: {
      items: true,
      organization: true,
      member: true,
    },
  });
  
  return invoice;
}

export async function generateInvoicePDF(invoiceId: string): Promise<string> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      organization: true,
      member: true,
      subscription: true,
      memberSubscriptionPlan: true,
      organizationPlan: true,
    },
  });
  
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  const uploadsDir = path.join(__dirname, '../../uploads/invoices');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const pdfPath = path.join(uploadsDir, `${invoice.invoiceNumber}.pdf`);
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const fontSize = 12;
  const margin = 50;
  
  page.drawText(invoice.organization?.name || 'Organization', {
    x: margin,
    y: height - margin,
    size: 20,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Invoice #${invoice.invoiceNumber}`, {
    x: width - margin - 150,
    y: height - margin,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, {
    x: margin,
    y: height - margin - 30,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, {
    x: width - margin - 150,
    y: height - margin - 30,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  if (invoice.billingPeriodStart && invoice.billingPeriodEnd) {
    page.drawText(`Billing Period: ${new Date(invoice.billingPeriodStart).toLocaleDateString()} - ${new Date(invoice.billingPeriodEnd).toLocaleDateString()}`, {
      x: margin,
      y: height - margin - 60,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }
  
  let yPosition = height - margin - 100;
  
  if (invoice.member) {
    page.drawText('Bill To:', {
      x: margin,
      y: yPosition,
      size: fontSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    page.drawText(invoice.member.name, {
      x: margin,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    
    if (invoice.member.email) {
      yPosition -= 20;
      page.drawText(invoice.member.email, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }
  
  yPosition -= 60;
  
  page.drawText('Description', {
    x: margin,
    y: yPosition,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Qty', {
    x: 350,
    y: yPosition,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Unit Price', {
    x: 420,
    y: yPosition,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Total', {
    x: 510,
    y: yPosition,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 25;
  page.drawLine({
    start: { x: margin, y: yPosition + 5 },
    end: { x: width - margin, y: yPosition + 5 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  
  for (const item of invoice.items) {
    yPosition -= 25;
    page.drawText(item.description, {
      x: margin,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(item.quantity.toString(), {
      x: 350,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`${item.unitPrice.toFixed(2)} ETB`, {
      x: 420,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`${item.total.toFixed(2)} ETB`, {
      x: 510,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }
  
  yPosition -= 40;
  page.drawLine({
    start: { x: margin, y: yPosition + 10 },
    end: { x: width - margin, y: yPosition + 10 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  
  yPosition -= 25;
  page.drawText('Subtotal:', {
    x: 420,
    y: yPosition,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`${invoice.subtotal.toFixed(2)} ETB`, {
    x: 510,
    y: yPosition,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
  
  if (invoice.tax > 0) {
    yPosition -= 25;
    page.drawText('Tax:', {
      x: 420,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`${invoice.tax.toFixed(2)} ETB`, {
      x: 510,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }
  
  if (invoice.discount > 0) {
    yPosition -= 25;
    page.drawText('Discount:', {
      x: 420,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`-${invoice.discount.toFixed(2)} ETB`, {
      x: 510,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }
  
  yPosition -= 30;
  page.drawText('Total:', {
    x: 420,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`${invoice.total.toFixed(2)} ETB`, {
    x: 510,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  if (invoice.notes) {
    yPosition -= 50;
    page.drawText('Notes:', {
      x: margin,
      y: yPosition,
      size: fontSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    page.drawText(invoice.notes, {
      x: margin,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }
  
  yPosition -= 40;
  page.drawText('Status:', {
    x: margin,
    y: yPosition,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(invoice.status.toUpperCase(), {
    x: margin + 60,
    y: yPosition,
    size: fontSize,
    font: fontBold,
    color: invoice.status === 'paid' ? rgb(0, 0.6, 0) : 
           invoice.status === 'overdue' ? rgb(0.8, 0, 0) : rgb(0, 0, 0),
  });
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, pdfBytes);
  
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { pdfUrl: `/uploads/invoices/${invoice.invoiceNumber}.pdf` },
  });
  
  return `/uploads/invoices/${invoice.invoiceNumber}.pdf`;
}

export async function sendInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'sent',
      sentAt: new Date(),
    },
    include: {
      organization: true,
      member: true,
    },
  });
  
  return invoice;
}

export async function markInvoiceAsPaid(invoiceId: string, paymentId?: string) {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'paid',
      paidAt: new Date(),
    },
    include: {
      organization: true,
      member: true,
    },
  });
  
  if (paymentId) {
    await prisma.invoicePayment.create({
      data: {
        invoiceId,
        paymentId,
        amount: invoice.total,
      },
    });
  }
  
  return invoice;
}

export async function voidInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'void',
    },
  });
  
  return invoice;
}

export async function getOverdueInvoices() {
  const now = new Date();
  const invoices = await prisma.invoice.findMany({
    where: {
      status: 'sent',
      dueDate: { lt: now },
    },
    include: {
      organization: true,
      member: true,
    },
  });
  
  return invoices;
}

export async function getInvoicesByOrganization(organizationId: string, filters?: any) {
  const where: any = { organizationId };
  
  if (filters?.status) {
    where.status = filters.status;
  }
  
  if (filters?.startDate && filters?.endDate) {
    where.createdAt = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }
  
  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      items: true,
      member: true,
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return invoices;
}

export async function getInvoicesByMember(memberId: string, organizationId: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      memberId,
      organizationId,
    },
    include: {
      items: true,
      organization: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return invoices;
}

export async function getRecurringPaymentsBySubscription(subscriptionId: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      subscriptionId,
      isRecurring: true,
    },
    include: {
      items: true,
      organization: true,
      member: true,
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return invoices;
}
