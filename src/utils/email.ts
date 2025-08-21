import nodemailer from 'nodemailer';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// SMTP Configuration
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

// Create reusable transporter object using SMTP transport
export const transporter = nodemailer.createTransport(emailConfig);

/**
 * Verify SMTP connection
 * @returns Promise<boolean> - true if connection is successful
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ SMTP server connection verified');
    return true;
  } catch (error) {
    console.error('❌ SMTP server connection failed:', error);
    return false;
  }
}

/**
 * Send email using the configured transporter
 * @param mailOptions - Email options (to, subject, html, text, etc.)
 * @returns Promise with send result
 */
export async function sendEmail(mailOptions: any) {
  try {
    const result = await transporter.sendMail({
      from: `"IPTV SMARTERS PRO" <${process.env.SMTP_FROM_EMAIL}>`,
      ...mailOptions
    });
    
    console.log(`✅ Email sent successfully: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

/**
 * Generate UTM parameters for email tracking
 * @param templateId - Email template identifier
 * @param userId - User identifier
 * @param matchSlug - Match slug for tracking
 * @returns UTM parameter string
 */
export function generateEmailUTM(templateId: string, userId: string, matchSlug?: string): string {
  const params = new URLSearchParams({
    utm_source: 'email',
    utm_medium: 'notification',
    utm_campaign: templateId,
    utm_content: userId
  });
  
  if (matchSlug) {
    params.append('utm_term', matchSlug);
  }
  
  return params.toString();
}

/**
 * Convert HTML to plain text for email fallback
 * @param html - HTML content
 * @returns Plain text version
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove style tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .trim();
}

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns boolean - true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get email configuration status for debugging
 * @returns Object with configuration status
 */
export function getEmailConfigStatus() {
  return {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    hasAuth: !!(emailConfig.auth.user && emailConfig.auth.pass),
    fromEmail: process.env.SMTP_FROM_EMAIL || 'Not configured'
  };
}

/**
 * Initialize email system and verify connection
 * Called during application startup
 */
export async function initializeEmailSystem(): Promise<void> {
  console.log('🚀 Initializing email notification system...');
  
  const config = getEmailConfigStatus();
  console.log('📧 Email configuration:', config);
  
  if (!config.hasAuth) {
    console.warn('⚠️  SMTP authentication not configured. Email notifications will be disabled.');
    return;
  }
  
  const isConnected = await verifyEmailConnection();
  if (!isConnected) {
    console.error('❌ Email system initialization failed. Email notifications will be disabled.');
    return;
  }
  
  console.log('✅ Email notification system initialized successfully');
}