// SERVER-ONLY. Sends the Notification webhook (an n8n workflow) described in
// lib/webhook.js. Never import this from a component marked 'use client'.
import { lookup as dnsLookup } from 'node:dns/promises';
import { supabaseAdmin } from './supabaseAdmin';
import { validateWebhookUrl, isPrivateAddress } from './webhook';

const TIMEOUT_MS = 8000;

/**
 * POSTs `payload` as JSON to the webhook. Returns { ok: true } or
 * { ok: false, error } — error text is ours, never the response body or the
 * URL, because the URL may contain a secret path.
 *
 * Refuses any host that resolves to a private address and never follows
 * redirects, so a public-looking URL can't bounce the server to an internal one.
 * (`deps` exists so tests can stub the network.)
 */
export async function sendWebhook(
  url,
  payload,
  { lookup = dnsLookup, fetchImpl = fetch } = {}
) {
  const invalid = validateWebhookUrl(url);
  if (invalid) return { ok: false, error: invalid };

  const target = new URL(url.trim());
  const host = target.hostname.replace(/^\[|\]$/g, '');

  try {
    const addresses = await lookup(host, { all: true });
    if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
      return { ok: false, error: 'The webhook must be a public address.' };
    }
  } catch {
    return { ok: false, error: 'Could not find that webhook host.' };
  }

  try {
    const res = await fetchImpl(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 200 && res.status < 300) return { ok: true };
    if (res.status >= 300 && res.status < 400) {
      return { ok: false, error: 'The webhook redirected elsewhere, which is not followed.' };
    }
    if (res.status === 404) {
      return {
        ok: false,
        error:
          'The webhook answered 404. In n8n, make sure the workflow is Active (production URL) or listening (test URL).',
      };
    }
    return { ok: false, error: `The webhook answered with status ${res.status}.` };
  } catch (err) {
    return {
      ok: false,
      error:
        err?.name === 'TimeoutError'
          ? 'The webhook did not answer in time.'
          : 'Could not reach the webhook.',
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
 * Passes a new application's Name, Email and Position to the webhook, if
 * Notification is ticked. Never throws: a broken or missing webhook must not
 * affect the applicant.
 */
export async function notifyNewApplication({ name, email, position }) {
  try {
    const { enabled, url } = await getNotificationSettings();
    if (!enabled || !url) return;

    const result = await sendWebhook(url, { name, email, position });
    if (!result.ok) console.error('Notification failed:', result.error);
  } catch (err) {
    console.error('Notification failed:', err?.message || err);
  }
}
