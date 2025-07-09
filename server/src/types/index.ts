export type ResumeType = 'staff_platform_engineer' | 'eng_mgr' | 'ai_lead';

export interface PDFOptions {
  width?: string;
  height?: string;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  preferCSSPageSize?: boolean;
  pageRanges?: string;
  scale?: number;
}

export interface GeneratePDFRequest {
  resumeType: ResumeType;
  options?: PDFOptions;
}

export interface GeneratePDFResponse {
  success: boolean;
  pdfUrl?: string;
  error?: string;
  generationTime?: number;
}

export interface ResumeTypesResponse {
  types: ResumeType[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
  details?: ValidationError[];
}

export interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
  generationTime?: number;
}

export interface PerformanceMetrics {
  [resumeType: string]: number;
}
