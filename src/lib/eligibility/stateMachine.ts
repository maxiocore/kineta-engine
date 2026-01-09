// ============================================
// Eligibility State Machine - MaxioCore
// ============================================

import { 
  EligibilityState, 
  EligibilityEvent, 
  EligibilityContext,
  VerificationStep 
} from './types';
import { VERIFICATION_STEPS } from './config';

type StateTransition = {
  [K in EligibilityState]: {
    on: {
      [E in EligibilityEvent['type']]?: EligibilityState;
    };
  };
};

const STATE_TRANSITIONS: StateTransition = {
  idle: {
    on: {
      START_VERIFICATION: 'identity_verification',
      RESET: 'idle',
    },
  },
  identity_verification: {
    on: {
      IDENTITY_VERIFIED: 'phone_verification',
      IDENTITY_FAILED: 'rejected',
      RESET: 'idle',
    },
  },
  phone_verification: {
    on: {
      PHONE_VERIFIED: 'email_verification',
      PHONE_FAILED: 'rejected',
      RESET: 'idle',
    },
  },
  email_verification: {
    on: {
      EMAIL_VERIFIED: 'history_check',
      EMAIL_FAILED: 'rejected',
      RESET: 'idle',
    },
  },
  history_check: {
    on: {
      HISTORY_CHECKED: 'risk_assessment',
      RESET: 'idle',
    },
  },
  risk_assessment: {
    on: {
      RISK_ASSESSED: 'decision',
      RESET: 'idle',
    },
  },
  decision: {
    on: {
      DECISION_MADE: 'approved', // Will be overridden based on result
      RESET: 'idle',
    },
  },
  approved: {
    on: {
      RESET: 'idle',
    },
  },
  rejected: {
    on: {
      RESET: 'idle',
    },
  },
};

export function createInitialContext(userId: string): EligibilityContext {
  const steps: VerificationStep[] = VERIFICATION_STEPS.map(step => ({
    id: step.id,
    name: step.name,
    nameAr: step.nameAr,
    status: 'pending',
    score: 0,
    maxScore: step.maxScore,
  }));

  return {
    currentState: 'idle',
    userId,
    steps,
    startedAt: new Date().toISOString(),
  };
}

export function transition(
  context: EligibilityContext, 
  event: EligibilityEvent
): EligibilityContext {
  const currentState = context.currentState;
  const stateConfig = STATE_TRANSITIONS[currentState];
  
  if (!stateConfig?.on) {
    console.warn(`No transitions defined for state: ${currentState}`);
    return context;
  }

  const nextState = stateConfig.on[event.type];
  
  if (!nextState) {
    console.warn(`Invalid transition: ${currentState} + ${event.type}`);
    return context;
  }

  // Apply event-specific updates
  let updatedContext = { ...context, currentState: nextState };
  
  switch (event.type) {
    case 'IDENTITY_VERIFIED':
      updatedContext = {
        ...updatedContext,
        identityResult: event.payload,
        steps: updateStepStatus(context.steps, 'identity', 'verified', event.payload.score),
      };
      break;
      
    case 'IDENTITY_FAILED':
      updatedContext = {
        ...updatedContext,
        steps: updateStepStatus(context.steps, 'identity', 'failed', 0, event.payload.reason),
        error: event.payload.reason,
      };
      break;
      
    case 'PHONE_VERIFIED':
      updatedContext = {
        ...updatedContext,
        phoneResult: event.payload,
        steps: updateStepStatus(context.steps, 'phone', 'verified', event.payload.score),
      };
      break;
      
    case 'PHONE_FAILED':
      updatedContext = {
        ...updatedContext,
        steps: updateStepStatus(context.steps, 'phone', 'failed', 0, event.payload.reason),
        error: event.payload.reason,
      };
      break;
      
    case 'EMAIL_VERIFIED':
      updatedContext = {
        ...updatedContext,
        emailResult: event.payload,
        steps: updateStepStatus(context.steps, 'email', 'verified', event.payload.score),
      };
      break;
      
    case 'EMAIL_FAILED':
      updatedContext = {
        ...updatedContext,
        steps: updateStepStatus(context.steps, 'email', 'failed', 0, event.payload.reason),
        error: event.payload.reason,
      };
      break;
      
    case 'HISTORY_CHECKED':
      updatedContext = {
        ...updatedContext,
        historyResult: event.payload,
        steps: updateStepStatus(context.steps, 'history', 'verified', event.payload.score),
      };
      break;
      
    case 'RISK_ASSESSED':
      updatedContext = {
        ...updatedContext,
        riskResult: event.payload,
      };
      break;
      
    case 'DECISION_MADE':
      updatedContext = {
        ...updatedContext,
        decision: event.payload,
        currentState: event.payload.eligible ? 'approved' : 'rejected',
        completedAt: new Date().toISOString(),
      };
      break;
      
    case 'RESET':
      return createInitialContext(context.userId);
  }
  
  return updatedContext;
}

function updateStepStatus(
  steps: VerificationStep[], 
  stepId: string, 
  status: VerificationStep['status'],
  score: number,
  errorMessage?: string
): VerificationStep[] {
  return steps.map(step => {
    if (step.id === stepId) {
      return {
        ...step,
        status,
        score,
        errorMessage,
        completedAt: new Date().toISOString(),
      };
    }
    return step;
  });
}

export function canTransition(
  context: EligibilityContext, 
  eventType: EligibilityEvent['type']
): boolean {
  const stateConfig = STATE_TRANSITIONS[context.currentState];
  return Boolean(stateConfig?.on?.[eventType]);
}

export function getNextRequiredStep(context: EligibilityContext): string | null {
  const pendingStep = context.steps.find(s => s.status === 'pending');
  return pendingStep?.id || null;
}

export function getTotalScore(context: EligibilityContext): number {
  return context.steps.reduce((sum, step) => sum + step.score, 0);
}

export function getMaxPossibleScore(): number {
  return VERIFICATION_STEPS.reduce((sum, step) => sum + step.maxScore, 0);
}
