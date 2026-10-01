export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'DocuCraft API Reference',
    version: '1.0.0',
    description:
      'REST API documentation for DocuCraft — Collaborative Document Editor. All document endpoints require the demo user header `x-user-id` (`user-sai`, `user-priya`, or `user-alex`).',
  },
  servers: [
    {
      url: 'http://localhost:5001',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      DemoUserAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-user-id',
        description: 'Demo User ID (e.g. `user-sai`, `user-priya`, `user-alex`)',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user-sai' },
          name: { type: 'string', example: 'Sai' },
          email: { type: 'string', example: 'sai@example.com' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '8f7a9d20-4e1b-4f92-91d8-5f2b8b9a1c2d' },
          title: { type: 'string', example: 'Quarterly Planning Doc' },
          content: { type: 'string', example: '<p>Rich text content in HTML format</p>' },
          ownerId: { type: 'string', example: 'user-sai' },
          owner: { $ref: '#/components/schemas/User' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DocumentShare: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'share-uuid-1234' },
          documentId: { type: 'string', example: '8f7a9d20-4e1b-4f92-91d8-5f2b8b9a1c2d' },
          userId: { type: 'string', example: 'user-priya' },
          user: { $ref: '#/components/schemas/User' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Forbidden: You do not have access to this document' },
        },
      },
    },
  },
  security: [
    {
      DemoUserAuth: [],
    },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Server Health Check',
        tags: ['System'],
        security: [],
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/users': {
      get: {
        summary: 'List Demo Users',
        tags: ['Users'],
        security: [],
        responses: {
          '200': {
            description: 'List of all seed demo users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
    },
    '/api/documents': {
      get: {
        summary: 'List Owned and Shared Documents',
        tags: ['Documents'],
        description: 'Retrieves all documents owned by or shared with the authenticated demo user.',
        responses: {
          '200': {
            description: 'Categorized document lists',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    owned: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Document' },
                    },
                    shared: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Document' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
      post: {
        summary: 'Create New Document',
        tags: ['Documents'],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Untitled document' },
                  content: { type: 'string', example: '<p>Initial text</p>' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created Document',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Document' },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    '/api/documents/{id}': {
      get: {
        summary: 'Get Document Details by ID',
        tags: ['Documents'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Document UUID',
          },
        ],
        responses: {
          '200': {
            description: 'Document details with access role indicator',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Document' },
                    {
                      type: 'object',
                      properties: {
                        accessRole: { type: 'string', enum: ['owner', 'shared'] },
                      },
                    },
                  ],
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
      put: {
        summary: 'Update Document Title or Content',
        tags: ['Documents'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Updated Title' },
                  content: { type: 'string', example: '<p>Updated rich text content</p>' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated Document',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Document' },
              },
            },
          },
          '400': { description: 'Validation error (e.g. empty title)' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
        },
      },
      delete: {
        summary: 'Delete Document (Owner Only)',
        tags: ['Documents'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Document deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Document deleted successfully' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/ForbiddenError' },
        },
      },
    },
    '/api/documents/{id}/share': {
      post: {
        summary: 'Share Document with Demo User',
        tags: ['Sharing'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: { type: 'string', example: 'user-priya' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created share record',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentShare' },
              },
            },
          },
          '400': { description: 'Duplicate share or sharing with self' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
        },
      },
    },
    '/api/documents/{id}/shares': {
      get: {
        summary: 'List Active Shares for Document',
        tags: ['Sharing'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'List of users with shared access',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/DocumentShare' },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/ForbiddenError' },
        },
      },
    },
    '/api/upload': {
      post: {
        summary: 'Upload Document (.txt, .md, .docx)',
        tags: ['File Upload'],
        description: 'Parses uploaded file content and creates a new document owned by the demo user.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to import (.txt, .md, .docx max 5MB)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Document created from uploaded file',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Document' },
              },
            },
          },
          '400': { description: 'Unsupported file format or oversized file' },
        },
      },
    },
  },
  componentsResponses: {
    UnauthorizedError: {
      description: 'Missing or invalid demo user header (x-user-id)',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    ForbiddenError: {
      description: 'You do not have permission to access or edit this document',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    NotFoundError: {
      description: 'Document not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
  },
};
