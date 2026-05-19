import type { Request, Response, NextFunction } from 'express';
import { getAdminAuth } from './firebaseAdmin';

export interface AuthedRequest extends Request {
  userId: string;
  userEmail: string | null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(match[1], true);
    (req as AuthedRequest).userId = decoded.uid;
    (req as AuthedRequest).userEmail = decoded.email ?? null;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    res.status(401).json({ error: `Authentication failed: ${message}` });
  }
}
