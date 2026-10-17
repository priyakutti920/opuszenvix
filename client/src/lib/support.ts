/**
 * Support phone and messaging configuration.
 * Dynamically loaded from Vite environment variables (VITE_SUPPORT_PHONE_NUMBER).
 * Never hardcodes phone numbers into client bundles or repository source files.
 */

export function getRawSupportPhoneNumber(): string {
  const envPhone = import.meta.env.VITE_SUPPORT_PHONE_NUMBER;
  if (typeof envPhone === 'string' && envPhone.trim()) {
    return envPhone.trim();
  }
  return '';
}

export function getCleanSupportPhoneDigits(): string {
  const raw = getRawSupportPhoneNumber();
  // Strip all non-digit characters
  return raw.replace(/\D/g, '');
}

export function getDisplaySupportPhoneNumber(): string {
  const raw = getRawSupportPhoneNumber();
  if (!raw) return '';
  const digits = getCleanSupportPhoneDigits();
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return raw.startsWith('+') ? raw : `+${raw}`;
}

export function getSupportTelUrl(): string | null {
  const digits = getCleanSupportPhoneDigits();
  // Valid telephone numbers require at least 7 digits
  if (digits.length < 7) return null;
  return `tel:+${digits}`;
}

export function getWhatsAppSupportUrl(defaultMessage?: string): string | null {
  const digits = getCleanSupportPhoneDigits();
  if (digits.length < 7) return null;
  const text = defaultMessage ? `?text=${encodeURIComponent(defaultMessage)}` : '';
  return `https://wa.me/${digits}${text}`;
}
