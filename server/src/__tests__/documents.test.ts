import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { prisma } from '../db.js';

describe('Document API Authorization & Core Features', () => {
  let docId: string;

  beforeAll(async () => {
    // Ensure demo users exist in test environment
    await prisma.user.upsert({
      where: { id: 'user-sai' },
      update: {},
      create: { id: 'user-sai', name: 'Sai', email: 'sai@example.com' },
    });
    await prisma.user.upsert({
      where: { id: 'user-priya' },
      update: {},
      create: { id: 'user-priya', name: 'Priya', email: 'priya@example.com' },
    });
    await prisma.user.upsert({
      where: { id: 'user-alex' },
      update: {},
      create: { id: 'user-alex', name: 'Alex', email: 'alex@example.com' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Document Creation: Sai creates a document', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('x-user-id', 'user-sai')
      .send({
        title: 'Sai Spec Document',
        content: '<p>Initial content by Sai</p>',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Sai Spec Document');
    expect(res.body.ownerId).toBe('user-sai');

    docId = res.body.id;
  });

  it('2. REQUIRED TEST: Unauthorized user (Alex) cannot update another user (Sai) document', async () => {
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set('x-user-id', 'user-alex')
      .send({
        title: 'Hacked Title',
        content: '<p>Malicious Edit</p>',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('3. Unauthorized user (Alex) cannot read another user (Sai) document', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('x-user-id', 'user-alex');

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('4. Sharing: Sai shares document with Priya', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('x-user-id', 'user-sai')
      .send({ userId: 'user-priya' });

    expect(res.status).toBe(201);
    expect(res.body.documentId).toBe(docId);
    expect(res.body.userId).toBe('user-priya');
  });

  it('5. Duplicate Share Rejection: Sai trying to share with Priya again fails', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('x-user-id', 'user-sai')
      .send({ userId: 'user-priya' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already shared');
  });

  it('6. Shared Access: Shared user (Priya) can access document', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('x-user-id', 'user-priya');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(docId);
    expect(res.body.accessRole).toBe('shared');
  });

  it('7. Shared User Editing: Shared user (Priya) can update document', async () => {
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set('x-user-id', 'user-priya')
      .send({
        title: 'Sai Spec Document - Updated by Priya',
        content: '<p>Collaborative edit by Priya</p>',
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Sai Spec Document - Updated by Priya');
  });

  it('8. File Upload Rejection: Unsupported file type (.pdf) rejected', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('x-user-id', 'user-sai')
      .attach('file', Buffer.from('PDF Binary Content'), 'test.pdf');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid file format');
  });

  it('9. File Upload Success: Uploading a .txt file creates document', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('x-user-id', 'user-sai')
      .attach('file', Buffer.from('Line 1\n\nLine 2'), 'notes.txt');

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('notes');
    expect(res.body.content).toContain('<p>Line 1</p>');
    expect(res.body.content).toContain('<p>Line 2</p>');
  });
});
