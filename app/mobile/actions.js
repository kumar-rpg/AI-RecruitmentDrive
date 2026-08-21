'use server';

export async function validateMobilePasscode(passcode) {
  if (!passcode || typeof passcode !== 'string') {
    return false;
  }

  const correctPasscode = process.env.MOBILE_LOGIN_PASSCODE || '';

  if (!correctPasscode) {
    console.error('MOBILE_LOGIN_PASSCODE not configured in environment');
    return false;
  }

  return passcode === correctPasscode;
}
