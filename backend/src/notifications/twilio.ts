import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || '';
const smsFrom = process.env.TWILIO_SMS_FROM || '';

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export function isTwilioConfigured(): boolean {
  return !!(client && (whatsappFrom || smsFrom));
}

export function isWhatsAppConfigured(): boolean {
  return !!(client && whatsappFrom);
}

export function isSmsConfigured(): boolean {
  return !!(client && smsFrom);
}

export async function sendWhatsApp(params: {
  to: string;
  body: string;
}): Promise<boolean> {
  if (!client || !whatsappFrom) {
    console.log(`[twilio] SKIP WhatsApp (not configured): ${params.body.substring(0, 50)}... -> ${params.to}`);
    return false;
  }
  try {
    await client.messages.create({
      from: `whatsapp:${whatsappFrom}`,
      to: `whatsapp:${params.to}`,
      body: params.body,
    });
    console.log(`[twilio] WhatsApp sent -> ${params.to}`);
    return true;
  } catch (err) {
    console.error(`[twilio] WhatsApp error sending to ${params.to}:`, err);
    return false;
  }
}

export async function sendSms(params: {
  to: string;
  body: string;
}): Promise<boolean> {
  if (!client || !smsFrom) {
    console.log(`[twilio] SKIP SMS (not configured): ${params.body.substring(0, 50)}... -> ${params.to}`);
    return false;
  }
  try {
    await client.messages.create({
      from: smsFrom,
      to: params.to,
      body: params.body,
    });
    console.log(`[twilio] SMS sent -> ${params.to}`);
    return true;
  } catch (err) {
    console.error(`[twilio] SMS error sending to ${params.to}:`, err);
    return false;
  }
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  if (cleaned.startsWith('52') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.startsWith('521') && cleaned.length === 13) return `+${cleaned}`;
  if (cleaned.startsWith('+')) return cleaned;
  return `+52${cleaned}`;
}
