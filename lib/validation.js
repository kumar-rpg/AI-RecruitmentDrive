// Single source of truth for applicant field rules.
//
// Imported by the public form, the public submit action, AND the admin edit
// action — so an admin editing a record can never write something the public
// form would have rejected. Pure JS with no server-only imports, so it is safe
// on both sides of the client boundary.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_PATTERN = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
export const PHONE_PATTERN = /^\d{3}-\d{4,8}$/;

export const VALID_CATEGORIES = ['intern', 'grad', 'working'];

export const CATEGORY_LABEL = {
  intern: 'Intern',
  grad: 'Grad / Job-seeking',
  working: 'Already Working',
};

/** Letters and single spaces only — strips as the user types. */
export function sanitizeName(raw) {
  return raw.replace(/[^A-Za-z\s]/g, '').replace(/\s{2,}/g, ' ');
}

/** Digits only, hyphen auto-inserted after the first 3 (e.g. 016-4028507). */
export function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

/**
 * Validates a complete applicant record.
 * Returns an error message string, or null when everything passes.
 */
export function validateApplicant({
  name,
  email,
  phone,
  position,
  category,
  org,
  program,
  internStart,
  internEnd,
}) {
  if (!name?.trim()) return 'Full Name cannot be blank.';
  if (!NAME_PATTERN.test(name.trim())) {
    return 'Full Name must contain letters only (no numbers or symbols).';
  }
  if (!email?.trim()) return 'Email Address cannot be blank.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Please enter a valid email address.';
  if (!phone?.trim()) return 'Mobile No. cannot be blank.';
  if (!PHONE_PATTERN.test(phone.trim())) {
    return 'Mobile No. must be in the format 016-4028507 (3 digits, hyphen, then the rest).';
  }
  if (!position?.trim()) return 'Please select a Position.';
  if (!VALID_CATEGORIES.includes(category)) {
    return 'Please select one: Intern, Graduating / Job-seeking, or Already Working.';
  }

  if (category !== 'working') {
    if (!org?.trim()) return 'University cannot be blank.';
    if (!program?.trim()) return 'Program cannot be blank.';
  }
  if (category === 'intern') {
    if (!internStart || !internEnd) {
      return 'Please provide both an Internship Start Date and End Date.';
    }
    if (new Date(internEnd) <= new Date(internStart)) {
      return 'Internship End Date must be after the Start Date.';
    }
  }
  return null;
}
