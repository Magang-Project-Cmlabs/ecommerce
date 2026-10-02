import { createHmac, timingSafeEqual } from 'node:crypto';
import { kunciDariRahasia } from './token';

// JWT carries an opaque version, never the password hash. A password change
// automatically revokes all previously issued sessions without a session table.
export function versiPassword(passwordHash: string, rahasia = process.env.AUTH_SECRET): string {
  return createHmac('sha256', kunciDariRahasia(rahasia)).update(passwordHash).digest('hex');
}

export function versiSesiSah(versi: string | undefined, passwordHash: string, rahasia = process.env.AUTH_SECRET): boolean {
  if (!versi || !/^[a-f0-9]{64}$/.test(versi)) return false;
  return timingSafeEqual(Buffer.from(versi, 'hex'), Buffer.from(versiPassword(passwordHash, rahasia), 'hex'));
}
