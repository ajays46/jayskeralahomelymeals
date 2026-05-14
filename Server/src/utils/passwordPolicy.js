export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_POLICY_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include uppercase, lowercase, number, and special character (no spaces).`;

export const getPasswordChecks = (password = '') => {
  const value = String(password);
  return {
    minLength: value.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(value),
    hasLowercase: /[a-z]/.test(value),
    hasNumber: /[0-9]/.test(value),
    hasSpecialChar: /[^A-Za-z0-9]/.test(value),
    noSpaces: !/\s/.test(value)
  };
};

export const isStrongPassword = (password = '') => {
  const checks = getPasswordChecks(password);
  return Object.values(checks).every(Boolean);
};
