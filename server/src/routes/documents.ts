import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Apply authMiddleware to all document routes
router.use(authMiddleware);

type AccessCheckResult =
  | { error: string; status: number }
  | { document: any; isOwner: boolean; isShared: boolean };

// Helper to verify user document access
async function getDocumentWithAccessCheck(documentId: string, userId: string): Promise<AccessCheckResult> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      shares: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!document) {
    return { status: 404, error: 'Document not found' };
  }

  const isOwner = document.ownerId === userId;
  const isShared = document.shares.some((s) => s.userId === userId);

  if (!isOwner && !isShared) {
    return { status: 403, error: 'Forbidden: You do not have permission to access this document' };
  }

  return { document, isOwner, isShared };
}

// GET /api/documents - List owned and shared documents for current user
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const ownedDocuments = await prisma.document.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const sharedShares = await prisma.documentShare.findMany({
      where: { userId },
      include: {
        document: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            shares: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sharedDocuments = sharedShares.map((share) => share.document);

    return res.json({
      owned: ownedDocuments,
      shared: sharedDocuments,
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: `Failed to retrieve documents: ${error?.message || String(error)}` });
  }
});

// POST /api/documents - Create new document
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, content } = req.body;

    const newDocument = await prisma.document.create({
      data: {
        title: title !== undefined && title.trim() !== '' ? title.trim() : 'Untitled document',
        content: content !== undefined ? content : '<p></p>',
        ownerId: userId,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        shares: true,
      },
    });

    return res.status(201).json(newDocument);
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({ error: 'Failed to create document' });
  }
});

// GET /api/documents/:id - Get specific document
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.userId!;

    const result = await getDocumentWithAccessCheck(documentId, userId);
    if ('error' in result) {
      return res.status(result.status).json({ error: result.error });
    }

    const { document, isOwner, isShared } = result;

    return res.json({
      ...document,
      accessRole: isOwner ? 'owner' : 'shared',
    });
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    return res.status(500).json({ error: 'Failed to retrieve document details' });
  }
});

// PUT /api/documents/:id - Update document title/content
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.userId!;
    const { title, content } = req.body;

    const result = await getDocumentWithAccessCheck(documentId, userId);
    if ('error' in result) {
      return res.status(result.status).json({ error: result.error });
    }

    const updateData: { title?: string; content?: string } = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Document title cannot be empty' });
      }
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Document content must be a string' });
      }
      updateData.content = content;
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE /api/documents/:id - Delete document (owner only)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.userId!;

    const result = await getDocumentWithAccessCheck(documentId, userId);
    if ('error' in result) {
      return res.status(result.status).json({ error: result.error });
    }

    if (!result.isOwner) {
      return res.status(403).json({ error: 'Forbidden: Only the document owner can delete this document' });
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    return res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

// POST /api/documents/:id/share - Share document with user
router.post('/:id/share', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.userId!;
    const { userId: targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target userId is required to share document' });
    }

    const result = await getDocumentWithAccessCheck(documentId, userId);
    if ('error' in result) {
      return res.status(result.status).json({ error: result.error });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User to share with was not found' });
    }

    // Cannot share with yourself / owner
    if (targetUserId === result.document.ownerId) {
      return res.status(400).json({ error: 'Cannot share document with its owner' });
    }

    // Check for duplicate share
    const existingShare = await prisma.documentShare.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId: targetUserId,
        },
      },
    });

    if (existingShare) {
      return res.status(400).json({ error: 'Document is already shared with this user' });
    }

    const newShare = await prisma.documentShare.create({
      data: {
        documentId,
        userId: targetUserId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json(newShare);
  } catch (error) {
    console.error('Error sharing document:', error);
    return res.status(500).json({ error: 'Failed to share document' });
  }
});

// GET /api/documents/:id/shares - List active shares for document
router.get('/:id/shares', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.userId!;

    const result = await getDocumentWithAccessCheck(documentId, userId);
    if ('error' in result) {
      return res.status(result.status).json({ error: result.error });
    }

    const shares = await prisma.documentShare.findMany({
      where: { documentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json(shares);
  } catch (error) {
    console.error('Error fetching shares:', error);
    return res.status(500).json({ error: 'Failed to retrieve document shares' });
  }
});

export default router;
