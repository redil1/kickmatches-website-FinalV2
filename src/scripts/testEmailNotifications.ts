#!/usr/bin/env npx tsx

/**
 * Email Notifications Test Script
 * Comprehensive testing for the IPTV SMARTERS PRO email notification system
 */

import 'dotenv/config';
import { EmailNotificationService, UserEmailProfile } from '../services/emailService';
import { verifyEmailConnection, getEmailConfigStatus } from '../utils/email';
import { db } from '../db/client';
import { sql } from 'drizzle-orm';
import { seedEmailTemplates } from './seedEmailTemplates';
import { createEmailUrl } from '../utils/url';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  duration?: number;
  details?: any;
}

class EmailNotificationTester {
  private emailService: EmailNotificationService;
  private results: TestResult[] = [];

  constructor() {
    this.emailService = new EmailNotificationService();
  }

  /**
   * Run all email notification tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Email Notification System Tests');
    console.log('=' .repeat(60));

    // Test 1: Environment Configuration
    await this.testEnvironmentConfig();

    // Test 2: SMTP Connection
    await this.testSMTPConnection();

    // Test 3: Database Setup
    await this.testDatabaseSetup();

    // Test 4: Email Templates
    await this.testEmailTemplates();

    // Test 5: Template Rendering
    await this.testTemplateRendering();

    // Test 6: Individual Email Sending
    await this.testIndividualEmail();

    // Test 7: Bulk Email Sending
    await this.testBulkEmails();

    // Test 8: Unsubscribe Functionality
    await this.testUnsubscribeFunctionality();

    // Test 9: Email Analytics
    await this.testEmailAnalytics();

    // Test 10: Error Handling
    await this.testErrorHandling();

    // Display Results
    this.displayResults();
  }

  /**
   * Test environment configuration
   */
  private async testEnvironmentConfig(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const config = getEmailConfigStatus();
      const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        this.addResult({
          test: 'Environment Configuration',
          success: false,
          message: `Missing environment variables: ${missingVars.join(', ')}`,
          duration: Date.now() - startTime
        });
        return;
      }
      
      this.addResult({
        test: 'Environment Configuration',
        success: true,
        message: 'All required environment variables are set',
        duration: Date.now() - startTime,
        details: {
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.hasAuth ? 'configured' : 'not configured'
        }
      });
      
    } catch (error) {
      this.addResult({
        test: 'Environment Configuration',
        success: false,
        message: `Configuration error: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test SMTP connection
   */
  private async testSMTPConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const connectionResult = await verifyEmailConnection();
      
      const result = {
        success: connectionResult,
        message: connectionResult ? 'SMTP connection successful' : 'SMTP connection failed',
        details: getEmailConfigStatus()
      };
      
      this.addResult({
        test: 'SMTP Connection',
        success: result.success,
        message: result.message,
        duration: Date.now() - startTime,
        details: result.details
      });
      
    } catch (error) {
      this.addResult({
        test: 'SMTP Connection',
        success: false,
        message: `Connection failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test database setup
   */
  private async testDatabaseSetup(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check if email-related tables exist
      const tables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('email_notification_history', 'email_templates')
      `);
      
      const tableNames = (tables as any).rows?.map((row: any) => row.table_name) || [];
      const expectedTables = ['email_notification_history', 'email_templates'];
      const missingTables = expectedTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length > 0) {
        this.addResult({
          test: 'Database Setup',
          success: false,
          message: `Missing tables: ${missingTables.join(', ')}`,
          duration: Date.now() - startTime
        });
        return;
      }
      
      // Check app_users table for email columns
      const userColumns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name IN ('email', 'email_notifications_enabled', 'email_verified', 'unsubscribe_token')
      `);
      
      const columnNames = (userColumns as any).rows?.map((row: any) => row.column_name) || [];
      const expectedColumns = ['email', 'email_notifications_enabled', 'email_verified', 'unsubscribe_token'];
      const missingColumns = expectedColumns.filter(col => !columnNames.includes(col));
      
      if (missingColumns.length > 0) {
        this.addResult({
          test: 'Database Setup',
          success: false,
          message: `Missing app_users columns: ${missingColumns.join(', ')}`,
          duration: Date.now() - startTime
        });
        return;
      }
      
      this.addResult({
        test: 'Database Setup',
        success: true,
        message: 'All required tables and columns exist',
        duration: Date.now() - startTime,
        details: {
          tables: tableNames,
          columns: columnNames
        }
      });
      
    } catch (error) {
      this.addResult({
        test: 'Database Setup',
        success: false,
        message: `Database error: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test email templates
   */
  private async testEmailTemplates(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Seed templates first
      await seedEmailTemplates();
      
      // Check if templates exist
      const templates = await db.execute(sql`
        SELECT id, name, is_active, 
               LENGTH(html_content) as html_length,
               LENGTH(text_content) as text_length
        FROM email_templates 
        WHERE is_active = true
      `);
      
      const templateRows = (templates as any).rows || [];
      const expectedTemplates = ['match_alert_60min', 'match_alert_30min', 'match_alert_5min', 'match_halftime'];
      const existingTemplateIds = templateRows.map((row: any) => row.id);
      const missingTemplates = expectedTemplates.filter(id => !existingTemplateIds.includes(id));
      
      if (missingTemplates.length > 0) {
        this.addResult({
          test: 'Email Templates',
          success: false,
          message: `Missing templates: ${missingTemplates.join(', ')}`,
          duration: Date.now() - startTime
        });
        return;
      }
      
      // Validate template content
      const invalidTemplates = templateRows.filter((row: any) => 
        row.html_length < 100 || row.text_length < 50
      );
      
      if (invalidTemplates.length > 0) {
        this.addResult({
          test: 'Email Templates',
          success: false,
          message: `Templates with insufficient content: ${invalidTemplates.map((t: any) => t.id).join(', ')}`,
          duration: Date.now() - startTime
        });
        return;
      }
      
      this.addResult({
        test: 'Email Templates',
        success: true,
        message: `All ${templateRows.length} templates are valid and active`,
        duration: Date.now() - startTime,
        details: {
          templates: templateRows.map((row: any) => ({
            id: row.id,
            name: row.name,
            htmlLength: row.html_length,
            textLength: row.text_length
          }))
        }
      });
      
    } catch (error) {
      this.addResult({
        test: 'Email Templates',
        success: false,
        message: `Template error: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test template rendering
   */
  private async testTemplateRendering(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const testData = {
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        league: 'Premier League',
        kickoffTime: 'Saturday, January 11, 2025 at 3:00 PM GMT',
        minutesLeft: 30,
        matchSlug: 'manchester-united-vs-liverpool-2025-01-11',
        paymentLink: 'https://www.iptv.shopping/pricing?utm_test=true',
        matchLink: 'http://localhost:3000/match/manchester-united-vs-liverpool-2025-01-11',
        viewerCount: 15000,
        userSegment: 'engaged',
        matchImportance: 'high',
        utmParams: 'utm_source=email&utm_medium=notification&utm_campaign=match_alert&utm_content=template_rendering_test',
        urgencyLevel: 'high',
        psychologyTriggers: ['urgency', 'fomo'],
        userName: 'Test User',
        isHalftime: false
      };
      
      const templateIds = ['match_alert_60min', 'match_alert_30min', 'match_alert_5min', 'match_halftime'];
      const renderResults = [];
      
      for (const templateId of templateIds) {
        try {
          const rendered = await this.emailService.renderTemplate(templateId, testData);
          
          if (!rendered.html || !rendered.text || !rendered.subject) {
            renderResults.push({ templateId, success: false, error: 'Missing content' });
            continue;
          }
          
          // Check if variables were replaced
          const hasUnreplacedVars = rendered.html.includes('{{') || rendered.text.includes('{{');
          if (hasUnreplacedVars) {
            renderResults.push({ templateId, success: false, error: 'Unreplaced variables found' });
            continue;
          }
          
          renderResults.push({ 
            templateId, 
            success: true, 
            htmlLength: rendered.html.length,
            textLength: rendered.text.length,
            subject: rendered.subject
          });
          
        } catch (renderError) {
          renderResults.push({ templateId, success: false, error: renderError });
        }
      }
      
      const failedRenders = renderResults.filter(r => !r.success);
      
      if (failedRenders.length > 0) {
        this.addResult({
          test: 'Template Rendering',
          success: false,
          message: `Failed to render ${failedRenders.length} templates`,
          duration: Date.now() - startTime,
          details: { failed: failedRenders }
        });
        return;
      }
      
      this.addResult({
        test: 'Template Rendering',
        success: true,
        message: `Successfully rendered all ${renderResults.length} templates`,
        duration: Date.now() - startTime,
        details: { results: renderResults }
      });
      
    } catch (error) {
      this.addResult({
        test: 'Template Rendering',
        success: false,
        message: `Rendering error: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test individual email sending
   */
  private async testIndividualEmail(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const testEmail = process.env.TEST_EMAIL || 'test@example.com';
      
      if (!testEmail || testEmail === 'test@example.com') {
        this.addResult({
          test: 'Individual Email Sending',
          success: false,
          message: 'TEST_EMAIL environment variable not set',
          duration: Date.now() - startTime
        });
        return;
      }
      
      const testData = {
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        league: 'Premier League',
        kickoffTime: 'Sunday, January 12, 2025 at 4:30 PM GMT',
        minutesLeft: 5,
        matchSlug: 'arsenal-vs-chelsea-2025-01-12',
        paymentLink: 'https://www.iptv.shopping/pricing?utm_test=individual',
        matchLink: 'http://localhost:3000/match/arsenal-vs-chelsea-2025-01-12',
        viewerCount: 25000,
        userSegment: 'vip',
        matchImportance: 'high',
        utmParams: 'utm_source=email&utm_medium=notification&utm_campaign=match_alert&utm_content=individual_email_test',
        urgencyLevel: 'critical',
        psychologyTriggers: ['urgency', 'exclusivity'],
        userName: 'Test VIP User',
        isHalftime: false
      };
      
      const userProfile: UserEmailProfile = {
        id: 'test-user-id',
        email: testEmail,
        name: 'Test VIP User',
        unsubscribeToken: 'test-token-' + Date.now(),
        emailNotificationsEnabled: true
      };
      
      const result = await this.emailService.sendMatchAlert(
        userProfile,
        testData,
        'match_alert_5min'
      );
      
      const success = result !== null;
      
      this.addResult({
        test: 'Individual Email Sending',
        success,
        message: success ? `Email sent to ${testEmail}` : 'Failed to send email',
        duration: Date.now() - startTime,
        details: result
      });
      
    } catch (error) {
      this.addResult({
        test: 'Individual Email Sending',
        success: false,
        message: `Send error: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test bulk email sending
   */
  private async testBulkEmails(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const testEmails = [
        process.env.TEST_EMAIL || 'test1@example.com',
        process.env.TEST_EMAIL_2 || 'test2@example.com'
      ].filter(email => email && !email.includes('example.com'));
      
      if (testEmails.length === 0) {
        this.addResult({
          test: 'Bulk Email Sending',
          success: false,
          message: 'No valid test emails configured',
          duration: Date.now() - startTime
        });
        return;
      }
      
      const testData = {
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        league: 'La Liga',
        kickoffTime: 'Saturday, January 18, 2025 at 9:00 PM CET',
        minutesLeft: 60,
        matchSlug: 'barcelona-vs-real-madrid-2025-01-18',
        paymentLink: 'https://www.iptv.shopping/pricing?utm_test=bulk',
        matchLink: 'http://localhost:3000/match/barcelona-vs-real-madrid-2025-01-18',
        viewerCount: 50000,
        userSegment: 'engaged',
        matchImportance: 'high',
        utmParams: 'utm_source=email&utm_medium=notification&utm_campaign=match_alert&utm_content=bulk_email_test',
        urgencyLevel: 'medium',
        psychologyTriggers: ['social_proof', 'fomo'],
        userName: 'Football Fan',
        isHalftime: false
      };
      
      const userProfiles = testEmails.map((email, index) => ({
        id: `test-user-${index}`,
        email,
        name: 'Football Fan',
        unsubscribeToken: `test-token-${index}-${Date.now()}`,
        emailNotificationsEnabled: true
      }));
      
      const result = await this.emailService.sendBulkMatchAlerts(
        userProfiles,
        testData,
        'match_alert_60min'
      );
      
      const successful = result.filter(r => r && !('error' in r)).length;
      const failed = result.filter(r => r && 'error' in r).length;
      const success = successful > 0;
      
      this.addResult({
        test: 'Bulk Email Sending',
        success,
        message: success 
          ? `Sent ${successful}/${userProfiles.length} emails (${failed} failed)` 
          : `All ${failed} emails failed`,
        duration: Date.now() - startTime,
        details: { successful, failed, results: result }
      });
      
    } catch (error) {
      this.addResult({
        test: 'Bulk Email Sending',
        success: false,
        message: `Bulk send error: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test unsubscribe functionality
   */
  private async testUnsubscribeFunctionality(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Create a test user with unsubscribe token
      const testToken = 'test-unsubscribe-token-' + Date.now();
      const testEmail = 'unsubscribe-test@example.com';
      
      await db.execute(sql`
        INSERT INTO app_users (email, email_notifications_enabled, email_verified, unsubscribe_token)
        VALUES (${testEmail}, true, true, ${testToken})
        ON CONFLICT (email) DO UPDATE SET
          email_notifications_enabled = true,
          email_verified = true,
          unsubscribe_token = ${testToken}
      `);
      
      // Test unsubscribe URL generation
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/unsubscribe?token=${testToken}`;
      
      // Verify user exists and is subscribed
      const userBefore = await db.execute(sql`
        SELECT email_notifications_enabled FROM app_users WHERE unsubscribe_token = ${testToken}
      `);
      
      const isSubscribedBefore = (userBefore as any).rows?.[0]?.email_notifications_enabled;
      
      if (!isSubscribedBefore) {
        this.addResult({
          test: 'Unsubscribe Functionality',
          success: false,
          message: 'Test user not properly subscribed',
          duration: Date.now() - startTime
        });
        return;
      }
      
      this.addResult({
        test: 'Unsubscribe Functionality',
        success: true,
        message: 'Unsubscribe token generated and user setup completed',
        duration: Date.now() - startTime,
        details: {
          testEmail,
          unsubscribeUrl,
          tokenGenerated: true
        }
      });
      
      // Clean up test user
      await db.execute(sql`DELETE FROM app_users WHERE email = ${testEmail}`);
      
    } catch (error) {
      this.addResult({
        test: 'Unsubscribe Functionality',
        success: false,
        message: `Unsubscribe test error: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test email analytics
   */
  private async testEmailAnalytics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const analytics = await this.emailService.getEmailAnalytics();
      
      this.addResult({
        test: 'Email Analytics',
        success: true,
        message: 'Analytics retrieved successfully',
        duration: Date.now() - startTime,
        details: analytics
      });
      
    } catch (error) {
      this.addResult({
        test: 'Email Analytics',
        success: false,
        message: `Analytics error: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test invalid email
      const invalidUserProfile: UserEmailProfile = {
        id: 'test-user',
        email: 'invalid-email',
        name: 'Test User',
        unsubscribeToken: 'test-token',
        emailNotificationsEnabled: true
      };
      
      const invalidEmailResult = await this.emailService.sendMatchAlert(
        invalidUserProfile,
        {} as any,
        'match_alert_5min'
      );
      
      // Test invalid template
      const validUserProfile: UserEmailProfile = {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        unsubscribeToken: 'test-token',
        emailNotificationsEnabled: true
      };
      
      const invalidTemplateResult = await this.emailService.sendMatchAlert(
        validUserProfile,
        {} as any,
        'non-existent-template'
      );
      
      const errorTests = [
        { name: 'Invalid Email', result: invalidEmailResult, shouldFail: true },
        { name: 'Invalid Template', result: invalidTemplateResult, shouldFail: true }
      ];
      
      const failedErrorTests = errorTests.filter(test => {
        if (!test.result) return test.shouldFail;
        // For error tests, we expect null results for failures
        const actuallyFailed = test.result === null;
        return test.shouldFail ? !actuallyFailed : actuallyFailed;
      });
      
      if (failedErrorTests.length > 0) {
        this.addResult({
          test: 'Error Handling',
          success: false,
          message: `Error handling failed for: ${failedErrorTests.map(t => t.name).join(', ')}`,
          duration: Date.now() - startTime
        });
        return;
      }
      
      this.addResult({
        test: 'Error Handling',
        success: true,
        message: 'All error scenarios handled correctly',
        duration: Date.now() - startTime,
        details: errorTests
      });
      
    } catch (error) {
      this.addResult({
        test: 'Error Handling',
        success: false,
        message: `Error handling test failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Add test result
   */
  private addResult(result: TestResult): void {
    this.results.push(result);
    const status = result.success ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${status} ${result.test}: ${result.message}${duration}`);
  }

  /**
   * Display final test results
   */
  private displayResults(): void {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 EMAIL NOTIFICATION SYSTEM TEST RESULTS');
    console.log('=' .repeat(60));
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    console.log(`\n📈 Summary: ${passed}/${total} tests passed (${failed} failed)`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }
    
    if (passed > 0) {
      console.log('\n✅ Passed Tests:');
      this.results
        .filter(r => r.success)
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }
    
    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    console.log(`\n⏱️  Total test duration: ${totalDuration}ms`);
    
    console.log('\n' + '=' .repeat(60));
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Email notification system is ready.');
    } else {
      console.log('⚠️  Some tests failed. Please review the configuration and try again.');
      process.exit(1);
    }
  }
}

/**
 * Quick test functions for individual components
 */
export async function quickTestSMTP(): Promise<void> {
  console.log('🔌 Quick SMTP Connection Test');
  const result = await verifyEmailConnection();
  console.log(result ? '✅ SMTP Connected' : '❌ SMTP Failed');
}

export async function quickTestTemplate(templateId: string): Promise<void> {
  console.log(`📧 Quick Template Test: ${templateId}`);
  
  const emailService = new EmailNotificationService();
  const testData = {
    homeTeam: 'Test Home',
    awayTeam: 'Test Away',
    league: 'Test League',
    kickoffTime: new Date().toLocaleString(),
    minutesLeft: 30,
    matchSlug: 'test-match',
    paymentLink: 'https://test.com',
    matchLink: createEmailUrl('/match/test-match'),
    viewerCount: 1000,
    userSegment: 'test',
    matchImportance: 'medium',
    utmParams: 'utm_source=email&utm_medium=notification&utm_campaign=test&utm_content=quick_test',
    urgencyLevel: 'medium',
    psychologyTriggers: ['test'],
    userName: 'Test User',
    isHalftime: false
  };
  
  try {
    const rendered = await emailService.renderTemplate(templateId, testData);
    console.log('✅ Template rendered successfully');
    console.log(`📝 Subject: ${rendered.subject}`);
    console.log(`📄 HTML length: ${rendered.html.length} chars`);
    console.log(`📄 Text length: ${rendered.text.length} chars`);
  } catch (error) {
    console.log(`❌ Template failed: ${error}`);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new EmailNotificationTester();
  tester.runAllTests()
    .then(() => {
      console.log('\n🏁 Email notification tests completed!');
    })
    .catch((error) => {
      console.error('\n💥 Test runner failed:', error);
      process.exit(1);
    });
}

/**
 * Usage Examples:
 * 
 * # Run all tests
 * npx tsx src/scripts/testEmailNotifications.ts
 * 
 * # Quick SMTP test
 * import { quickTestSMTP } from './src/scripts/testEmailNotifications';
 * await quickTestSMTP();
 * 
 * # Quick template test
 * import { quickTestTemplate } from './src/scripts/testEmailNotifications';
 * await quickTestTemplate('match_alert_5min');
 */