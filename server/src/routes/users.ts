import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/users - List all demo users
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: `Failed to retrieve users: ${error?.message || String(error)}` });
  }
});

export default router;
