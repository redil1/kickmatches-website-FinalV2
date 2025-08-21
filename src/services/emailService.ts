import { transporter, generateEmailUTM, htmlToText } from '../utils/email';
import { db } from '../db/client';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
import { getEmailBaseUrl, createEmailUrl } from '../utils/url';

interface EmailNotificationData {
  homeTeam: string;
  awayTeam: string;
  minutesLeft: number;
  matchSlug: string;
  paymentLink: string;
  matchLink: string;
  viewerCount: number;
  matchImportance: string;
  userSegment: string;
  utmParams: string;
  league?: string;
  kickoffTime?: string;
}

export interface UserEmailProfile {
  id: string;
  email: string;
  name?: string;
  unsubscribeToken: string;
  emailNotificationsEnabled: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  template_type: string;
  urgency_level: string;
  psychology_triggers: string[];
  conversion_optimized: boolean;
}

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export class EmailNotificationService {
  private baseUrl = getEmailBaseUrl();
  private fromEmail = process.env.EMAIL_FROM || 'IPTV SMARTERS PRO <kickmatches@elitemail.email>';
  private fromName = process.env.SMTP_FROM_NAME || 'IPTV SMARTERS PRO';
  
  /**
   * Send match alert email to user
   * @param user - User email profile
   * @param data - Email notification data
   * @param templateId - Email template identifier
   * @returns Promise with send result
   */
  async sendMatchAlert(user: UserEmailProfile, data: EmailNotificationData, templateId: string) {
    if (!user.emailNotificationsEnabled) {
      console.log(`📧 Email notifications disabled for user ${user.id}`);
      return null;
    }
    
    if (!user.email || !this.isValidEmail(user.email)) {
      console.log(`📧 Invalid email address for user ${user.id}: ${user.email}`);
      return null;
    }
    
    try {
      const template = await this.getEmailTemplate(templateId);
      if (!template) {
        throw new Error(`Email template not found: ${templateId}`);
      }
      
      const renderedEmail = this.renderEmailTemplate(template, data, user);
      
      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: renderedEmail.subject,
        html: renderedEmail.html,
        text: renderedEmail.text,
        headers: {
          'X-Template-ID': templateId,
          'X-User-ID': user.id,
          'X-Match-Slug': data.matchSlug
        }
      };
      
      const result = await transporter.sendMail(mailOptions);
      
      // Track email sent
      await this.trackEmailSent(
        user.id, 
        user.email, 
        renderedEmail.subject, 
        templateId, 
        data.matchSlug
      );
      
      console.log(`✅ Email sent to ${user.email}: ${result.messageId}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to send email to ${user.email}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.trackEmailFailure(user.id, user.email, templateId, errorMessage);
      throw error;
    }
  }
  
  /**
   * Send bulk email notifications to multiple users
   * @param users - Array of user email profiles
   * @param data - Email notification data
   * @param templateId - Email template identifier
   * @returns Promise with results array
   */
  async sendBulkMatchAlerts(
    users: UserEmailProfile[], 
    data: EmailNotificationData, 
    templateId: string
  ) {
    type EmailResult = any | { error: any; user: UserEmailProfile };
    const results: EmailResult[] = [];
    const batchSize = 10; // Send emails in batches to avoid overwhelming SMTP server
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchPromises = batch.map(user => 
        this.sendMatchAlert(user, data, templateId).catch(error => ({ error, user }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const successful = results.filter(r => r && !this.isErrorResult(r)).length;
    const failed = results.filter(r => r && this.isErrorResult(r)).length;
    
    console.log(`📧 Bulk email results: ${successful} sent, ${failed} failed`);
    return results;
  }
  
  /**
   * Type guard to check if result is an error result
   * @param result - Email result
   * @returns true if result is an error
   */
  private isErrorResult(result: any): result is { error: any; user: UserEmailProfile } {
    return result && typeof result === 'object' && 'error' in result && 'user' in result;
  }
  
  /**
   * Render email template with dynamic data
   * @param template - Email template
   * @param data - Notification data
   * @param user - User profile
   * @returns Rendered email content
   */
  private renderEmailTemplate(
    template: EmailTemplate, 
    data: EmailNotificationData, 
    user: UserEmailProfile
  ): RenderedEmail {
    const unsubscribeLink = `${this.baseUrl}/api/email/unsubscribe?token=${user.unsubscribeToken}`;
    
    // Prepare template variables
    const variables = {
      ...data,
      userName: user.name || 'Sports Fan',
      userEmail: user.email,
      unsubscribeLink,
      baseUrl: this.baseUrl,
      currentYear: new Date().getFullYear().toString(),
      urgencyText: this.getUrgencyText(data.minutesLeft),
      ctaText: this.getCTAText(data.minutesLeft),
      socialProofText: this.getSocialProofText(data.viewerCount),
      matchDateTime: data.kickoffTime || 'Soon',
      leagueName: data.league || 'Premier League'
    };
    
    const subject = this.replaceVariables(template.subject, variables);
    const html = this.replaceVariables(template.html_content, variables);
    const text = this.replaceVariables(
      template.text_content || htmlToText(html), 
      variables
    );
    
    return { subject, html, text };
  }
  
  /**
   * Replace template variables with actual values
   * @param template - Template string with {{variable}} placeholders
   * @param variables - Object with variable values
   * @returns Rendered string
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    if (!template || typeof template !== 'string') {
      console.error('Template is null, undefined, or not a string:', template);
      return '';
    }
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      return value !== undefined ? String(value) : match;
    });
  }
  
  /**
   * Get email template from database
   * @param templateId - Template identifier
   * @returns Email template or null
   */
  private async getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM email_templates WHERE id = ${templateId}`
      );
      
      const rows = (result as any).rows || [];
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Failed to get email template ${templateId}:`, error);
      return null;
    }
  }
  
  /**
   * Track successful email send
   * @param userId - User ID
   * @param email - Email address
   * @param subject - Email subject
   * @param templateId - Template ID
   * @param matchId - Match ID (optional)
   */
  private async trackEmailSent(
    userId: string, 
    email: string, 
    subject: string, 
    templateId: string, 
    matchId?: string
  ) {
    try {
      // Only use matchId if it's a valid UUID format, otherwise set to null
      const validMatchId = matchId && this.isValidUUID(matchId) ? matchId : null;
      
      await db.execute(sql`
        INSERT INTO email_notification_history (
          user_id, template_id, match_id, status, notification_channel
        ) VALUES (
          ${userId}, ${templateId}, ${validMatchId}, 'sent', 'email'
        )
      `);
    } catch (error) {
      console.error('Failed to track email sent:', error);
    }
  }
  
  /**
   * Track email send failure
   * @param userId - User ID
   * @param email - Email address
   * @param templateId - Template ID
   * @param errorMessage - Error message
   */
  private async trackEmailFailure(
    userId: string, 
    email: string, 
    templateId: string, 
    errorMessage: string
  ) {
    try {
      await db.execute(sql`
        INSERT INTO email_notification_history (
          user_id, template_id, status, error_message, notification_channel
        ) VALUES (
          ${userId}, ${templateId}, 'failed', ${errorMessage}, 'email'
        )
      `);
    } catch (error) {
      console.error('Failed to track email failure:', error);
    }
  }
  
  /**
   * Generate or update unsubscribe token for user
   * @param userId - User ID
   * @returns Unsubscribe token
   */
  async generateUnsubscribeToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    
    try {
      await db.execute(sql`
        UPDATE app_users SET unsubscribe_token = ${token} WHERE id = ${userId}
      `);
      return token;
    } catch (error) {
      console.error('Failed to generate unsubscribe token:', error);
      throw error;
    }
  }
  
  /**
   * Get users with email notifications enabled
   * @returns Array of user email profiles
   */
  async getEmailEnabledUsers(): Promise<UserEmailProfile[]> {
    try {
      const result = await db.execute(sql`
        SELECT id, email, unsubscribe_token, email_notifications_enabled 
        FROM app_users 
        WHERE email IS NOT NULL 
        AND email_notifications_enabled = true
        AND email != ''
      `);
      
      return (result as any).rows || [];
    } catch (error) {
      console.error('Failed to get email enabled users:', error);
      return [];
    }
  }
  
  /**
   * Validate email address format
   * @param email - Email address
   * @returns true if valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate UUID format
   * @param uuid - UUID string
   * @returns true if valid UUID
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  
  /**
   * Get urgency text based on minutes left
   * @param minutesLeft - Minutes until match
   * @returns Urgency text
   */
  private getUrgencyText(minutesLeft: number): string {
    if (minutesLeft <= 5) return '🚨 STARTING NOW';
    if (minutesLeft <= 30) return '⚡ URGENT';
    if (minutesLeft <= 60) return '🔥 SOON';
    return '📅 UPCOMING';
  }
  
  /**
   * Get CTA text based on minutes left
   * @param minutesLeft - Minutes until match
   * @returns CTA text
   */
  private getCTAText(minutesLeft: number): string {
    if (minutesLeft <= 5) return 'Watch Live NOW';
    if (minutesLeft <= 30) return 'Get Ready to Watch';
    return 'Set Reminder & Watch';
  }
  
  /**
   * Get social proof text based on viewer count
   * @param viewerCount - Number of viewers
   * @returns Social proof text
   */
  private getSocialProofText(viewerCount: number): string {
    if (viewerCount > 10000) return `Over ${Math.floor(viewerCount / 1000)}K fans watching`;
    if (viewerCount > 1000) return `${Math.floor(viewerCount / 100) * 100}+ fans getting ready`;
    return `${viewerCount} sports fans preparing to watch`;
  }
  
  /**
   * Render email template with data (public method for testing)
   * @param templateId - Template identifier
   * @param data - Email notification data
   * @param user - Optional user profile (will create default if not provided)
   * @returns Rendered email content
   */
  async renderTemplate(
    templateId: string, 
    data: EmailNotificationData, 
    user?: Partial<UserEmailProfile>
  ): Promise<RenderedEmail> {
    const template = await this.getEmailTemplate(templateId);
    if (!template) {
      throw new Error(`Email template not found: ${templateId}`);
    }
    
    // Create default user profile if not provided
    const userProfile: UserEmailProfile = {
      id: user?.id || 'test-user',
      email: user?.email || 'test@example.com',
      name: user?.name || 'Test User',
      unsubscribeToken: user?.unsubscribeToken || 'test-token',
      emailNotificationsEnabled: user?.emailNotificationsEnabled ?? true
    };
    
    return this.renderEmailTemplate(template, data, userProfile);
  }

  /**
   * Get email analytics for admin dashboard
   * @param days - Number of days to look back
   * @returns Email analytics data
   */
  async getEmailAnalytics(days: number = 30) {
    try {
      const result = await db.execute(sql`
        SELECT 
          template_id,
          COUNT(*) as sent_count,
          COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened_count,
          COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked_count,
          COUNT(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 END) as unsubscribed_count,
          COUNT(CASE WHEN delivery_status = 'failed' THEN 1 END) as failed_count
        FROM email_notification_history 
        WHERE sent_at >= NOW() - INTERVAL '${days} days'
        GROUP BY template_id
        ORDER BY sent_count DESC
      `);
      
      return (result as any).rows || [];
    } catch (error) {
      console.error('Failed to get email analytics:', error);
      return [];
    }
  }
}