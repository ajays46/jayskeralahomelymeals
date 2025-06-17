export function validateForgotIdentifier(value) {
  if (!value) return 'Please enter your email or phone number.';
  // Simple email/phone validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10,}$/;
  if (!emailRegex.test(value) && !phoneRegex.test(value)) {
    return 'Enter a valid email or phone number.';
  }
  return '';
} 