import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../db/client';
import { sql } from 'drizzle-orm';
import { EmailNotificationService } from '../../../services/emailService';
import { createEmailUrl } from '../../../utils/url';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('🔄 Production Email Workflow Test for:', email);
    
    const users = await db.execute(sql`SELECT * FROM app_users WHERE email = ${email}`);
    
    if (!users.rows || users.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users.rows[0] as any;
    console.log('👤 User:', user.email, '| Notifications:', user.email_notifications_enabled);
    
    const emailService = new EmailNotificationService();
    
    const emailData = {
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      league: 'Premier League',
      kickoffTime: 'Tuesday, January 14, 2025 at 8:30 PM GMT',
      minutesLeft: 30,
      matchSlug: 'test-match-production-flow',
      paymentLink: 'https://www.iptv.shopping/pricing',
      matchLink: createEmailUrl('/match/test-match'),
      viewerCount: 15000,
      userSegment: 'engaged',
      matchImportance: 'high',
      userName: user.phone || 'Sports Fan',
      isHalftime: false,
      utmParams: 'utm_source=email&utm_medium=notification&utm_campaign=match_alert&utm_content=30min_alert'
    };
    
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.phone || 'Sports Fan',
      unsubscribeToken: user.unsubscribe_token || '',
      emailNotificationsEnabled: user.email_notifications_enabled
    };
    
    console.log('📧 Sending production email...');
    
    const result = await emailService.sendMatchAlert(userProfile, emailData, 'match_alert_30min');
    
    if (result) {
      console.log('📧 SUCCESS ✅ Message ID:', result.messageId);
      return res.status(200).json({ 
        success: true, 
        messageId: result.messageId,
        message: 'Production email sent successfully'
      });
    } else {
      console.log('📧 FAILED ❌');
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send production email'
      });
    }
    
  } catch (error) {
    console.error('❌ Error sending production email:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}