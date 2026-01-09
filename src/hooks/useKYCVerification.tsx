// ============================================
// KYC Verification Hook - MaxioCore
// Manages the complete KYC verification flow
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  KYCSessionState,
  KYCStep,
  KYCStatus,
  DocumentType,
  OCRResult,
  DocumentValidation,
  LivenessResult,
  FaceMatchResult,
  DuplicateCheckResult,
  VerifiedIdentityData,
  KYC_CONFIG,
  extractDocumentData,
  validateDocument,
  validateDocumentImage,
  generateLivenessChallenges,
  performLivenessCheck,
  performPassiveLiveness,
  compareFaces,
  checkForDuplicates,
  hasPendingVerification,
  recordVerificationAttempt,
  updateVerificationResult,
  calculateAge,
  requestCameraAccess,
  stopCameraStream,
} from '@/lib/kyc';

interface UseKYCVerificationReturn {
  // State
  session: KYCSessionState | null;
  currentStep: KYCStep;
  status: KYCStatus;
  isProcessing: boolean;
  error: string | null;
  
  // Results
  ocrResult: OCRResult | null;
  documentValidation: DocumentValidation | null;
  livenessResult: LivenessResult | null;
  faceMatchResult: FaceMatchResult | null;
  duplicateCheck: DuplicateCheckResult | null;
  verifiedData: VerifiedIdentityData | null;
  
  // Camera
  cameraStream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  
  // Actions
  startSession: (documentType: DocumentType) => Promise<void>;
  uploadDocument: (imageBase64: string) => Promise<boolean>;
  startLivenessCheck: () => Promise<boolean>;
  captureSelfie: () => Promise<boolean>;
  completeVerification: () => Promise<boolean>;
  reset: () => void;
  
  // Camera controls
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  
  // Helpers
  canProceed: () => boolean;
  getProgress: () => number;
  getStepErrors: () => string[];
}

export function useKYCVerification(): UseKYCVerificationReturn {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State
  const [session, setSession] = useState<KYCSessionState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Results
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [documentValidation, setDocumentValidation] = useState<DocumentValidation | null>(null);
  const [livenessResult, setLivenessResult] = useState<LivenessResult | null>(null);
  const [faceMatchResult, setFaceMatchResult] = useState<FaceMatchResult | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult | null>(null);
  const [verifiedData, setVerifiedData] = useState<VerifiedIdentityData | null>(null);
  
  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        stopCameraStream(cameraStream);
      }
    };
  }, [cameraStream]);
  
  // Generate session ID
  const generateSessionId = (): string => {
    return `kyc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  };
  
  // Start new KYC session
  const startSession = useCallback(async (documentType: DocumentType) => {
    if (!user?.id) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Check for pending verification
      const pending = await hasPendingVerification(user.id);
      if (pending.hasPending) {
        // Resume existing session
        setSession({
          sessionId: pending.pendingSessionId!,
          userId: user.id,
          currentStep: 'document_upload',
          status: 'PENDING',
          documentUploadComplete: false,
          ocrComplete: false,
          livenessComplete: false,
          faceMatchComplete: false,
          duplicateCheckComplete: false,
          startedAt: pending.startedAt!,
          lastActivityAt: new Date().toISOString(),
          errors: [],
          retryCount: 0,
          maxRetries: KYC_CONFIG.maxRetries,
        });
        return;
      }
      
      // Create new session
      const sessionId = generateSessionId();
      
      setSession({
        sessionId,
        userId: user.id,
        currentStep: 'document_upload',
        status: 'PENDING',
        documentUploadComplete: false,
        ocrComplete: false,
        livenessComplete: false,
        faceMatchComplete: false,
        duplicateCheckComplete: false,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        errors: [],
        retryCount: 0,
        maxRetries: KYC_CONFIG.maxRetries,
      });
      
    } catch (err) {
      setError('فشل في بدء جلسة التحقق');
      console.error('Start session error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [user]);
  
  // Upload and process document
  const uploadDocument = useCallback(async (imageBase64: string): Promise<boolean> => {
    if (!session || !user?.id) return false;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Validate image quality
      const imageQuality = await validateDocumentImage(imageBase64);
      if (!imageQuality.isValid) {
        setError(imageQuality.issues.join('\n'));
        return false;
      }
      
      // Update session
      setSession(prev => prev ? {
        ...prev,
        currentStep: 'document_processing',
        uploadedDocumentUrl: imageBase64,
        lastActivityAt: new Date().toISOString(),
      } : null);
      
      // Extract data with OCR
      const ocr = await extractDocumentData(imageBase64, 'national_id');
      setOcrResult(ocr);
      
      if (!ocr.success) {
        const errors = ['فشل في قراءة بيانات الوثيقة'];
        setSession(prev => prev ? { ...prev, errors: [...prev.errors, ...errors] } : null);
        setError(errors[0]);
        return false;
      }
      
      // Validate document
      const validation = await validateDocument(ocr, 'national_id');
      setDocumentValidation(validation);
      
      if (!validation.isValid) {
        setSession(prev => prev ? { 
          ...prev, 
          errors: [...prev.errors, ...validation.errors],
          currentStep: 'failed',
          status: 'FAILED',
        } : null);
        setError(validation.errors[0]);
        return false;
      }
      
      // Check for duplicates
      const nationalId = ocr.extractedData.nationalId!;
      const duplicate = await checkForDuplicates(nationalId, user.id);
      setDuplicateCheck(duplicate);
      
      if (duplicate.isDuplicate) {
        setSession(prev => prev ? {
          ...prev,
          currentStep: 'failed',
          status: 'DUPLICATE',
          errors: [duplicate.reason || 'الوثيقة مسجلة مسبقاً'],
        } : null);
        setError(duplicate.reason || 'الوثيقة مسجلة مسبقاً');
        return false;
      }
      
      // Record attempt
      await recordVerificationAttempt(user.id, nationalId, session.sessionId);
      
      // Update session - ready for liveness
      setSession(prev => prev ? {
        ...prev,
        currentStep: 'liveness_check',
        documentUploadComplete: true,
        ocrComplete: true,
        duplicateCheckComplete: true,
        ocrResult: ocr,
        documentValidation: validation,
        duplicateCheck: duplicate,
        lastActivityAt: new Date().toISOString(),
      } : null);
      
      return true;
      
    } catch (err) {
      setError('حدث خطأ أثناء معالجة الوثيقة');
      console.error('Document upload error:', err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [session, user]);
  
  // Start camera
  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await requestCameraAccess();
      if (!stream) {
        setError('فشل في الوصول للكاميرا');
        return false;
      }
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      return true;
    } catch (err) {
      setError('فشل في تشغيل الكاميرا');
      console.error('Camera error:', err);
      return false;
    }
  }, []);
  
  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      stopCameraStream(cameraStream);
      setCameraStream(null);
    }
  }, [cameraStream]);
  
  // Perform liveness check
  const startLivenessCheck = useCallback(async (): Promise<boolean> => {
    if (!session || !cameraStream) return false;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Generate challenges
      const challenges = generateLivenessChallenges();
      
      // Perform liveness check
      const liveness = await performLivenessCheck(cameraStream, challenges);
      setLivenessResult(liveness);
      
      if (!liveness.passed) {
        const reason = liveness.spoofAttempt 
          ? 'تم اكتشاف محاولة تزوير' 
          : 'فشل التحقق الحيوي';
        
        setSession(prev => prev ? {
          ...prev,
          retryCount: prev.retryCount + 1,
          errors: [...prev.errors, reason],
        } : null);
        
        if ((session.retryCount + 1) >= session.maxRetries) {
          setSession(prev => prev ? {
            ...prev,
            currentStep: 'failed',
            status: 'FAILED',
          } : null);
        }
        
        setError(reason);
        return false;
      }
      
      // Update session
      setSession(prev => prev ? {
        ...prev,
        currentStep: 'face_matching',
        livenessComplete: true,
        livenessResult: liveness,
        lastActivityAt: new Date().toISOString(),
      } : null);
      
      return true;
      
    } catch (err) {
      setError('حدث خطأ أثناء التحقق الحيوي');
      console.error('Liveness error:', err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [session, cameraStream]);
  
  // Capture selfie and match face
  const captureSelfie = useCallback(async (): Promise<boolean> => {
    if (!session || !videoRef.current || !session.uploadedDocumentUrl) return false;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Capture from video
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('فشل في التقاط الصورة');
        return false;
      }
      
      ctx.drawImage(videoRef.current, 0, 0);
      const selfieBase64 = canvas.toDataURL('image/jpeg', 0.9);
      
      // Compare faces
      const faceMatch = await compareFaces(session.uploadedDocumentUrl, selfieBase64);
      setFaceMatchResult(faceMatch);
      
      if (!faceMatch.matched) {
        setSession(prev => prev ? {
          ...prev,
          retryCount: prev.retryCount + 1,
          errors: [...prev.errors, ...faceMatch.errors],
        } : null);
        
        if ((session.retryCount + 1) >= session.maxRetries) {
          setSession(prev => prev ? {
            ...prev,
            currentStep: 'failed',
            status: 'FAILED',
          } : null);
        }
        
        setError(faceMatch.errors[0] || 'الوجه لا يتطابق');
        return false;
      }
      
      // Update session
      setSession(prev => prev ? {
        ...prev,
        currentStep: 'final_review',
        faceMatchComplete: true,
        faceMatchResult: faceMatch,
        uploadedSelfieUrl: selfieBase64,
        lastActivityAt: new Date().toISOString(),
      } : null);
      
      return true;
      
    } catch (err) {
      setError('حدث خطأ أثناء مطابقة الوجه');
      console.error('Face match error:', err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [session]);
  
  // Complete verification
  const completeVerification = useCallback(async (): Promise<boolean> => {
    if (!session || !ocrResult?.extractedData) return false;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Build verified data
      const data: VerifiedIdentityData = {
        nationalId: ocrResult.extractedData.nationalId!,
        fullName: ocrResult.extractedData.fullName || ocrResult.extractedData.fullNameAr || '',
        fullNameAr: ocrResult.extractedData.fullNameAr,
        dateOfBirth: ocrResult.extractedData.dateOfBirth!,
        age: calculateAge(ocrResult.extractedData.dateOfBirth!),
        nationality: ocrResult.extractedData.nationality || 'سعودي',
        documentType: 'national_id',
        documentExpiry: ocrResult.extractedData.expiryDate!,
        verifiedAt: new Date().toISOString(),
      };
      
      setVerifiedData(data);
      
      // Update verification record
      await updateVerificationResult(session.sessionId, {
        status: 'PASSED',
        verifiedData: data as unknown as Record<string, unknown>,
        ocrConfidence: ocrResult.confidence,
        livenessScore: livenessResult?.confidence,
        faceMatchScore: faceMatchResult?.similarity,
      });
      
      // Update session
      setSession(prev => prev ? {
        ...prev,
        currentStep: 'completed',
        status: 'PASSED',
        completedAt: new Date().toISOString(),
      } : null);
      
      // Stop camera
      stopCamera();
      
      return true;
      
    } catch (err) {
      setError('حدث خطأ أثناء إتمام التحقق');
      console.error('Complete verification error:', err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [session, ocrResult, livenessResult, faceMatchResult, stopCamera]);
  
  // Reset
  const reset = useCallback(() => {
    stopCamera();
    setSession(null);
    setOcrResult(null);
    setDocumentValidation(null);
    setLivenessResult(null);
    setFaceMatchResult(null);
    setDuplicateCheck(null);
    setVerifiedData(null);
    setError(null);
    setIsProcessing(false);
  }, [stopCamera]);
  
  // Can proceed to next step
  const canProceed = useCallback((): boolean => {
    if (!session) return false;
    
    switch (session.currentStep) {
      case 'document_upload':
        return false; // Need to upload document
      case 'document_processing':
        return session.ocrComplete && (documentValidation?.isValid ?? false);
      case 'liveness_check':
        return session.livenessComplete && (livenessResult?.passed ?? false);
      case 'face_matching':
        return session.faceMatchComplete && (faceMatchResult?.matched ?? false);
      case 'final_review':
        return true;
      case 'completed':
        return true;
      default:
        return false;
    }
  }, [session, documentValidation, livenessResult, faceMatchResult]);
  
  // Get progress percentage
  const getProgress = useCallback((): number => {
    if (!session) return 0;
    
    const steps: KYCStep[] = [
      'document_upload',
      'document_processing',
      'liveness_check',
      'face_matching',
      'final_review',
      'completed',
    ];
    
    const currentIndex = steps.indexOf(session.currentStep);
    return Math.round((currentIndex / (steps.length - 1)) * 100);
  }, [session]);
  
  // Get current step errors
  const getStepErrors = useCallback((): string[] => {
    return session?.errors || [];
  }, [session]);
  
  return {
    session,
    currentStep: session?.currentStep || 'document_upload',
    status: session?.status || 'PENDING',
    isProcessing,
    error,
    ocrResult,
    documentValidation,
    livenessResult,
    faceMatchResult,
    duplicateCheck,
    verifiedData,
    cameraStream,
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    startSession,
    uploadDocument,
    startLivenessCheck,
    captureSelfie,
    completeVerification,
    reset,
    startCamera,
    stopCamera,
    canProceed,
    getProgress,
    getStepErrors,
  };
}
