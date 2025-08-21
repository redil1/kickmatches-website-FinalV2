import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db/client';
import { sql } from 'drizzle-orm';
import { getEmailBaseUrl, createEmailUrl } from '../../../../utils/url';

/**
 * Handle email unsubscribe requests
 * Supports both GET (one-click) and POST methods for compliance
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return createErrorResponse('Invalid unsubscribe token', 400);
  }
  
  try {
    const result = await unsubscribeUser(token);
    
    if (!result.success) {
      return createErrorResponse(result.error || 'Invalid unsubscribe token', 404);
    }
    
    // Return success page with professional styling
    return new NextResponse(createUnsubscribeSuccessPage(result.user), {
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return createErrorResponse('Failed to unsubscribe', 500);
  }
}

/**
 * Handle POST requests for unsubscribe (alternative method)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 400 });
    }
    
    const result = await unsubscribeUser(token);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Invalid unsubscribe token' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully unsubscribed from email notifications',
      user: result.user
    });
    
  } catch (error) {
    console.error('Unsubscribe POST error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}

/**
 * Core unsubscribe logic
 * @param token - Unsubscribe token
 * @returns Result object with success status and user data
 */
async function unsubscribeUser(token: string) {
  try {
    // Find user by unsubscribe token
    const userResult = await db.execute(
      sql`SELECT id, email, phone FROM app_users WHERE unsubscribe_token = ${token}`
    );
    
    const user = (userResult as any).rows?.[0];
    if (!user) {
      return { success: false, error: 'Invalid unsubscribe token' };
    }
    
    // Disable email notifications for the user
    await db.execute(sql`
      UPDATE app_users 
      SET email_notifications_enabled = false,
          unsubscribe_token = NULL
      WHERE unsubscribe_token = ${token}
    `);
    
    // Track unsubscribe in email history
    await db.execute(sql`
      UPDATE email_notification_history 
      SET unsubscribed_at = NOW() 
      WHERE user_id = ${user.id} AND unsubscribed_at IS NULL
    `);
    
    // Log unsubscribe event for analytics
    await db.execute(sql`
      INSERT INTO email_notification_history (
        user_id, email, subject, template_id, delivery_status
      ) VALUES (
        ${user.id}, ${user.email}, 'User unsubscribed', 'unsubscribe_event', 'unsubscribed'
      )
    `);
    
    console.log(`✅ User ${user.email} successfully unsubscribed from email notifications`);
    
    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone
      }
    };
    
  } catch (error) {
    console.error('Error in unsubscribeUser:', error);
    return { success: false, error: 'Database error occurred' };
  }
}

/**
 * Create error response
 * @param message - Error message
 * @param status - HTTP status code
 * @returns NextResponse with error
 */
function createErrorResponse(message: string, status: number) {
  return new NextResponse(createErrorPage(message), {
    status,
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Create professional unsubscribe success page
 * @param user - User data
 * @returns HTML string
 */
function createUnsubscribeSuccessPage(user: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribed Successfully - IPTV SMARTERS PRO</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .tagline {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 50px 40px;
            text-align: center;
        }
        .success-icon {
            font-size: 80px;
            color: #28a745;
            margin-bottom: 30px;
            animation: checkmark 0.6s ease-in-out;
        }
        @keyframes checkmark {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        .success-title {
            font-size: 28px;
            color: #333;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .success-message {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .user-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 30px 0;
            border-left: 4px solid #28a745;
        }
        .user-email {
            font-weight: bold;
            color: #333;
            font-size: 18px;
        }
        .options {
            margin: 40px 0;
        }
        .option-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            text-align: left;
        }
        .option-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }
        .option-icon {
            margin-right: 10px;
            font-size: 20px;
        }
        .option-description {
            color: #666;
            font-size: 14px;
            line-height: 1.5;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            margin: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        .button-secondary {
            background: linear-gradient(135deg, #6c757d, #495057);
            box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer-text {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }
        .contact-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
        }
        .contact-link {
            color: #667eea;
            text-decoration: none;
            font-weight: bold;
        }
        .contact-link:hover {
            text-decoration: underline;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 15px;
            }
            .content {
                padding: 30px 20px;
            }
            .success-title {
                font-size: 24px;
            }
            .button {
                display: block;
                margin: 10px 0;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">IPTV SMARTERS PRO</div>
            <div class="tagline">Premium Sports Streaming Experience</div>
        </div>
        
        <div class="content">
            <div class="success-icon">✅</div>
            <h1 class="success-title">Successfully Unsubscribed</h1>
            
            <div class="user-info">
                <div class="user-email">${user.email}</div>
                <div style="color: #666; margin-top: 5px;">Email notifications have been disabled</div>
            </div>
            
            <div class="success-message">
                You have been successfully unsubscribed from email notifications.<br>
                You will no longer receive match alert emails from IPTV SMARTERS PRO.
            </div>
            
            <div class="options">
                <div class="option-card">
                    <div class="option-title">
                        <span class="option-icon">📱</span>
                        Other Notification Options
                    </div>
                    <div class="option-description">
                        You can still receive push notifications and Telegram alerts if enabled. 
                        These provide instant match updates without email clutter.
                    </div>
                </div>
                
                <div class="option-card">
                    <div class="option-title">
                        <span class="option-icon">⚙️</span>
                        Manage All Preferences
                    </div>
                    <div class="option-description">
                        Visit your account settings to customize all notification preferences, 
                        including push notifications, Telegram alerts, and timing preferences.
                    </div>
                </div>
                
                <div class="option-card">
                    <div class="option-title">
                        <span class="option-icon">🔄</span>
                        Re-subscribe Anytime
                    </div>
                    <div class="option-description">
                        Changed your mind? You can easily re-enable email notifications 
                        from your account settings at any time.
                    </div>
                </div>
            </div>
            
            <div style="margin: 40px 0;">
                <a href="${createEmailUrl('/settings')}" class="button">
                    ⚙️ Manage Notification Preferences
                </a>
                <a href="${getEmailBaseUrl()}" class="button button-secondary">
                    🏠 Return to Homepage
                </a>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                <strong>Thank you for using IPTV SMARTERS PRO</strong><br>
                We respect your communication preferences and are committed to providing 
                you with the best sports streaming experience.
            </div>
            
            <div class="contact-info">
                <div style="margin-bottom: 10px;">Need help or have questions?</div>
                <a href="mailto:support@iptv-smarters-pro.com" class="contact-link">
                    📧 support@iptv-smarters-pro.com
                </a>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} IPTV SMARTERS PRO. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Create error page
 * @param message - Error message
 * @returns HTML string
 */
function createErrorPage(message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe Error - IPTV SMARTERS PRO</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            margin: 0;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            text-align: center;
        }
        .error-icon {
            font-size: 80px;
            color: #dc3545;
            margin-bottom: 30px;
        }
        .error-title {
            font-size: 28px;
            color: #333;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .error-message {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            margin: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1 class="error-title">Unsubscribe Error</h1>
        <div class="error-message">${message}</div>
        <a href="${getEmailBaseUrl()}" class="button">
            🏠 Return to Homepage
        </a>
    </div>
</body>
</html>`;
}