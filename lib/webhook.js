// Pure helpers for the Notification webhook (an n8n webhook URL) — safe to
// import on both sides of the client boundary.
//
// The server POSTs applicant details to whatever URL HR saves, so the URL is
// restricted to public https addresses. This syntactic check catches obvious
// internal targets (localhost, private/link-local IP literals, internal-only
// host names); lib/notify.js additionally resolves the host name and refuses
// anything that points at a private address.

export const WEBHOOK_URL_EXAMPLE = 'https://your-n8n-host/webhook/your-workflow-id';

/** True for IPv4 addresses that are not publicly routable. */
export function isPrivateIPv4(ip) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, incl. cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast and reserved
  );
}

/** True for IPv6 addresses that are not publicly routable. */
export function isPrivateIPv6(ip) {
  const v = ip.toLowerCase();
  if (v === '::' || v === '::1') return true;
  // IPv4-mapped (::ffff:a.b.c.d) — URL() rewrites it to hex (::ffff:7f00:1).
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(v);
  if (mapped) return isPrivateIPv4(mapped[1]);
  const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(v);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    return isPrivateIPv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  if (v.startsWith('64:ff9b:')) return true; // NAT64 — embeds an IPv4 address
  return /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || /^ff/.test(v); // unique-local, link-local, multicast
}

/** True when `ip` is a private/loopback/link-local address of either family. */
export function isPrivateAddress(ip) {
  return ip.includes(':') ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

/** Returns an error message, or null when the URL is an acceptable webhook. */
export function validateWebhookUrl(raw) {
  const value = (raw || '').trim();
  if (!value) return 'Enter the webhook URL.';

  let url;
  try {
    url = new URL(value);
  } catch {
    return 'That is not a valid URL.';
  }

  if (url.protocol !== 'https:') {
    return `The webhook must use https, e.g. ${WEBHOOK_URL_EXAMPLE}`;
  }
  if (url.username || url.password) {
    return 'The webhook URL must not contain a username or password.';
  }

  // URL() normalises IPv6 literals to "[::1]" and IPv4 to dotted form.
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const looksLikeIp = host.includes(':') || /^\d+(\.\d+){0,3}$/.test(host);
  const internalName =
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    !host.includes('.');

  if (looksLikeIp ? isPrivateAddress(host) : internalName) {
    return 'The webhook must be a public address — internal and private addresses are not allowed.';
  }
  return null;
}
