import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { scheduleTrialFlow } from '@/worker/queue'
import { appUsers } from '@/db/schema'
import argon2 from 'argon2'

// Trial start: verifies OTP, enforces cooldown, provisions credentials, inserts trial row, schedules jobs
// Expects JSON: { phone, token, fingerprint_hash, device_type, browser_info, email, fingerprint_details }
export async function POST(req: NextRequest) {
  const { phone, token, fingerprint_hash, device_type, browser_info, slug: _slug, email, fingerprint_details } = await req
    .json()
    .catch(() => ({}))

  // Validate all required fields - no fallbacks allowed
  if (!phone || !token) {
    return NextResponse.json({ ok: false, error: 'bad_request', message: 'Phone and token are required' }, { status: 400 })
  }

  if (!fingerprint_hash || !device_type || !fingerprint_details) {
    return NextResponse.json({ ok: false, error: 'bad_request', message: 'Fingerprint data is required' }, { status: 400 })
  }

  // Validate fingerprint_details structure
  if (!fingerprint_details.canvas || !fingerprint_details.userAgent || !fingerprint_details.timezone || 
      !fingerprint_details.hardware?.screen?.width || !fingerprint_details.hardware?.screen?.height) {
    return NextResponse.json({ ok: false, error: 'bad_request', message: 'Complete fingerprint data is required' }, { status: 400 })
  }

  const ipHeader =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  const ip = ipHeader ?? null

  // Generate email from phone if not provided for early validation
  const userEmail = email || `${phone.replace('+', '').replace(/\D/g, '')}@kickai.trial`;

  console.log('🔍 Trial request received:');
  console.log('📱 Phone:', phone);
  console.log('📧 Email:', userEmail);
  console.log('🌐 IP:', ip);
  console.log('🔍 Fingerprint:', fingerprint_hash);
  console.log('💻 Device:', device_type);

  // Enforce 1 trial per day by phone (BEFORE N8N REQUEST)
  console.log('🛡️ Checking for existing trials...');
  try {
    const cooldown = await db.execute(sql`
      select count(*)::int as c
      from trial_sessions
      where phone = ${phone}
      and start_time > now() - interval '1 day'
      and status = 'active'
    `)
    
    const c = (cooldown as any).rows?.[0]?.c ?? 0;
    
    console.log('🔍 Found', c, 'existing trials in last 24h');
    if (Number(c) > 0) {
      console.log('❌ BLOCKING: User already has active trial');
      
      return NextResponse.json({ 
        ok: false, 
        error: 'cooldown',
        message: 'You have already used your free trial. Please wait 24 hours or contact support.'
      }, { status: 429 })
    } else {
      console.log('✅ PASSED: No existing trials found - proceeding');
    }
  } catch (cooldownError: any) {
    console.error('❌ CRITICAL: Cooldown check failed:', cooldownError.message);
    // DO NOT continue - we must block if we can't verify
    return NextResponse.json({ 
      ok: false, 
      error: 'system_error',
      message: 'System maintenance in progress. Please try again later.'
    }, { status: 503 });
  }

  // Verify OTP locally (check if exists and not consumed)
  const otpCheck = await db.execute(
    sql`
      select id, created_at, code from one_time_codes 
      where phone=${phone} and consumed=false 
      order by created_at desc limit 5
    `
  );
  
  const otpRows = (otpCheck as any).rows as Array<{ id: string; created_at: string; code: string }>;
  if (!otpRows.length) {
    return NextResponse.json({ ok: false, error: 'otp' }, { status: 400 });
  }

  // Verify the token against recent OTPs
  let matchedOtpId: string | null = null;
  for (const otpRow of otpRows) {
    try {
      if (await argon2.verify(otpRow.code, token)) {
        // Check if OTP is not expired (10 minutes)
        const createdAt = new Date(otpRow.created_at);
        if (Date.now() - createdAt.getTime() <= 10 * 60 * 1000) {
          matchedOtpId = otpRow.id;
          break;
        }
      }
    } catch (err) {
      console.warn('OTP verification error:', err);
    }
  }

  if (!matchedOtpId) {
    return NextResponse.json({ ok: false, error: 'otp' }, { status: 400 });
  }

  // Mark OTP as consumed
  await db.execute(sql`update one_time_codes set consumed=true where id=${matchedOtpId}`);
  console.log('OTP verified and consumed for trial start');

  // Check if user exists in app_users table
  console.log('🔍 Checking if user exists in app_users table...');
  const userCheck = await db.execute(
    sql`SELECT id, email FROM app_users WHERE phone = ${phone}`
  );
  const userRows = (userCheck as any).rows as Array<{ id: string; email: string | null }>;
  const userExists = userRows.length > 0;
  const userId = userExists ? userRows[0].id : null;
  
  console.log(userExists ? '✅ User exists in app_users table' : '❌ User does not exist in app_users table');

  // Provision credentials ONLY via N8N webhook - no fallback allowed
  let username, password, expiresAt;
  
  // userEmail already generated above for cooldown check
  
  // Generate unique session ID and timestamp
  const sessionId = `trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Create webhook payload with ALL dynamic data - NO FALLBACKS
  const webhookPayload = {
    email: userEmail,
    phone: phone,
    device: device_type,
    fingerprint: fingerprint_hash,
    sessionId: sessionId,
    timestamp: timestamp,
    ip: ip,
    fingerprintDetails: {
      canvas: fingerprint_details.canvas,
      hardware: {
        screen: {
          width: fingerprint_details.hardware.screen.width,
          height: fingerprint_details.hardware.screen.height,
          pixelRatio: fingerprint_details.hardware.screen.pixelRatio
        },
        cores: fingerprint_details.hardware.cores,
        touchPoints: fingerprint_details.hardware.touchPoints
      },
      userAgent: fingerprint_details.userAgent,
      timezone: fingerprint_details.timezone,
      platform: fingerprint_details.platform,
      language: fingerprint_details.language
    }
  };

  console.log('🌐 Sending to N8N webhook (REQUIRED):', webhookPayload);

  try {
    console.log('🔄 Attempting N8N webhook call...');
    const webhookResponse = await fetch('https://n8n-d5ll.onrender.com/webhook/request-trial', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    console.log('📊 N8N Response Status:', webhookResponse.status);
    console.log('📊 N8N Response Headers:', Object.fromEntries(webhookResponse.headers.entries()));

    if (!webhookResponse.ok) {
      console.error('❌ N8N webhook failed with status:', webhookResponse.status);
      const errorText = await webhookResponse.text();
      console.error('❌ N8N error response:', errorText.substring(0, 500));
      
      let errorMessage = 'Trial service is temporarily unavailable. Please try again later.';
      
      // Provide more specific error messages
      if (webhookResponse.status === 404) {
        errorMessage = 'Trial provisioning service not found. Please contact support.';
        console.error('🚨 N8N webhook endpoint not found - check URL configuration');
      } else if (webhookResponse.status === 500) {
        errorMessage = 'Trial provisioning service error. Please try again in a few minutes.';
      } else if (webhookResponse.status === 429) {
        errorMessage = 'Too many trial requests. Please wait a moment and try again.';
      }
      
      // Return error - no trial without N8N
      return NextResponse.json({ 
        ok: false, 
        error: 'provisioning_unavailable',
        message: errorMessage,
        debug: {
          status: webhookResponse.status,
          response: errorText.substring(0, 100)
        }
      }, { status: 503 });
    }

    const webhookData = await webhookResponse.json();
    console.log('📥 N8N webhook response:', webhookData);
    
    // N8N returns an array with credentials: [{ Email, Message, username, password, expiresAt }]
    if (!Array.isArray(webhookData) || webhookData.length === 0) {
      console.error('❌ N8N returned invalid response format:', webhookData);
      return NextResponse.json({ 
        ok: false, 
        error: 'provisioning_failed',
        message: 'Trial provisioning failed. Please try again later.'
      }, { status: 503 });
    }

    const credData = webhookData[0];
    if (!credData.username || !credData.password || !credData.expiresAt) {
      console.error('❌ N8N returned incomplete credentials:', credData);
      return NextResponse.json({ 
        ok: false, 
        error: 'provisioning_incomplete',
        message: 'Trial provisioning incomplete. Please try again later.'
      }, { status: 503 });
    }

    username = credData.username;
    password = credData.password;
    expiresAt = credData.expiresAt;
    console.log('✅ Real IPTV credentials received from N8N:', { username, password, expiresAt });
    console.log('📧 Will send to email:', userEmail);
    console.log('📱 Will send to phone/chat_id:', phone.replace('+', ''));

  } catch (webhookError: any) {
    console.error('❌ N8N webhook error:', webhookError.message);
    console.error('❌ Full error:', webhookError);
    
    let errorMessage = 'Trial service is temporarily unavailable. Please try again later.';
    
    // Handle specific error types
    if (webhookError.name === 'AbortError' || webhookError.message.includes('timeout')) {
      errorMessage = 'Trial service is taking too long to respond. Please try again in a few minutes.';
      console.error('🕐 N8N webhook timeout - service may be sleeping or overloaded');
    } else if (webhookError.message.includes('fetch')) {
      errorMessage = 'Cannot connect to trial service. Please check your internet connection and try again.';
      console.error('🌐 N8N webhook connection error - check network/DNS');
    }
    
    // Return error - no trial without N8N
    return NextResponse.json({ 
      ok: false, 
      error: 'provisioning_error',
      message: errorMessage,
      debug: {
        error: webhookError.message,
        type: webhookError.name
      }
    }, { status: 503 });
  }

  // Send credentials via Telegram to user's registered Telegram ID
  const telegramMessage = `🎉 *Your IPTV Trial is Ready!*

📺 *Username:* \`${username}\`
🔐 *Password:* \`${password}\`
⏰ *Expires:* ${new Date(expiresAt).toLocaleString()}

*Subscription Credentials:*

*Xtream Code:*

*Site:* \`http://s.showplustv.pro:80\` or \`http://splustv.me:80\`
*Login:* \`${username}\`
*Password:* \`${password}\`

*M3U Link:*

\`http://splustv.me:80/get.php?username=${username}&password=${password}&type=m3u&output=ts\`

🚀 *How to use:*
1. Download any IPTV app (VLC, IPTV Smarters, etc.)
2. Use these credentials to login
3. Enjoy 15,000+ channels in 4K quality!

💎 *Want to extend your access?*
Visit: https://www.iptv.shopping/pricing

*Happy watching!* 📺✨`;

  if (process.env.TELEGRAM_BOT_TOKEN) {
    console.log('📱 Attempting Telegram delivery...');
    console.log('🔑 Telegram token available:', !!process.env.TELEGRAM_BOT_TOKEN);
    console.log('📋 Admin chat ID:', process.env.TELEGRAM_CHAT_ID);
    
    // Look up user's registered Telegram ID from app_users table
    let userTelegramId = null;
    try {
      const userLookup = await db.execute(sql`
        SELECT telegram_id FROM app_users WHERE phone = ${phone} AND telegram_id IS NOT NULL
      `);
      
      const userRows = (userLookup as any).rows as Array<{ telegram_id: string }>;
      if (userRows.length > 0) {
        userTelegramId = userRows[0].telegram_id;
        console.log('👤 Found user Telegram ID:', userTelegramId);
      } else {
        console.log('❌ User has not registered their Telegram ID');
      }
    } catch (lookupError: any) {
      console.error('❌ Failed to lookup user Telegram ID:', lookupError.message);
    }
    
    if (userTelegramId) {
      try {
        console.log('📤 Sending to user Telegram...');
        const userResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userTelegramId,
            text: telegramMessage,
            parse_mode: 'Markdown'
          }),
        });
        
        const userResult = await userResponse.json();
        console.log('📤 User message result:', userResult);
        
        if (!userResponse.ok) {
          throw new Error(`User send failed: ${userResult.description}`);
        } else {
          console.log('✅ Successfully sent credentials to user Telegram');
        }
      } catch (userSendError: any) {
        console.log('❌ User Telegram send failed:', userSendError.message);
      
        // Fallback: send to admin chat if available
        if (process.env.TELEGRAM_CHAT_ID) {
          console.log('📤 Falling back to admin chat...');
          const adminMessage = `📋 *New Trial Created for ${phone}*\n\n${telegramMessage}`;
          
          try {
            const adminResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: adminMessage,
                parse_mode: 'Markdown'
              }),
            });
            
            const adminResult = await adminResponse.json();
            console.log('📤 Admin message result:', adminResult);
            
            if (adminResponse.ok) {
              console.log('✅ Successfully sent to admin chat');
            } else {
              console.log('❌ Admin send failed:', adminResult.description);
            }
          } catch (adminError: any) {
            console.warn('❌ Failed to send admin Telegram message:', adminError.message);
          }
        } else {
          console.log('❌ No admin chat ID configured for fallback');
        }
      }
    } else {
      console.log('❌ User has not registered their Telegram ID - sending to admin chat only');
      
      // Send to admin chat when user hasn't registered Telegram ID
      if (process.env.TELEGRAM_CHAT_ID) {
        console.log('📤 Sending to admin chat (user not registered)...');
        const adminMessage = `📋 *New Trial Created for ${phone}*\n⚠️ *User has not registered Telegram ID*\n\n${telegramMessage}`;
        
        try {
          const adminResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: adminMessage,
              parse_mode: 'Markdown'
            }),
          });
          
          const adminResult = await adminResponse.json();
          console.log('📤 Admin message result:', adminResult);
          
          if (adminResponse.ok) {
            console.log('✅ Successfully sent to admin chat');
          } else {
            console.log('❌ Admin send failed:', adminResult.description);
          }
        } catch (adminError: any) {
          console.warn('❌ Failed to send admin Telegram message:', adminError.message);
        }
      } else {
        console.log('❌ No admin chat ID configured for fallback');
      }
    }
  } else {
    console.log('❌ No Telegram bot token configured');
  }

  // Insert trial row
  const browserInfoJson = typeof browser_info === 'string' ? { userAgent: browser_info } : (browser_info || {});
  await db.execute(sql`
    insert into trial_sessions (phone, email, ip, fingerprint_hash, device_type, browser_info, username, password, status)
    values (${phone}, ${userEmail}, ${ip}, ${fingerprint_hash ?? null}, ${device_type ?? null}, ${JSON.stringify(browserInfoJson)}, ${username}, ${password}, 'active')
  `)

  // Create or update user in app_users table
  console.log('📝 Creating/updating user in app_users table...');
  try {
    if (userExists) {
      // Update existing user with email if not already set
      const currentEmail = userRows[0].email;
      if (!currentEmail || currentEmail !== userEmail) {
        await db.execute(sql`
          UPDATE app_users 
          SET email = ${userEmail}, 
              email_notifications_enabled = true,
              unsubscribe_token = COALESCE(unsubscribe_token, gen_random_uuid()::text)
          WHERE phone = ${phone}
        `);
        console.log('✅ Updated existing user with email:', userEmail);
      } else {
        console.log('✅ User already has email set:', currentEmail);
      }
    } else {
      // Create new user record
      await db.execute(sql`
        INSERT INTO app_users (phone, email, email_notifications_enabled, email_verified, unsubscribe_token)
        VALUES (${phone}, ${userEmail}, true, false, gen_random_uuid()::text)
      `);
      console.log('✅ Created new user record with email:', userEmail);
    }
  } catch (userUpdateError: any) {
    console.error('❌ Failed to create/update user in app_users table:', userUpdateError.message);
    // Don't fail the trial creation if user update fails
  }

  // Schedule nudge and expiry
  await scheduleTrialFlow(phone)
  return NextResponse.json({ ok: true, username, password, expiresAt })
}


