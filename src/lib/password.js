import bcrypt from 'bcryptjs';

/**
 * Secures a plain-text password by hashing it using bcryptjs.
 *
 * @param {string} password - The raw plain-text password to hash
 * @returns {Promise<string>} The cryptographically secure hashed password string
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
}

/**
 * Compares a raw plain-text password against a stored bcrypt hash.
 *
 * @param {string} password - The raw plain-text password to verify
 * @param {string} hashedPassword - The stored hashed password comparison target
 * @returns {Promise<boolean>} Resolves to true if the password matches the hash, false otherwise
 */
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
