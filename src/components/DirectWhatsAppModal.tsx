import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  UserCheck,
  Phone,
  ShieldCheck,
  UserPlus,
  Sparkles,
  Zap,
} from 'lucide-react';
import { JarvisContact } from '../types';
import {
  getSavedContacts,
  saveContactToDirectory,
  cleanPhoneNumberForWhatsApp,
  generateDirectWhatsAppUrl,
} from '../utils/contacts';
import { isRunningOnMobilePhone } from '../utils/mobileHardware';
import { playTechBeep, playAuthSuccessSound } from '../utils/audio';

interface DirectWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipient: string;
  initialContent: string;
  onDispatched?: (contactName: string, phoneNumber: string) => void;
}

export function DirectWhatsAppModal({
  isOpen,
  onClose,
  initialRecipient,
  initialContent,
  onDispatched,
}: DirectWhatsAppModalProps) {
  const [contacts, setContacts] = useState<JarvisContact[]>([]);
  const [recipientName, setRecipientName] = useState(initialRecipient || 'Direct Contact');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageContent, setMessageContent] = useState(initialContent || '');
  const [saveToDirectory, setSaveToDirectory] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContacts(getSavedContacts());
      setRecipientName(initialRecipient || 'Direct Contact');
      setMessageContent(initialContent || '');
      setValidationError(null);
    }
  }, [isOpen, initialRecipient, initialContent]);

  if (!isOpen) return null;

  const handleDispatchDirect = (targetName: string, targetPhone: string) => {
    const cleanNumber = cleanPhoneNumberForWhatsApp(targetPhone);
    if (!cleanNumber || cleanNumber.length < 7) {
      setValidationError('Please enter a valid phone number with country code (e.g. +1 212 555 0144).');
      playTechBeep(400, 0.08);
      return;
    }

    if (saveToDirectory) {
      const newContact: JarvisContact = {
        id: `contact-${Date.now()}`,
        name: targetName || 'Direct Contact',
        phoneNumber: targetPhone.startsWith('+') ? targetPhone : `+${targetPhone}`,
        role: 'Verified WhatsApp Recipient',
        isFavorite: false,
      };
      saveContactToDirectory(newContact);
    }

    playAuthSuccessSound();

    const targetUrl = generateDirectWhatsAppUrl(cleanNumber, messageContent);
    const isMobile = isRunningOnMobilePhone();

    if (isMobile) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, '_blank');
    }

    if (onDispatched) {
      onDispatched(targetName, cleanNumber);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-[#090d16]/95 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Glow corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 tracking-wider font-mono-tech uppercase">
                  DIRECT WHATSAPP CHAT LOCK
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-400/30">
                  ZERO PICKER
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bypasses WhatsApp's contact picker haphazard — opens directly into recipient's private chat.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {/* Message Preview Box */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono-tech text-slate-400">
              <span className="flex items-center gap-1 text-cyan-400">
                <MessageSquare className="w-3 h-3" />
                <span>COMPOSED PAYLOAD:</span>
              </span>
              <span className="text-slate-500">Auto-Loaded</span>
            </div>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={2}
              placeholder="Enter message text..."
              className="w-full bg-black/40 border border-white/10 focus:border-emerald-400/50 rounded-xl p-2.5 text-xs font-mono-tech text-emerald-200 placeholder-slate-500 focus:outline-none resize-none"
            />
          </div>

          {/* Quick 1-Tap Select from Saved Contacts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>1-TAP DIRECT DISPATCH FROM CONTACT BOOK:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {contacts.length} Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {contacts.map((c, index) => (
                <button
                  key={`${c.id}-${index}`}
                  type="button"
                  onClick={() => {
                    playTechBeep(1200, 0.03);
                    handleDispatchDirect(c.name, c.phoneNumber);
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/40 text-left transition-all group flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 truncate">
                      {c.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 group-hover:text-emerald-400/80">
                      {c.phoneNumber}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Phone Number Input */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
              <Phone className="w-3.5 h-3.5" />
              <span>OR ENTER DIRECT WHATSAPP NUMBER:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-mono-tech block mb-1">
                  RECIPIENT NAME:
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. John Doe, Alex"
                  className="w-full bg-white/5 border border-white/10 focus:border-cyan-400/50 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono-tech block mb-1">
                  PHONE NUMBER (WITH COUNTRY CODE):
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="+12125550144 or 919876543210"
                  className="w-full bg-white/5 border border-white/10 focus:border-emerald-400/50 rounded-xl px-3 py-2 text-xs font-mono-tech text-emerald-300 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {validationError && (
              <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2 font-mono">
                {validationError}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToDirectory}
                  onChange={(e) => setSaveToDirectory(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Save to JARVIS Directory for future direct dispatch</span>
              </label>

              <button
                type="button"
                onClick={() => handleDispatchDirect(recipientName, phoneNumber)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Direct WhatsApp Launch</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono mt-3">
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Target Contact Lock: Bypasses manual picker</span>
          </div>
          <span className="text-slate-500">Direct Chat Protocol</span>
        </div>
      </div>
    </div>
  );
}
