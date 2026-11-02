// SERVER-ONLY. Sends the Notification webhook (Telegram) described in
// lib/telegram.js. Never import this from a component marked 'use client'.
import { supabaseAdmin } from './supabaseAdmin';
import { validateTelegramUrl } from './telegram';
import { CATEGORY_LABEL } from './validation';

/**
 * POSTs `text` to a Telegram sendMessage link. Returns { ok: true } or
 * { ok: false, error } — the error text comes from Telegram or the network
 * and never includes the URL, because the URL holds the bot token.
 */
export async function sendTelegram(url, text) {
  const invalid = validateTelegramUrl(url);
  if (invalid) return { ok: false, error: invalid };

  const target = new URL(url.trim());
  target.searchParams.set('text', text);
  // URLSearchParams writes spaces as "+"; %20 is the unambiguous form.
  target.search = target.search.replace(/\+/g, '%20');

  try {
    const res = await fetch(target, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.description || `Telegram answered with status ${res.status}.` };
  } catch (err) {
    return {
      ok: false,
      error: err?.name === 'TimeoutError' ? 'Telegram did not answer in time.' : 'Could not reach Telegram.',
    };
  }
}

/** Reads the saved Notification setting; returns { enabled, url }. */
export async function getNotificationSettings() {
  const { data } = await supabaseAdmin()
    .from('app_settings')
    .select('notification_enabled, notification_webhook_url')
    .eq('id', 1)
    .maybeSingle();
  return {
    enabled: !!data?.notification_enabled,
    url: data?.notification_webhook_url ?? '',
  };
}

/**
 * Tells the Telegram chat about a new application, if Notification is ticked.
 * Never throws: a broken or missing webhook must not affect the applicant.
 */
export async function notifyNewApplication({ name, position, category }) {
  try {
    const { enabled, url } = await getNotificationSettings();
    if (!enabled || !url) return;

    const lines = [`New application: ${name} — ${position} (${CATEGORY_LABEL[category] ?? category})`];
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (site && /^https?:\/\//.test(site)) lines.push(`${site.replace(/\/$/, '')}/dashboard`);

    const result = await sendTelegram(url, lines.join('\n'));
    if (!result.ok) console.error('Notification failed:', result.error);
  } catch (err) {
    console.error('Notification failed:', err?.message || err);
  }
}
