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
  const contacts = getSavedContacts();

  // 1. Direct phone number check in query (e.g. "+12125550199", "212-555-0199", or "at 9876543210")
  const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,15}/;
  const phoneMatch = trimmed.match(phonePattern);
  if (phoneMatch) {
    const rawNumber = phoneMatch[0];
    const cleanDigits = cleanPhoneNumberForWhatsApp(rawNumber);
    // Check if any contact has this number
    const matchByNum = contacts.find(
      (c) => cleanPhoneNumberForWhatsApp(c.phoneNumber) === cleanDigits
    );
    return {
      name: matchByNum ? matchByNum.name : rawNumber,
      phoneNumber: rawNumber,
      isResolved: true,
    };
  }

  // 2. Name matching against saved contacts
  const lowerQuery = trimmed.toLowerCase();
  
  for (const c of contacts) {
    const cLower = c.name.toLowerCase();
    const firstLower = cLower.split(' ')[0];
    const lastLower = cLower.split(' ').slice(1).join(' ');

    if (
      lowerQuery === cLower ||
      lowerQuery.includes(cLower) ||
      (firstLower && (lowerQuery.includes(firstLower) || lowerQuery === firstLower)) ||
      (lastLower && lowerQuery.includes(lastLower))
    ) {
      return {
        name: c.name,
        phoneNumber: c.phoneNumber,
        isResolved: true,
      };
    }
  }

  // Common aliases
  if (lowerQuery.includes('pepper')) {
    const p = contacts.find((c) => c.name.toLowerCase().includes('pepper'));
    if (p) return { name: p.name, phoneNumber: p.phoneNumber, isResolved: true };
  }
  if (lowerQuery.includes('tony') || lowerQuery.includes('stark')) {
    const t = contacts.find((c) => c.name.toLowerCase().includes('tony'));
    if (t) return { name: t.name, phoneNumber: t.phoneNumber, isResolved: true };
  }
  if (lowerQuery.includes('banner') || lowerQuery.includes('bruce')) {
    const b = contacts.find((c) => c.name.toLowerCase().includes('banner'));
    if (b) return { name: b.name, phoneNumber: b.phoneNumber, isResolved: true };
  }
  if (lowerQuery.includes('rhodey') || lowerQuery.includes('rhodes') || lowerQuery.includes('war machine')) {
    const r = contacts.find((c) => c.name.toLowerCase().includes('rhodes'));
    if (r) return { name: r.name, phoneNumber: r.phoneNumber, isResolved: true };
  }
  if (lowerQuery.includes('happy')) {
    const h = contacts.find((c) => c.name.toLowerCase().includes('happy'));
    if (h) return { name: h.name, phoneNumber: h.phoneNumber, isResolved: true };
  }
  if (lowerQuery.includes('peter') || lowerQuery.includes('spider')) {
    const sp = contacts.find((c) => c.name.toLowerCase().includes('peter'));
    if (sp) return { name: sp.name, phoneNumber: sp.phoneNumber, isResolved: true };
  }

  // Fallback: Default to first contact in directory
  const fallback = contacts[0] || DEFAULT_JARVIS_CONTACTS[0];
  return {
    name: trimmed || fallback.name,
    phoneNumber: fallback.phoneNumber,
    isResolved: false,
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
