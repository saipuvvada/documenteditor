import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized: Missing x-user-id header. Please select a demo user.',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized: Demo user not found. Please switch to a valid demo user.',
      });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: `Internal server error during authentication check: ${error?.message || String(error)}` });
  }
}
