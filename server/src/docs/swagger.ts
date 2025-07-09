import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Resume PDF Generation API',
      version: '1.0.0',
      description: 'API for generating PDF resumes with navigation exclusion',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        PDFOptions: {
          type: 'object',
          properties: {
            width: {
              type: 'string',
              default: '8.5in',
              description: 'Width of the PDF page'
            },
            height: {
              type: 'string',
              default: '100in',
              description: 'Height determined by content length'
            },
            printBackground: {
              type: 'boolean',
              default: true,
              description: 'Include background colors and images'
            },
            margin: {
              type: 'object',
              properties: {
                top: { type: 'string', default: '0.25in' },
                right: { type: 'string', default: '0.25in' },
                bottom: { type: 'string', default: '0.25in' },
                left: { type: 'string', default: '0.25in' }
              }
            },
            preferCSSPageSize: {
              type: 'boolean',
              default: false,
              description: 'Disable page-based formatting for continuous output'
            },
            pageRanges: {
              type: 'string',
              default: '1',
              description: 'Ensure single page output'
            },
            scale: {
              type: 'number',
              default: 1.0,
              description: 'Scale factor for content'
            }
          }
        },
        GeneratePDFRequest: {
          type: 'object',
          required: ['resumeType'],
          properties: {
            resumeType: {
              type: 'string',
              enum: ['staff_platform_engineer', 'eng_mgr', 'ai_lead'],
              description: 'The type of resume to generate'
            },
            options: {
              $ref: '#/components/schemas/PDFOptions'
            }
          }
        },
        GeneratePDFResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            pdfUrl: {
              type: 'string',
              description: 'URL to download the generated PDF'
            },
            error: {
              type: 'string',
              description: 'Error message if generation failed'
            }
          }
        },
        ResumeTypesResponse: {
          type: 'object',
          properties: {
            types: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['staff_platform_engineer', 'eng_mgr', 'ai_lead']
              }
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy']
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            services: {
              type: 'object',
              properties: {
                pdfGenerator: {
                  type: 'boolean'
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'PDF',
        description: 'PDF generation endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/docs/*.ts']
};

export default options;
