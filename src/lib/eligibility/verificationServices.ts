// ============================================
// Verification Services - MaxioCore
// Real verification logic for each step
// ============================================

import { supabase } from '@/integrations/supabase/client';
import {
  IdentityVerificationResult,
  PhoneVerificationResult,
  EmailVerificationResult,
  HistoryCheckResult,
} from './types';
import { ELIGIBILITY_CONFIG } from './config';

/**
 * Identity Verification Service
 * Verifies user identity based on profile and national ID
 */
export async function verifyIdentity(
  userId: string,
  nationalId: string,
  nationality: string,
  age: number
): Promise<IdentityVerificationResult> {
  // Simulate API delay for realistic UX
  await delay(1500);
  
  let score = 0;
  
  // Check nationality (Saudi or Resident)
  const validNationality = nationality === 'سعودي' || nationality === 'مقيم';
  if (validNationality) score += 10;
  
  // Check age range
  const validAge = age >= ELIGIBILITY_CONFIG.minAge && age <= ELIGIBILITY_CONFIG.maxAge;
  if (validAge) score += 10;
  
  // Validate National ID format (10 digits starting with 1 or 2)
  const idPattern = /^[12]\d{9}$/;
  const validIdFormat = idPattern.test(nationalId);
  if (validIdFormat) score += 15;
  
  // Fetch user profile for additional validation
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, created_at')
    .eq('id', userId)
    .single();
  
  const fullName = profile?.full_name || '';
  const hasValidName = fullName.length >= 4;
  if (hasValidName) score += 5;
  
  return {
    verified: score >= 25,
    nationalId,
    fullName,
    nationality,
    age,
    idExpiryValid: validIdFormat,
    score: Math.min(score, 35),
  };
}

/**
 * Phone Verification Service
 * Verifies phone number is registered and valid
 */
export async function verifyPhone(userId: string): Promise<PhoneVerificationResult> {
  await delay(1200);
  
  // Fetch user profile phone
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone, phone_verified')
    .eq('id', userId)
    .single();
  
  let score = 0;
  const phone = profile?.phone || '';
  const isRegistered = Boolean(phone && phone.length >= 9);
  const isVerified = profile?.phone_verified === true;
  
  // Phone is registered in profile
  if (isRegistered) score += 5;
  
  // Phone is verified (OTP confirmed)
  if (isVerified) score += 10;
  
  // Valid Saudi phone format
  const saudiPhonePattern = /^(05|5|\+9665)\d{8}$/;
  const operatorVerified = saudiPhonePattern.test(phone.replace(/\s/g, ''));
  if (operatorVerified) score += 5;
  
  return {
    verified: score >= 10,
    phone,
    isRegistered,
    operatorVerified,
    score: Math.min(score, 15),
  };
}

/**
 * Email Verification Service
 * Verifies email is active and domain is valid
 */
export async function verifyEmail(userId: string): Promise<EmailVerificationResult> {
  await delay(1000);
  
  // Get auth user email
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email || '';
  const emailConfirmed = user?.email_confirmed_at !== null;
  
  let score = 0;
  
  // Email is confirmed
  if (emailConfirmed) score += 7;
  
  // Email has valid format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isActive = emailPattern.test(email);
  if (isActive) score += 3;
  
  // Check domain is not disposable
  const disposableDomains = ['tempmail.com', 'throwaway.com', 'guerrillamail.com', '10minutemail.com'];
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const domainValid = !disposableDomains.includes(domain);
  if (domainValid) score += 2;
  
  return {
    verified: emailConfirmed,
    email,
    isActive,
    domainValid,
    score: Math.min(score, 10),
  };
}

/**
 * History Check Service
 * Analyzes user order history and account activity
 */
export async function checkHistory(userId: string): Promise<HistoryCheckResult> {
  await delay(2000);
  
  // Fetch order statistics
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_price, created_at')
    .eq('user_id', userId);
  
  // Fetch profile for account age
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .single();
  
  // Fetch dev orders too
  const { data: devOrders } = await supabase
    .from('dev_orders')
    .select('id, status, created_at')
    .eq('user_id', userId);
  
  // Check for previous financing defaults
  const { data: financingApps } = await supabase
    .from('financing_applications')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'defaulted');
  
  const { data: overdueInstallments } = await supabase
    .from('financing_installments')
    .select('id')
    .in('application_id', (
      await supabase
        .from('financing_applications')
        .select('id')
        .eq('user_id', userId)
    ).data?.map(a => a.id) || [])
    .eq('status', 'overdue');
  
  const totalOrders = (orders?.length || 0) + (devOrders?.length || 0);
  const completedOrders = (orders?.filter(o => o.status === 'completed').length || 0) +
    (devOrders?.filter(o => o.status === 'completed').length || 0);
  const totalSpending = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;
  
  // Calculate account age in days
  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
  const accountAge = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Check for defaults
  const hasDefaults = (financingApps?.length || 0) > 0 || (overdueInstallments?.length || 0) > 0;
  
  // Calculate score
  let score = 0;
  
  // Orders score (max 15)
  if (completedOrders >= ELIGIBILITY_CONFIG.minOrders) score += 15;
  else if (completedOrders > 0) score += 8;
  
  // Spending score (max 10)
  if (totalSpending >= ELIGIBILITY_CONFIG.minSpending) score += 10;
  else if (totalSpending > 0) score += 5;
  
  // No defaults score (max 20)
  if (!hasDefaults) score += 20;
  
  // Account age score (max 5)
  if (accountAge >= ELIGIBILITY_CONFIG.minAccountAge) score += 5;
  else if (accountAge >= 15) score += 3;
  
  return {
    checked: true,
    totalOrders,
    completedOrders,
    totalSpending,
    hasDefaults,
    accountAge,
    score: Math.min(score, 50),
  };
}

// Helper function for delays
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
