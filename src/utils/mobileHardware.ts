import { 
  resolveRecipientContact, 
  cleanPhoneNumberForWhatsApp, 
  generateDirectWhatsAppUrl 
} from './contacts';

/**
 * Mobile Hardware Operation Bridge
 * 
 * Enables JARVIS to directly operate the mobile device it is running on:
 * - Camera Torch / Flashlight hardware control via MediaStream track constraints
 * - Haptic vibration motor for calls, rings, and security alarms via navigator.vibrate
 * - Battery level and charging status telemetry via navigator.getBattery
 * - Cellular telephony dialer (tel:) and instant messaging intents (WhatsApp / SMS)
 * - Screen WakeLock management to keep the phone display active
 */

let activeTorchStream: MediaStream | null = null;
let activeTorchTrack: MediaStreamTrack | null = null;

/**
 * Detects if the current client is running directly on a mobile phone (Android, iOS, or mobile browser).
 */
export function isRunningOnMobilePhone(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isSmallScreen = window.matchMedia && window.matchMedia('(max-width: 820px)').matches;
  const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  return isMobileUA || isSmallScreen || isStandalone;
}

/**
 * Returns the detected mobile platform name.
 */
export function getHostMobilePlatformName(): string {
  if (typeof window === 'undefined') return 'Local Node';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'Android Host Unit (This Phone)';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'Apple iOS Host Unit (This Phone)';
  if (isRunningOnMobilePhone()) return 'Mobile Device (This Phone)';
  return 'Local Host Workstation';
}

/**
 * Toggles the physical camera flash / torch on supported mobile devices (Chrome on Android).
 */
export async function toggleHardwareTorch(forceState?: boolean): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return forceState ?? false;
  }

  // Turn off existing torch
  if (activeTorchTrack) {
    if (forceState === false || forceState === undefined) {
      try {
        await (activeTorchTrack as any).applyConstraints({ advanced: [{ torch: false }] });
      } catch {}
      activeTorchTrack.stop();
      activeTorchStream?.getTracks().forEach((t) => t.stop());
      activeTorchTrack = null;
      activeTorchStream = null;
      return false;
    }
  }

  // Turn on torch
  if (forceState === true || forceState === undefined) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          advanced: [{ torch: true }] as any,
        },
      });

      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = track.getCapabilities?.() || {};
        if (capabilities.torch) {
          await (track as any).applyConstraints({ advanced: [{ torch: true }] });
          activeTorchStream = stream;
          activeTorchTrack = track;
          return true;
        }
      }
    } catch (err) {
      console.log('[JARVIS Hardware] Camera torch not accessible or permission denied, using UI flashlight.');
    }
  }

  return forceState ?? true;
}

/**
 * Triggers hardware vibration patterns on the mobile phone (e.g. for phone ringing, alarms, and alerts).
 */
export function vibrateMobileDevice(pattern: number[] = [300, 150, 300, 150, 500]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

/**
 * Stops any ongoing vibration on the mobile phone.
 */
export function cancelMobileVibration() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {}
  }
}

/**
 * Queries hardware battery level and charging status from the browser Battery API.
 */
export async function queryHardwareBattery(): Promise<{ level: number; charging: boolean } | null> {
  if (typeof window === 'undefined' || !(navigator as any).getBattery) {
    return null;
  }

  try {
    const battery = await (navigator as any).getBattery();
    return {
      level: Math.round(battery.level * 100),
      charging: Boolean(battery.charging),
    };
  } catch {
    return null;
  }
}

/**
 * Launches the native cellular dialer on this phone with the target phone number.
 */
export function dialCellularCallOnPhone(phoneNumber: string) {
  if (typeof window === 'undefined') return;
  const cleanNumber = phoneNumber.replace(/[^0-9+*#]/g, '');
  window.location.href = `tel:${cleanNumber}`;
}

/**
 * Dispatches message via native apps on this phone (WhatsApp, SMS, or Telegram).
 * When WhatsApp is chosen, looks up the contact's phone number and creates a direct
 * chat link (https://api.whatsapp.com/send?phone=...&text=...) so WhatsApp opens
 * directly into that specific contact's chat with zero manual contact selection.
 */
export function dispatchNativeMessageOnPhone(
  app: 'whatsapp' | 'sms' | 'telegram' | 'signal',
  recipientIdentifier: string,
  content: string,
  explicitPhoneNumber?: string
) {
  if (typeof window === 'undefined') return;

  // Resolve recipient contact and phone number
  const resolved = resolveRecipientContact(explicitPhoneNumber || recipientIdentifier);
  const targetPhone = explicitPhoneNumber || (resolved.isResolved ? resolved.phoneNumber : '');
  const cleanNumber = cleanPhoneNumberForWhatsApp(targetPhone);
  const encodedText = encodeURIComponent(content);

  if (app === 'whatsapp') {
    // If no clean phone number is available (e.g. unknown contact or "someone"),
    // DO NOT open WhatsApp's generic share URL (which causes the manual contact picker haphazard).
    // Instead, trigger the Direct WhatsApp Chat Lock Modal so the user can tap a saved contact
    // or enter a phone number to load directly into their private chat thread.
    if (!cleanNumber) {
      window.dispatchEvent(
        new CustomEvent('jarvis_open_direct_whatsapp_modal', {
          detail: {
            recipient: recipientIdentifier || 'Direct Contact',
            content,
            app: 'whatsapp',
          },
        })
      );
      return;
    }

    // Direct WhatsApp chat link directly targeting the contact's phone number
    const targetUrl = generateDirectWhatsAppUrl(cleanNumber, content);
    
    // On mobile devices, window.location.href opens the native WhatsApp app seamlessly
    const isMobile = isRunningOnMobilePhone();
    if (isMobile) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, '_blank');
    }
  } else if (app === 'sms') {
    const smsUrl = cleanNumber ? `sms:${cleanNumber}?body=${encodedText}` : `sms:?body=${encodedText}`;
    window.location.href = smsUrl;
  } else if (app === 'telegram') {
    window.open(`https://t.me/share/url?url=&text=${encodedText}`, '_blank');
  }
}

let activeWakeLockSentinel: any = null;

/**
 * Toggles Screen Wake Lock on mobile device to prevent display dimming/sleeping.
 */
export async function toggleScreenWakeLock(forceState?: boolean): Promise<boolean> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }

  try {
    if (activeWakeLockSentinel) {
      if (forceState === false || forceState === undefined) {
        await activeWakeLockSentinel.release();
        activeWakeLockSentinel = null;
        return false;
      }
      return true;
    }

    if (forceState === true || forceState === undefined) {
      activeWakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      activeWakeLockSentinel.addEventListener('release', () => {
        activeWakeLockSentinel = null;
      });
      return true;
    }
  } catch (err) {
    console.log('[JARVIS WakeLock] Screen wake lock not permitted or interrupted:', err);
  }

  return Boolean(activeWakeLockSentinel);
}

/**
 * Checks if screen wake lock is currently active on the device.
 */
export function isWakeLockActive(): boolean {
  return Boolean(activeWakeLockSentinel);
}
