import jwt, { type SignOptions } from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export function generateToken(userId: string, expiresIn: SignOptions['expiresIn'] = '1h'): string {
  return jwt.sign({ userId }, SECRET, { expiresIn });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });
}

/** Narrow an unknown verify() result down to a payload we can trust. */
function toUserId(decoded: string | jwt.JwtPayload): { userId: string } | null {
  if (typeof decoded === 'string') return null;
  const { userId } = decoded;
  return typeof userId === 'string' ? { userId } : null;
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return toUserId(jwt.verify(token, SECRET));
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return toUserId(jwt.verify(token, REFRESH_SECRET));
  } catch {
    return null;
  }
}
