// ============================================
// Face Matching Service - ASH HOLDING KYC
// Compares face in document with selfie
// ============================================

import { FaceMatchResult, KYC_CONFIG } from '../types';

/**
 * Compare face in ID document with user selfie
 * In production, use services like:
 * - AWS Rekognition CompareFaces
 * - Google Cloud Vision Face Detection
 * - Azure Face API
 * - FaceX SDK
 */
export async function compareFaces(
  documentImageBase64: string,
  selfieImageBase64: string
): Promise<FaceMatchResult> {
  const errors: string[] = [];
  
  // Simulate API processing time
  await delay(2500);
  
  // First, detect faces in both images
  const documentFace = await detectFace(documentImageBase64);
  const selfieFace = await detectFace(selfieImageBase64);
  
  // Check if faces were detected
  if (!documentFace.detected) {
    errors.push('لم يتم اكتشاف وجه في صورة الوثيقة');
  }
  
  if (!selfieFace.detected) {
    errors.push('لم يتم اكتشاف وجه في الصورة الشخصية');
  }
  
  if (errors.length > 0) {
    return {
      matched: false,
      similarity: 0,
      documentFaceQuality: documentFace.quality,
      selfieQuality: selfieFace.quality,
      errors,
    };
  }
  
  // Check face quality
  if (documentFace.quality < KYC_CONFIG.minFaceQuality) {
    errors.push('جودة الوجه في صورة الوثيقة منخفضة');
  }
  
  if (selfieFace.quality < KYC_CONFIG.minFaceQuality) {
    errors.push('جودة الصورة الشخصية منخفضة');
  }
  
  // Simulate face comparison
  // In production, this would use actual face comparison algorithms
  const similarity = simulateFaceComparison(documentFace, selfieFace);
  
  // Check if similarity meets threshold
  if (similarity < KYC_CONFIG.minFaceMatchScore) {
    errors.push('الوجه في الصورة الشخصية لا يتطابق مع صورة الوثيقة');
  }
  
  return {
    matched: similarity >= KYC_CONFIG.minFaceMatchScore && errors.length === 0,
    similarity,
    documentFaceQuality: documentFace.quality,
    selfieQuality: selfieFace.quality,
    errors,
  };
}

/**
 * Detect face in an image
 */
async function detectFace(imageBase64: string): Promise<{
  detected: boolean;
  quality: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  landmarks?: { leftEye: [number, number]; rightEye: [number, number]; nose: [number, number] };
}> {
  // Simulate face detection
  await delay(500);
  
  // In production, use actual face detection
  // For simulation, base quality on image size
  const imageSize = imageBase64.length;
  const quality = Math.min(1, Math.max(0.6, imageSize / 200000));
  
  // Simulate 95% detection rate
  const detected = Math.random() > 0.05;
  
  if (!detected) {
    return { detected: false, quality: 0 };
  }
  
  return {
    detected: true,
    quality,
    boundingBox: { x: 0.2, y: 0.1, width: 0.6, height: 0.8 },
    landmarks: {
      leftEye: [0.35, 0.35],
      rightEye: [0.65, 0.35],
      nose: [0.5, 0.55],
    },
  };
}

/**
 * Simulate face comparison
 * Returns similarity score 0-100
 */
function simulateFaceComparison(
  face1: Awaited<ReturnType<typeof detectFace>>,
  face2: Awaited<ReturnType<typeof detectFace>>
): number {
  if (!face1.detected || !face2.detected) {
    return 0;
  }
  
  // Simulate comparison based on quality
  const baseScore = 70;
  const qualityBonus = (face1.quality + face2.quality) * 15;
  const randomVariation = (Math.random() - 0.5) * 10;
  
  return Math.min(100, Math.max(0, baseScore + qualityBonus + randomVariation));
}

/**
 * Capture high-quality selfie for face matching
 */
export async function captureSelfie(
  videoElement: HTMLVideoElement
): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Flip horizontally for selfie camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch {
    return null;
  }
}

/**
 * Analyze face positioning for optimal capture
 */
export function analyzeFacePosition(videoElement: HTMLVideoElement): {
  isCentered: boolean;
  isProperSize: boolean;
  hasGoodLighting: boolean;
  instructions: string[];
  instructionsAr: string[];
} {
  const instructions: string[] = [];
  const instructionsAr: string[] = [];
  
  // In production, use face detection to analyze position
  // For simulation, provide generic guidance
  
  const isCentered = true;
  const isProperSize = true;
  const hasGoodLighting = true;
  
  if (!isCentered) {
    instructions.push('Center your face in the frame');
    instructionsAr.push('وجّه وجهك نحو المركز');
  }
  
  if (!isProperSize) {
    instructions.push('Move closer or further from the camera');
    instructionsAr.push('اقترب أو ابتعد عن الكاميرا');
  }
  
  if (!hasGoodLighting) {
    instructions.push('Ensure your face is well lit');
    instructionsAr.push('تأكد من إضاءة جيدة على وجهك');
  }
  
  return {
    isCentered,
    isProperSize,
    hasGoodLighting,
    instructions,
    instructionsAr,
  };
}

/**
 * Check selfie quality before submission
 */
export async function validateSelfieQuality(imageBase64: string): Promise<{
  isAcceptable: boolean;
  quality: number;
  issues: string[];
  issuesAr: string[];
}> {
  const issues: string[] = [];
  const issuesAr: string[] = [];
  
  await delay(300);
  
  // Check image size
  const imageSize = imageBase64.length;
  
  if (imageSize < 30000) {
    issues.push('Image resolution too low');
    issuesAr.push('دقة الصورة منخفضة جداً');
  }
  
  // Simulate quality analysis
  const quality = Math.min(1, imageSize / 100000);
  
  if (quality < 0.7) {
    issues.push('Image quality is insufficient');
    issuesAr.push('جودة الصورة غير كافية');
  }
  
  return {
    isAcceptable: issues.length === 0,
    quality,
    issues,
    issuesAr,
  };
}

// Helper function
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
