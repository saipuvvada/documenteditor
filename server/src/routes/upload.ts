import { Router, Response } from 'express';
import multer from 'multer';
import { prisma } from '../db.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { parseFileToHtml } from '../services/fileParser.js';

const router = Router();

// Configure Multer in-memory storage (5 MB max)
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.txt', '.md', '.docx'];
    const filename = file.originalname.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => filename.endsWith(ext));

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only .txt, .md, and .docx files are supported.'));
    }
  },
});

router.use(authMiddleware);

// POST /api/upload - Upload file and create document
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  upload.single('file')(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds the limit of 5MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message || 'File upload validation failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Please select a .txt, .md, or .docx file.' });
    }

    try {
      const userId = req.userId!;
      const { title, html } = await parseFileToHtml(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      const newDocument = await prisma.document.create({
        data: {
          title: title || 'Uploaded Document',
          content: html,
          ownerId: userId,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          shares: true,
        },
      });

      return res.status(201).json(newDocument);
    } catch (error: any) {
      console.error('File parsing error:', error);
      return res.status(400).json({
        error: error.message || 'Failed to parse uploaded file content',
      });
    }
  });
});

export default router;
