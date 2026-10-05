import { JarvisContact } from '../types';

export const DEFAULT_JARVIS_CONTACTS: JarvisContact[] = [
  {
    id: 'contact-pepper',
    name: 'Pepper Potts',
    phoneNumber: '+12125550144',
    role: 'CEO, Stark Industries',
    isFavorite: true,
  },
  {
    id: 'contact-tony',
    name: 'Tony Stark',
    phoneNumber: '+12125550199',
    role: 'Founder / Iron Man',
    isFavorite: true,
  },
  {
    id: 'contact-bruce',
    name: 'Dr. Bruce Banner',
    phoneNumber: '+16175550182',
    role: 'Senior Physicist',
    isFavorite: true,
  },
  {
    id: 'contact-rhodey',
    name: 'Col. James Rhodes',
    phoneNumber: '+17035550177',
    role: 'USAF Liaison / War Machine',
    isFavorite: true,
  },
  {
    id: 'contact-happy',
    name: 'Happy Hogan',
    phoneNumber: '+12125550163',
    role: 'Head of Security',
    isFavorite: false,
  },
  {
    id: 'contact-peter',
    name: 'Peter Parker',
    phoneNumber: '+17185550128',
    role: 'Stark Research Intern',
    isFavorite: false,
  },
];

const CONTACTS_STORAGE_KEY = 'jarvis_mesh_contacts';

/**
 * Loads contacts from local storage or returns the default Stark directory.
 */
export function getSavedContacts(): JarvisContact[] {
  if (typeof window === 'undefined') return DEFAULT_JARVIS_CONTACTS;
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(DEFAULT_JARVIS_CONTACTS));
      return DEFAULT_JARVIS_CONTACTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {}
  return DEFAULT_JARVIS_CONTACTS;
}

/**
 * Saves or updates a contact in the JARVIS address book.
 */
export function saveContactToDirectory(contact: JarvisContact): JarvisContact[] {
  const current = getSavedContacts();
  const existingIdx = current.findIndex(
    (c) => c.id === contact.id || c.name.toLowerCase() === contact.name.toLowerCase()
  );
  let updated: JarvisContact[];
  if (existingIdx >= 0) {
    updated = current.map((c, i) => (i === existingIdx ? { ...c, ...contact } : c));
  } else {
    updated = [contact, ...current];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

/**
 * Normalizes phone numbers for WhatsApp direct URL linking.
 * WhatsApp requires digits only, with country code, without '+' or leading '00' or dashes.
 * Example: '+1 (212) 555-0144' -> '12125550144'
 * Example: '9876543210' -> '9876543210'
 */
export function cleanPhoneNumberForWhatsApp(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }
  return digits;
}

/**
 * Extracts phone number and contact name from natural language query or text.
 * Checks for explicit numbers (e.g. +1234567890, 9876543210) or names matching contacts directory.
 */
export function resolveRecipientContact(query: string): {
  name: string;
  phoneNumber: string;
  isResolved: boolean;
} {
  const trimmed = query.trim();
  if (!trimmed) {
    const fallback = getSavedContacts()[0] || DEFAULT_JARVIS_CONTACTS[0];
    return { name: fallback.name, phoneNumber: fallback.phoneNumber, isResolved: false };
  }

  const contacts = getSavedContacts();

  // 1. Direct phone number check in query (e.g. "+12125550199", "212-555-0199", or "at 9876543210")
  const phonePattern = /(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}|\+?\d{10,15}/;
  const phoneMatch = trimmed.match(phonePattern);
  if (phoneMatch) {
    const rawNumber = phoneMatch[0];
    const cleanDigits = cleanPhoneNumberForWhatsApp(rawNumber);
    if (cleanDigits.length >= 7) {
      // Check if any contact has this number
      const matchByNum = contacts.find(
        (c) => cleanPhoneNumberForWhatsApp(c.phoneNumber) === cleanDigits
      );
      return {
        name: matchByNum ? matchByNum.name : rawNumber,
        phoneNumber: cleanDigits,
        isResolved: true,
      };
    }
  }

  // 2. Name matching against saved contacts
  const lowerQuery = trimmed.toLowerCase();

  for (const c of contacts) {
    const cLower = c.name.toLowerCase();
    const parts = cLower.split(/\s+/);
    const firstLower = parts[0] || '';
    const lastLower = parts.slice(1).join(' ');

    if (
      lowerQuery === cLower ||
      lowerQuery.includes(cLower) ||
      (firstLower && (lowerQuery.includes(firstLower) || lowerQuery === firstLower)) ||
      (lastLower && lowerQuery.includes(lastLower))
    ) {
      return {
        name: c.name,
        phoneNumber: cleanPhoneNumberForWhatsApp(c.phoneNumber),
        isResolved: true,
      };
    }
  }

  // Common aliases & Marvel references
  if (lowerQuery.includes('pepper') || lowerQuery.includes('potts')) {
    const p = contacts.find((c) => c.name.toLowerCase().includes('pepper'));
    if (p) return { name: p.name, phoneNumber: cleanPhoneNumberForWhatsApp(p.phoneNumber), isResolved: true };
  }
  if (lowerQuery.includes('tony') || lowerQuery.includes('stark') || lowerQuery.includes('iron man')) {
    const t = contacts.find((c) => c.name.toLowerCase().includes('tony'));
    if (t) return { name: t.name, phoneNumber: cleanPhoneNumberForWhatsApp(t.phoneNumber), isResolved: true };
  }
  if (lowerQuery.includes('banner') || lowerQuery.includes('bruce') || lowerQuery.includes('hulk')) {
    const b = contacts.find((c) => c.name.toLowerCase().includes('banner'));
    if (b) return { name: b.name, phoneNumber: cleanPhoneNumberForWhatsApp(b.phoneNumber), isResolved: true };
  }
  if (lowerQuery.includes('rhodey') || lowerQuery.includes('rhodes') || lowerQuery.includes('war machine')) {
    const r = contacts.find((c) => c.name.toLowerCase().includes('rhodes'));
    if (r) return { name: r.name, phoneNumber: cleanPhoneNumberForWhatsApp(r.phoneNumber), isResolved: true };
  }
  if (lowerQuery.includes('happy') || lowerQuery.includes('hogan')) {
    const h = contacts.find((c) => c.name.toLowerCase().includes('happy'));
    if (h) return { name: h.name, phoneNumber: cleanPhoneNumberForWhatsApp(h.phoneNumber), isResolved: true };
  }
  if (lowerQuery.includes('peter') || lowerQuery.includes('parker') || lowerQuery.includes('spiderman') || lowerQuery.includes('spider')) {
    const sp = contacts.find((c) => c.name.toLowerCase().includes('peter'));
    if (sp) return { name: sp.name, phoneNumber: cleanPhoneNumberForWhatsApp(sp.phoneNumber), isResolved: true };
  }

  // If query itself contains only digits (e.g. "12125550199")
  const rawClean = cleanPhoneNumberForWhatsApp(trimmed);
  if (rawClean.length >= 7) {
    return {
      name: trimmed,
      phoneNumber: rawClean,
      isResolved: true,
    };
  }

  // Fallback: Contact is unknown/unresolved
  return {
    name: trimmed,
    phoneNumber: '',
    isResolved: false,
  };
}

export interface ParsedMessagingCommand {
  isMessaging: boolean;
  app: 'whatsapp' | 'sms' | 'telegram' | 'signal';
  recipient: string;
  phoneNumber: string;
  content: string;
  isResolved: boolean;
  requiresContactSelection: boolean;
}

/**
 * Parses user speech or text prompt into a structured messaging command,
 * extracting the target app, recipient, phone number, and message content.
 */
export function parseMessagingCommand(prompt: string): ParsedMessagingCommand {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  const isMsg =
    lower.includes('send message') ||
    lower.includes('send a message') ||
    lower.includes('text') ||
    lower.includes('message') ||
    lower.includes('whatsapp') ||
    lower.includes('telegram') ||
    (lower.includes('signal') && (lower.includes('send') || lower.includes('tell')));

  if (!isMsg) {
    return {
      isMessaging: false,
      app: 'whatsapp',
      recipient: '',
      phoneNumber: '',
      content: '',
      isResolved: false,
      requiresContactSelection: false,
    };
  }

  // Determine App
  let app: 'whatsapp' | 'sms' | 'telegram' | 'signal' = 'whatsapp';
  if (lower.includes('whatsapp')) app = 'whatsapp';
  else if (lower.includes('telegram')) app = 'telegram';
  else if (lower.includes('sms') || (lower.includes('text') && !lower.includes('whatsapp'))) app = 'sms';
  else if (lower.includes('signal')) app = 'signal';

  // 1. Direct Phone Number check anywhere in prompt
  const phonePattern = /(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}|\+?\d{10,15}/;
  const phoneMatches = p.match(phonePattern);
  let explicitPhone = '';
  if (phoneMatches) {
    const testDigits = phoneMatches[0].replace(/[^0-9]/g, '');
    if (testDigits.length >= 7) {
      explicitPhone = phoneMatches[0];
    }
  }

  // 2. Extract Message Content:
  // Usually comes after "saying:", "saying", "that", "message is", "content:", "with text", "with message", or ":"
  let content = 'Status synchronized via JARVIS Sovereign Core.';
  let contentIndex = -1;

  const contentTriggers = [
    ' saying: ',
    ' saying ',
    ' that ',
    ' message is ',
    ' content: ',
    ' with text ',
    ' with message ',
  ];

  for (const trigger of contentTriggers) {
    const idx = lower.indexOf(trigger);
    if (idx !== -1) {
      contentIndex = idx;
      content = p.substring(idx + trigger.length).trim();
      break;
    }
  }

  if (contentIndex === -1 && p.includes(':')) {
    const colonIdx = p.indexOf(':');
    if (colonIdx > 4 && !lower.substring(0, colonIdx).includes('http')) {
      content = p.substring(colonIdx + 1).trim();
      contentIndex = colonIdx;
    }
  }

  // Quote check
  const quoteMatch = p.match(/["']([^"']+)["']/);
  if (quoteMatch && quoteMatch[1] && content === 'Status synchronized via JARVIS Sovereign Core.') {
    content = quoteMatch[1].trim();
  }

  // 3. Extract Recipient from portion before content
  const commandHead = contentIndex !== -1 ? p.substring(0, contentIndex) : p;
  const lowerHead = commandHead.toLowerCase();

  let rawRecipient = '';

  const toIdx = lowerHead.lastIndexOf(' to ');
  if (toIdx !== -1) {
    rawRecipient = commandHead.substring(toIdx + 4).trim();
  } else if (lowerHead.includes('tell ')) {
    rawRecipient = commandHead.substring(lowerHead.indexOf('tell ') + 5).trim();
  } else if (lowerHead.includes('message ')) {
    rawRecipient = commandHead.substring(lowerHead.indexOf('message ') + 8).trim();
  } else if (lowerHead.includes('text ')) {
    rawRecipient = commandHead.substring(lowerHead.indexOf('text ') + 5).trim();
  } else if (lowerHead.includes('whatsapp ')) {
    rawRecipient = commandHead.substring(lowerHead.indexOf('whatsapp ') + 9).trim();
  }

  // Clean app phrases from raw recipient string
  rawRecipient = rawRecipient
    .replace(/(?:using|via|on|through)\s+(?:whatsapp|signal|telegram|sms)/gi, '')
    .replace(/(?:whatsapp|signal|telegram|sms)/gi, '')
    .trim();

  // If explicit phone is in the prompt
  if (explicitPhone) {
    if (!rawRecipient || rawRecipient === explicitPhone || cleanPhoneNumberForWhatsApp(rawRecipient) === cleanPhoneNumberForWhatsApp(explicitPhone)) {
      rawRecipient = explicitPhone;
    }
  }

  if (!rawRecipient) {
    rawRecipient = 'someone';
  }

  // Resolve recipient against contacts directory
  const resolved = resolveRecipientContact(explicitPhone || rawRecipient);
  const cleanNumber = cleanPhoneNumberForWhatsApp(explicitPhone || (resolved.isResolved ? resolved.phoneNumber : ''));

  const isResolved = cleanNumber.length >= 7;
  const requiresContactSelection = !isResolved;

  return {
    isMessaging: true,
    app,
    recipient: resolved.isResolved ? resolved.name : rawRecipient,
    phoneNumber: cleanNumber,
    content,
    isResolved,
    requiresContactSelection,
  };
}

/**
 * Generates the direct WhatsApp chat URL that loads the specific contact chat directly
 * with the pre-filled message, bypassing the contact picker modal completely.
 * Format: https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}
 */
export function generateDirectWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanNumber = cleanPhoneNumberForWhatsApp(phoneNumber);
  const encodedText = encodeURIComponent(message.trim());
  if (cleanNumber) {
    return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}
