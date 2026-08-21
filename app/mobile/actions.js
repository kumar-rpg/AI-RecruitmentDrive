'use server';

export async function validateMobilePasscode(passcode) {
  const correctPasscode = process.env.MOBILE_LOGIN_PASSCODE;

  if (!correctPasscode) {
    throw new Error('Passcode not configured.');
  }

  return passcode === correctPasscode;
}
