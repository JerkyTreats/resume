import { Request, Response, NextFunction } from 'express';
import { validateRequest, validateResumeType, ValidationSchema } from '../../middleware/validation';

// Mock Express objects
const createMockRequest = (body: any = {}): Partial<Request> => ({
  body
});

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res;
};

const createMockNext = (): NextFunction => jest.fn();

describe('Validation Middleware', () => {
  describe('validateRequest', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = createMockRequest();
      mockRes = createMockResponse();
      mockNext = createMockNext();
    });

    it('should call next() when validation passes', () => {
      const schema: ValidationSchema = {
        type: 'test',
        required: ['name', 'email']
      };

      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should return 400 error when required field is missing', () => {
      const schema: ValidationSchema = {
        type: 'test',
        required: ['name', 'email']
      };

      mockReq.body = {
        name: 'John Doe'
        // email is missing
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [
          {
            field: 'email',
            message: 'email is required'
          }
        ]
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when required field is null', () => {
      const schema: ValidationSchema = {
        type: 'test',
        required: ['name']
      };

      mockReq.body = {
        name: null
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [
          {
            field: 'name',
            message: 'name is required'
          }
        ]
      });
    });

    it('should return 400 error when required field is undefined', () => {
      const schema: ValidationSchema = {
        type: 'test',
        required: ['name']
      };

      mockReq.body = {
        name: undefined
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [
          {
            field: 'name',
            message: 'name is required'
          }
        ]
      });
    });

    it('should validate enum values for schema type', () => {
      const schema: ValidationSchema = {
        type: 'status',
        enum: ['active', 'inactive', 'pending']
      };

      mockReq.body = {
        status: 'invalid'
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [
          {
            field: 'status',
            message: 'status must be one of: active, inactive, pending'
          }
        ]
      });
    });

    it('should pass validation when enum value is valid', () => {
      const schema: ValidationSchema = {
        type: 'status',
        enum: ['active', 'inactive', 'pending']
      };

      mockReq.body = {
        status: 'active'
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should validate enum values for properties', () => {
      const schema: ValidationSchema = {
        type: 'test',
        properties: {
          role: {
            enum: ['admin', 'user', 'guest']
          }
        }
      };

      mockReq.body = {
        role: 'invalid'
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [
          {
            field: 'role',
            message: 'role must be one of: admin, user, guest'
          }
        ]
      });
    });

    it('should pass validation when property enum value is valid', () => {
      const schema: ValidationSchema = {
        type: 'test',
        properties: {
          role: {
            enum: ['admin', 'user', 'guest']
          }
        }
      };

      mockReq.body = {
        role: 'admin'
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle multiple validation errors', () => {
      const schema: ValidationSchema = {
        type: 'test',
        required: ['name', 'email'],
        properties: {
          role: {
            enum: ['admin', 'user']
          }
        }
      };

      mockReq.body = {
        role: 'invalid'
        // name and email are missing
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [
          {
            field: 'name',
            message: 'name is required'
          },
          {
            field: 'email',
            message: 'email is required'
          },
          {
            field: 'role',
            message: 'role must be one of: admin, user'
          }
        ]
      });
    });

    it('should handle schema without required fields', () => {
      const schema: ValidationSchema = {
        type: 'test'
      };

      mockReq.body = {};

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle schema without properties', () => {
      const schema: ValidationSchema = {
        type: 'test',
        required: ['name']
      };

      mockReq.body = {
        name: 'John Doe'
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('validateResumeType', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = createMockRequest();
      mockRes = createMockResponse();
      mockNext = createMockNext();
    });

    it('should call next() when resumeType is valid', () => {
      mockReq.body = {
        resumeType: 'staff_platform_engineer'
      };

      validateResumeType(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should return 400 error when resumeType is missing', () => {
      mockReq.body = {};

      validateResumeType(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'resumeType is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when resumeType is invalid', () => {
      mockReq.body = {
        resumeType: 'invalid_type'
      };

      validateResumeType(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid resumeType. Must be one of: staff_platform_engineer, eng_mgr, ai_lead'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept all valid resume types', () => {
      const validTypes = ['staff_platform_engineer', 'eng_mgr', 'ai_lead'];

      for (const resumeType of validTypes) {
        mockReq.body = { resumeType };
        mockRes = createMockResponse();
        mockNext = createMockNext();

        validateResumeType(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      }
    });

    it('should handle case sensitivity correctly', () => {
      mockReq.body = {
        resumeType: 'STAFF_PLATFORM_ENGINEER'
      };

      validateResumeType(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid resumeType. Must be one of: staff_platform_engineer, eng_mgr, ai_lead'
      });
    });
  });
});
