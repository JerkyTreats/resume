import { Request, Response, NextFunction } from 'express';
import { ValidationError, ErrorResponse } from '../types';

export interface ValidationSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  enum?: string[];
}

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = [];
    const body = req.body;

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (body[field] === undefined || body[field] === null) {
          errors.push({
            field,
            message: `${field} is required`
          });
        }
      }
    }

    // Check enum values
    if (schema.enum && body[schema.type]) {
      if (!schema.enum.includes(body[schema.type])) {
        errors.push({
          field: schema.type,
          message: `${schema.type} must be one of: ${schema.enum.join(', ')}`
        });
      }
    }

    // Check properties if schema has them
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (body[field] !== undefined) {
          // Check enum for specific fields
          if (fieldSchema.enum && !fieldSchema.enum.includes(body[field])) {
            errors.push({
              field,
              message: `${field} must be one of: ${fieldSchema.enum.join(', ')}`
            });
          }
        }
      }
    }

    if (errors.length > 0) {
      const errorResponse: ErrorResponse = {
        error: 'Validation failed',
        details: errors
      };
      res.status(400).json(errorResponse);
      return;
    }

    next();
  };
}

export function validateResumeType(req: Request, res: Response, next: NextFunction): void {
  const resumeType = req.body.resumeType;
  const validTypes = ['staff_platform_engineer', 'eng_mgr', 'ai_lead'];

  if (!resumeType) {
    res.status(400).json({
      error: 'resumeType is required'
    });
    return;
  }

  if (!validTypes.includes(resumeType)) {
    res.status(400).json({
      error: `Invalid resumeType. Must be one of: ${validTypes.join(', ')}`
    });
    return;
  }

  next();
}
