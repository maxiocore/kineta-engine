// ============================================
// OCR Service - MaxioCore KYC
// Extracts data from ID documents
// ============================================

import { OCRResult, DocumentType, KYC_CONFIG } from '../types';

/**
 * Extract data from uploaded ID document using OCR
 * In production, this would call an actual OCR API like:
 * - AWS Textract
 * - Google Cloud Vision
 * - Azure Computer Vision
 * - Regula SDK
 */
export async function extractDocumentData(
  imageBase64: string,
  documentType: DocumentType
): Promise<OCRResult> {
  const startTime = Date.now();
  
  // Simulate OCR processing delay
  await delay(2500);
  
  try {
    // In production, this would make an API call to OCR service
    // For now, we simulate with pattern matching
    const extractedData = await simulateOCR(imageBase64, documentType);
    const processingTime = Date.now() - startTime;
    
    // Calculate confidence based on extracted fields
    const confidence = calculateOCRConfidence(extractedData);
    
    return {
      success: confidence >= KYC_CONFIG.minOcrConfidence,
      confidence,
      extractedData,
      processingTime,
    };
  } catch (error) {
    return {
      success: false,
      confidence: 0,
      extractedData: {},
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Simulate OCR extraction for development
 * Replace with actual OCR API integration
 */
async function simulateOCR(
  _imageBase64: string, 
  documentType: DocumentType
): Promise<OCRResult['extractedData']> {
  // In production, parse the actual image
  // This simulation returns sample data based on document type
  
  await delay(500);
  
  if (documentType === 'national_id' || documentType === 'iqama') {
    // Saudi ID format simulation
    return {
      nationalId: generateSimulatedNationalId(documentType),
      fullNameAr: 'عبدالله محمد الأحمد',
      fullName: 'Abdullah Mohammed Al-Ahmad',
      dateOfBirth: '1990-05-15',
      expiryDate: calculateFutureDate(365 * 2), // 2 years from now
      nationality: documentType === 'national_id' ? 'سعودي' : 'مقيم',
      gender: 'male',
      issueDate: calculatePastDate(365), // 1 year ago
    };
  }
  
  // Passport format
  return {
    nationalId: generateSimulatedNationalId('passport'),
    fullName: 'John Doe',
    dateOfBirth: '1985-08-20',
    expiryDate: calculateFutureDate(365 * 5),
    nationality: 'USA',
    gender: 'male',
    issueDate: calculatePastDate(365 * 3),
  };
}

/**
 * Generate simulated national ID for testing
 */
function generateSimulatedNationalId(type: DocumentType): string {
  const prefix = type === 'iqama' ? '2' : '1';
  const random = Math.random().toString().slice(2, 11);
  return prefix + random.padEnd(9, '0');
}

/**
 * Calculate OCR confidence based on extracted fields
 */
function calculateOCRConfidence(data: OCRResult['extractedData']): number {
  let score = 0;
  let total = 0;
  
  const fieldWeights: Record<string, number> = {
    nationalId: 0.25,
    fullName: 0.15,
    fullNameAr: 0.10,
    dateOfBirth: 0.20,
    expiryDate: 0.20,
    nationality: 0.10,
  };
  
  for (const [field, weight] of Object.entries(fieldWeights)) {
    total += weight;
    if (data[field as keyof typeof data]) {
      score += weight;
    }
  }
  
  return total > 0 ? score / total : 0;
}

/**
 * Validate extracted ID number format
 */
export function validateNationalIdFormat(id: string, type: DocumentType): boolean {
  if (!id) return false;
  
  // Saudi National ID: starts with 1, 10 digits
  // Iqama (Residence): starts with 2, 10 digits
  const saudiPattern = /^[12]\d{9}$/;
  
  if (type === 'national_id') {
    return saudiPattern.test(id) && id.startsWith('1');
  }
  
  if (type === 'iqama') {
    return saudiPattern.test(id) && id.startsWith('2');
  }
  
  // Passport: alphanumeric, 6-9 chars
  if (type === 'passport') {
    return /^[A-Z0-9]{6,9}$/i.test(id);
  }
  
  return false;
}

/**
 * Parse date from various formats
 */
export function parseDocumentDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try common date formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else {
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }
  
  // Try native parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const dob = parseDocumentDate(dateOfBirth);
  if (!dob) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

// Helper functions
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function calculatePastDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}
