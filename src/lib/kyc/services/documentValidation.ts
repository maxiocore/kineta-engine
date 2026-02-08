// ============================================
// Document Validation Service - ASH HOLDING KYC
// Validates extracted document data
// ============================================

import { DocumentValidation, DocumentType, OCRResult, KYC_CONFIG } from '../types';
import { parseDocumentDate, calculateAge, validateNationalIdFormat } from './ocrService';

/**
 * Validate document data extracted by OCR
 */
export async function validateDocument(
  ocrResult: OCRResult,
  documentType: DocumentType
): Promise<DocumentValidation> {
  const errors: string[] = [];
  const { extractedData } = ocrResult;
  
  // Simulate processing
  await delay(1000);
  
  // 1. Validate National ID format
  if (!extractedData.nationalId) {
    errors.push('لم يتم استخراج رقم الهوية');
  } else if (!validateNationalIdFormat(extractedData.nationalId, documentType)) {
    errors.push('رقم الهوية غير صالح');
  }
  
  // 2. Validate date of birth and age
  if (!extractedData.dateOfBirth) {
    errors.push('لم يتم استخراج تاريخ الميلاد');
  } else {
    const age = calculateAge(extractedData.dateOfBirth);
    if (age < KYC_CONFIG.minDocumentAge) {
      errors.push(`العمر يجب أن يكون ${KYC_CONFIG.minDocumentAge} سنة على الأقل`);
    }
    if (age > KYC_CONFIG.maxDocumentAge) {
      errors.push(`العمر يجب أن يكون أقل من ${KYC_CONFIG.maxDocumentAge} سنة`);
    }
  }
  
  // 3. Check document expiry
  let expiryDate: Date | undefined;
  let isExpired = false;
  let daysUntilExpiry: number | undefined;
  
  if (!extractedData.expiryDate) {
    errors.push('لم يتم استخراج تاريخ انتهاء الوثيقة');
  } else {
    expiryDate = parseDocumentDate(extractedData.expiryDate) || undefined;
    
    if (expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const timeDiff = expiryDate.getTime() - today.getTime();
      daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) {
        isExpired = true;
        errors.push('الوثيقة منتهية الصلاحية');
      } else if (daysUntilExpiry < KYC_CONFIG.minExpiryDays) {
        errors.push(`الوثيقة ستنتهي خلال ${daysUntilExpiry} يوم - مطلوب ${KYC_CONFIG.minExpiryDays} يوم على الأقل`);
      }
    }
  }
  
  // 4. Validate name presence
  if (!extractedData.fullName && !extractedData.fullNameAr) {
    errors.push('لم يتم استخراج الاسم من الوثيقة');
  }
  
  // 5. Validate nationality matches document type
  if (documentType === 'national_id' && extractedData.nationality !== 'سعودي') {
    // Warning but not error - might be OCR issue
  }
  if (documentType === 'iqama' && extractedData.nationality === 'سعودي') {
    errors.push('نوع الوثيقة لا يتطابق مع الجنسية');
  }
  
  return {
    isValid: errors.length === 0,
    isExpired,
    expiryDate,
    daysUntilExpiry,
    documentType,
    errors,
  };
}

/**
 * Validate document image quality
 */
export async function validateDocumentImage(imageBase64: string): Promise<{
  isValid: boolean;
  quality: number;
  issues: string[];
}> {
  const issues: string[] = [];
  
  // Simulate image quality analysis
  await delay(500);
  
  // Check image size (base64 length as proxy for resolution)
  const imageSize = imageBase64.length;
  const minSize = 50000; // ~50KB minimum
  const maxSize = 10000000; // 10MB maximum
  
  if (imageSize < minSize) {
    issues.push('دقة الصورة منخفضة جداً');
  }
  
  if (imageSize > maxSize) {
    issues.push('حجم الصورة كبير جداً');
  }
  
  // Simulate quality score (in production, use actual image analysis)
  const quality = Math.min(1, Math.max(0.5, imageSize / 500000));
  
  return {
    isValid: issues.length === 0,
    quality,
    issues,
  };
}

/**
 * Cross-reference extracted data with user input
 */
export function crossValidateWithInput(
  extracted: OCRResult['extractedData'],
  userInput: {
    nationalId?: string;
    fullName?: string;
    age?: number;
  }
): {
  matches: boolean;
  discrepancies: string[];
} {
  const discrepancies: string[] = [];
  
  // Check National ID match
  if (userInput.nationalId && extracted.nationalId) {
    if (userInput.nationalId !== extracted.nationalId) {
      discrepancies.push('رقم الهوية لا يتطابق مع الوثيقة');
    }
  }
  
  // Check age match (allow 1 year difference for birthday edge cases)
  if (userInput.age && extracted.dateOfBirth) {
    const extractedAge = calculateAge(extracted.dateOfBirth);
    if (Math.abs(extractedAge - userInput.age) > 1) {
      discrepancies.push('العمر لا يتطابق مع تاريخ الميلاد في الوثيقة');
    }
  }
  
  // Check name similarity (basic check)
  if (userInput.fullName && extracted.fullName) {
    const inputName = userInput.fullName.toLowerCase().trim();
    const extractedName = extracted.fullName.toLowerCase().trim();
    
    // Simple similarity check
    if (!extractedName.includes(inputName) && !inputName.includes(extractedName)) {
      discrepancies.push('الاسم قد لا يتطابق مع الوثيقة');
    }
  }
  
  return {
    matches: discrepancies.length === 0,
    discrepancies,
  };
}

// Helper function
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
