// Pure helpers for the Notification webhook — safe to import on both sides of
// the client boundary.
//
// The webhook is a Telegram bot "sendMessage" link:
//   https://api.telegram.org/bot<token>/sendMessage?chat_id=<id>
// Only that exact shape is accepted. The server POSTs to whatever is saved, so
// refusing every other host means the setting can never be used to make the
// server call an arbitrary or internal address.

const TELEGRAM_HOST = 'api.telegram.org';
const SEND_PATH = /^\/bot\d+:[A-Za-z0-9_-]+\/sendMessage$/;

export const TELEGRAM_URL_EXAMPLE =
  'https://api.telegram.org/bot<token>/sendMessage?chat_id=<chat id>';

/** Returns an error message, or null when the URL is an acceptable Telegram link. */
export function validateTelegramUrl(raw) {
  const value = (raw || '').trim();
  if (!value) return 'Enter the Telegram webhook URL.';

  let url;
  try {
    url = new URL(value);
  } catch {
    return 'That is not a valid URL.';
  }

  if (
    url.protocol !== 'https:' ||
    url.hostname !== TELEGRAM_HOST ||
    url.port ||
    url.username ||
    url.password
  ) {
    return `Only Telegram links are supported: ${TELEGRAM_URL_EXAMPLE}`;
  }
  if (!SEND_PATH.test(url.pathname)) {
    return 'The link must look like https://api.telegram.org/bot<token>/sendMessage?chat_id=<chat id>.';
  }
  if (!url.searchParams.get('chat_id')) {
    return 'The link needs a chat_id, e.g. ...sendMessage?chat_id=123456789.';
  }
  return null;
}
