-- Make email optional for phone-only registrations
ALTER TABLE `auths`
  MODIFY `email` VARCHAR(255) NULL;
