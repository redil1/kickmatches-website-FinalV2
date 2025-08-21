/**
 * Professional Email Templates for IPTV SMARTERS PRO
 * High-conversion templates with psychology triggers and modern design
 */

export const emailTemplates = {
  match_alert_60min: {
    id: 'match_alert_60min',
    name: 'Match Alert - 60 Minutes',
    subject: '🔥 {{homeTeam}} vs {{awayTeam}} Starting in 1 Hour - Get Ready!',
    urgencyLevel: 'medium',
    psychologyTriggers: ['urgency', 'social_proof', 'exclusivity'],
    htmlTemplate: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Match Alert - IPTV SMARTERS PRO</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #f4f4f4; 
            line-height: 1.6;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 30px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            color: #ffffff; 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .tagline { 
            color: #e8e8e8; 
            font-size: 14px; 
            font-weight: 300;
        }
        .content { 
            padding: 40px 30px; 
        }
        .match-info { 
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
            border-radius: 12px; 
            padding: 25px; 
            margin: 20px 0; 
            text-align: center;
            border: 1px solid #dee2e6;
        }
        .teams { 
            font-size: 24px; 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .vs { 
            color: #667eea; 
            margin: 0 15px; 
            font-size: 20px;
        }
        .countdown { 
            background: linear-gradient(135deg, #ff6b6b, #ee5a24); 
            color: white; 
            padding: 15px; 
            border-radius: 8px; 
            font-size: 18px; 
            font-weight: bold; 
            margin: 20px 0;
            box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
        }
        .viewer-count { 
            color: #666; 
            font-size: 14px; 
            margin-top: 10px;
            font-style: italic;
        }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea, #764ba2); 
            color: white; 
            padding: 18px 40px; 
            text-decoration: none; 
            border-radius: 50px; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 25px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .cta-button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .features { 
            margin: 30px 0; 
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        .feature { 
            display: flex; 
            align-items: center; 
            margin: 15px 0;
            padding: 10px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .feature-icon { 
            width: 24px; 
            height: 24px; 
            margin-right: 15px; 
            font-size: 20px;
        }
        .social-proof { 
            background: linear-gradient(135deg, #e8f5e8, #d4edda); 
            border-left: 4px solid #28a745; 
            padding: 20px; 
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .urgency-banner {
            background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
            padding: 15px;
            text-align: center;
            font-weight: bold;
            color: #2d3436;
            border-radius: 8px;
            margin: 20px 0;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        .footer { 
            background: #333; 
            color: #ccc; 
            padding: 30px; 
            text-align: center; 
            font-size: 12px;
        }
        .footer a { 
            color: #667eea; 
            text-decoration: none;
        }
        .footer a:hover { 
            text-decoration: underline;
        }
        .unsubscribe { 
            color: #999; 
            text-decoration: none;
            font-size: 11px;
        }
        @media only screen and (max-width: 600px) {
            .container { margin: 0 10px; }
            .content { padding: 20px 15px; }
            .teams { font-size: 20px; }
            .cta-button { padding: 15px 30px; font-size: 14px; }
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
            <div class="urgency-banner">
                ⏰ {{urgencyText}} - Don't Miss This {{matchImportance}} Match!
            </div>
            
            <h1 style="color: #333; margin-bottom: 20px; text-align: center;">🔥 Match Starting Soon!</h1>
            
            <div class="match-info">
                <div class="teams">{{homeTeam}} <span class="vs">VS</span> {{awayTeam}}</div>
                <div style="color: #666; margin: 10px 0;">{{leagueName}} • {{matchDateTime}}</div>
                <div class="countdown">⏰ Starting in 60 Minutes</div>
                <div class="viewer-count">👥 {{socialProofText}}</div>
            </div>
            
            <div class="social-proof">
                <strong>🎯 Don't Miss Out!</strong> {{socialProofText}} are already preparing to watch this {{matchImportance}} match. Join thousands of sports fans for the ultimate viewing experience.
            </div>
            
            <div style="text-align: center;">
                <a href="{{matchLink}}?{{utmParams}}" class="cta-button">
                    🚀 {{ctaText}} - Premium Quality
                </a>
            </div>
            
            <div class="features">
                <h3 style="margin-bottom: 15px; color: #333;">Why Choose IPTV SMARTERS PRO?</h3>
                <div class="feature">
                    <span class="feature-icon">📺</span>
                    <span><strong>4K Ultra HD Streaming</strong> - Crystal clear picture quality</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">⚡</span>
                    <span><strong>Zero Buffering Technology</strong> - Smooth, uninterrupted viewing</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">🌍</span>
                    <span><strong>Global Sports Coverage</strong> - All major leagues and tournaments</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">📱</span>
                    <span><strong>Multi-Device Support</strong> - Watch on any device, anywhere</span>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; color: #666;">Need help? Our 24/7 support team is here for you.</p>
                <p style="margin: 5px 0 0 0;"><a href="mailto:support@iptv-smarters-pro.com" style="color: #667eea;">support@iptv-smarters-pro.com</a></p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>IPTV SMARTERS PRO</strong> - Your Premium Sports Streaming Partner</p>
            <p style="margin: 10px 0;">Experience sports like never before with our cutting-edge streaming technology.</p>
            <p style="margin: 15px 0 5px 0;">This email was sent because you subscribed to match notifications.</p>
            <p><a href="{{unsubscribeLink}}" class="unsubscribe">Unsubscribe from email notifications</a></p>
            <p style="margin-top: 15px; font-size: 10px; color: #888;">© {{currentYear}} IPTV SMARTERS PRO. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    textTemplate: `IPTV SMARTERS PRO - Match Alert

🔥 {{homeTeam}} vs {{awayTeam}} Starting in 1 Hour!

{{leagueName}} • {{matchDateTime}}
⏰ Starting in 60 Minutes
👥 {{socialProofText}}

🎯 Don't Miss Out! {{socialProofText}} are already preparing to watch this {{matchImportance}} match.

Watch Live: {{matchLink}}?{{utmParams}}

Why Choose IPTV SMARTERS PRO?
📺 4K Ultra HD Streaming
⚡ Zero Buffering Technology  
🌍 Global Sports Coverage
📱 Multi-Device Support

Need help? Contact: support@iptv-smarters-pro.com

Unsubscribe: {{unsubscribeLink}}

© {{currentYear}} IPTV SMARTERS PRO. All rights reserved.`
  },

  match_alert_30min: {
    id: 'match_alert_30min',
    name: 'Match Alert - 30 Minutes',
    subject: '⚡ URGENT: {{homeTeam}} vs {{awayTeam}} in 30 Minutes!',
    urgencyLevel: 'high',
    psychologyTriggers: ['urgency', 'scarcity', 'fomo'],
    htmlTemplate: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URGENT: Match Starting Soon - IPTV SMARTERS PRO</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #f4f4f4; 
            line-height: 1.6;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .urgent-header {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            padding: 20px;
            text-align: center;
            color: white;
            animation: urgentPulse 1.5s infinite;
        }
        @keyframes urgentPulse {
            0%, 100% { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); }
            50% { background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%); }
        }
        .logo { 
            color: #ffffff; 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .urgent-text {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .content { 
            padding: 30px; 
        }
        .countdown-big {
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
            animation: countdownPulse 2s infinite;
        }
        @keyframes countdownPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .teams-urgent { 
            font-size: 26px; 
            font-weight: bold; 
            color: #333; 
            text-align: center;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .vs-urgent { 
            color: #ff6b6b; 
            margin: 0 15px; 
            font-size: 22px;
        }
        .cta-urgent { 
            display: inline-block; 
            background: linear-gradient(135deg, #ff6b6b, #ee5a24); 
            color: white; 
            padding: 20px 50px; 
            text-decoration: none; 
            border-radius: 50px; 
            font-weight: bold; 
            font-size: 18px; 
            margin: 25px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.5);
            animation: ctaGlow 2s infinite;
        }
        @keyframes ctaGlow {
            0%, 100% { box-shadow: 0 6px 20px rgba(255, 107, 107, 0.5); }
            50% { box-shadow: 0 8px 25px rgba(255, 107, 107, 0.8); }
        }
        .scarcity-box {
            background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
            border: 2px solid #e17055;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            font-weight: bold;
            color: #2d3436;
        }
        .footer { 
            background: #333; 
            color: #ccc; 
            padding: 20px; 
            text-align: center; 
            font-size: 12px;
        }
        .footer a { 
            color: #ff6b6b; 
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .container { margin: 0 10px; }
            .content { padding: 20px 15px; }
            .teams-urgent { font-size: 22px; }
            .cta-urgent { padding: 18px 40px; font-size: 16px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="urgent-header">
            <div class="logo">IPTV SMARTERS PRO</div>
            <div class="urgent-text">⚡ URGENT ALERT ⚡</div>
        </div>
        
        <div class="content">
            <div class="countdown-big">
                🚨 STARTING IN 30 MINUTES 🚨
            </div>
            
            <div class="teams-urgent">{{homeTeam}} <span class="vs-urgent">VS</span> {{awayTeam}}</div>
            
            <div class="scarcity-box">
                ⏰ FINAL WARNING: Only 30 minutes left!<br>
                👥 {{socialProofText}} are already watching!
            </div>
            
            <div style="text-align: center;">
                <a href="{{matchLink}}?{{utmParams}}" class="cta-urgent">
                    🚀 WATCH NOW - DON'T MISS OUT!
                </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ Limited Time Access</p>
                <p style="margin: 5px 0 0 0; color: #856404;">Secure your premium viewing experience before kickoff!</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>IPTV SMARTERS PRO</strong> - Don't Miss The Action!</p>
            <p><a href="{{unsubscribeLink}}">Unsubscribe</a> | © {{currentYear}} All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    textTemplate: `⚡ URGENT ALERT - IPTV SMARTERS PRO ⚡

🚨 {{homeTeam}} vs {{awayTeam}} STARTING IN 30 MINUTES! 🚨

⏰ FINAL WARNING: Only 30 minutes left!
👥 {{socialProofText}} are already watching!

WATCH NOW: {{matchLink}}?{{utmParams}}

⚠️ Limited Time Access - Secure your premium viewing experience before kickoff!

Unsubscribe: {{unsubscribeLink}}
© {{currentYear}} IPTV SMARTERS PRO`
  },

  match_alert_5min: {
    id: 'match_alert_5min',
    name: 'Match Alert - 5 Minutes',
    subject: '🚨 FINAL CALL: {{homeTeam}} vs {{awayTeam}} Starting NOW!',
    urgencyLevel: 'critical',
    psychologyTriggers: ['urgency', 'scarcity', 'fomo', 'social_proof'],
    htmlTemplate: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚨 FINAL CALL - STARTING NOW!</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            line-height: 1.6;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .critical-header {
            background: linear-gradient(135deg, #d63031 0%, #74b9ff 100%);
            padding: 25px;
            text-align: center;
            color: white;
            animation: criticalFlash 1s infinite;
        }
        @keyframes criticalFlash {
            0%, 100% { background: linear-gradient(135deg, #d63031 0%, #74b9ff 100%); }
            25% { background: linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%); }
            50% { background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); }
            75% { background: linear-gradient(135deg, #e84393 0%, #a29bfe 100%); }
        }
        .logo { 
            color: #ffffff; 
            font-size: 32px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            text-shadow: 0 3px 6px rgba(0,0,0,0.5);
        }
        .final-call {
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 3px;
            animation: textGlow 1s infinite;
        }
        @keyframes textGlow {
            0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0.8); }
            50% { text-shadow: 0 0 20px rgba(255,255,255,1), 0 0 30px rgba(255,255,255,1); }
        }
        .content { 
            padding: 30px; 
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        }
        .now-live {
            background: linear-gradient(135deg, #d63031, #74b9ff);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            margin: 20px 0;
            box-shadow: 0 8px 32px rgba(214, 48, 49, 0.5);
            animation: livePulse 1.5s infinite;
        }
        @keyframes livePulse {
            0%, 100% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.05) rotate(1deg); }
            50% { transform: scale(1.1) rotate(0deg); }
            75% { transform: scale(1.05) rotate(-1deg); }
        }
        .teams-critical { 
            font-size: 30px; 
            font-weight: bold; 
            color: #d63031; 
            text-align: center;
            margin: 25px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .vs-critical { 
            color: #74b9ff; 
            margin: 0 20px; 
            font-size: 26px;
            animation: vsRotate 2s infinite;
        }
        @keyframes vsRotate {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(360deg); }
        }
        .cta-critical { 
            display: inline-block; 
            background: linear-gradient(135deg, #d63031, #74b9ff); 
            color: white; 
            padding: 25px 60px; 
            text-decoration: none; 
            border-radius: 50px; 
            font-weight: bold; 
            font-size: 20px; 
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            box-shadow: 0 8px 32px rgba(214, 48, 49, 0.6);
            animation: ctaCritical 1s infinite;
        }
        @keyframes ctaCritical {
            0%, 100% { 
                transform: scale(1); 
                box-shadow: 0 8px 32px rgba(214, 48, 49, 0.6); 
            }
            50% { 
                transform: scale(1.1); 
                box-shadow: 0 12px 40px rgba(214, 48, 49, 0.8); 
            }
        }
        .live-stats {
            background: linear-gradient(135deg, #00b894, #00cec9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
            font-weight: bold;
            animation: statsGlow 2s infinite;
        }
        @keyframes statsGlow {
            0%, 100% { box-shadow: 0 4px 20px rgba(0, 184, 148, 0.4); }
            50% { box-shadow: 0 8px 30px rgba(0, 184, 148, 0.8); }
        }
        .footer { 
            background: #2d3436; 
            color: #ddd; 
            padding: 20px; 
            text-align: center; 
            font-size: 12px;
        }
        .footer a { 
            color: #74b9ff; 
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .container { margin: 0 5px; }
            .content { padding: 20px 15px; }
            .teams-critical { font-size: 24px; }
            .cta-critical { padding: 20px 40px; font-size: 18px; }
            .now-live { font-size: 24px; padding: 25px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="critical-header">
            <div class="logo">IPTV SMARTERS PRO</div>
            <div class="final-call">🚨 FINAL CALL 🚨</div>
        </div>
        
        <div class="content">
            <div class="now-live">
                🔴 STARTING NOW! 🔴
            </div>
            
            <div class="teams-critical">{{homeTeam}} <span class="vs-critical">VS</span> {{awayTeam}}</div>
            
            <div class="live-stats">
                📺 LIVE NOW: {{socialProofText}}<br>
                🔥 Don't be the one who missed this epic match!
            </div>
            
            <div style="text-align: center;">
                <a href="{{matchLink}}?{{utmParams}}" class="cta-critical">
                    ⚡ JOIN THE ACTION NOW! ⚡
                </a>
            </div>
            
            <div style="background: linear-gradient(135deg, #fd79a8, #fdcb6e); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; color: white; font-weight: bold;">
                🎯 LAST CHANCE: The match is starting RIGHT NOW!<br>
                📱 One click and you're in - Premium HD quality guaranteed!
            </div>
        </div>
        
        <div class="footer">
            <p><strong>IPTV SMARTERS PRO</strong> - The Action Starts NOW!</p>
            <p><a href="{{unsubscribeLink}}">Unsubscribe</a> | © {{currentYear}} All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    textTemplate: `🚨 FINAL CALL - IPTV SMARTERS PRO 🚨

🔴 {{homeTeam}} vs {{awayTeam}} STARTING NOW! 🔴

📺 LIVE NOW: {{socialProofText}}
🔥 Don't be the one who missed this epic match!

JOIN NOW: {{matchLink}}?{{utmParams}}

🎯 LAST CHANCE: The match is starting RIGHT NOW!
📱 One click and you're in - Premium HD quality guaranteed!

Unsubscribe: {{unsubscribeLink}}
© {{currentYear}} IPTV SMARTERS PRO`
  },

  match_halftime: {
    id: 'match_halftime',
    name: 'Halftime Alert',
    subject: '⚽ Halftime: {{homeTeam}} vs {{awayTeam}} - Second Half Coming Up!',
    urgencyLevel: 'medium',
    psychologyTriggers: ['urgency', 'social_proof', 'excitement'],
    htmlTemplate: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Halftime Break - IPTV SMARTERS PRO</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #f4f4f4; 
            line-height: 1.6;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); 
            padding: 30px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            color: #ffffff; 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .halftime-text {
            font-size: 16px;
            font-weight: bold;
        }
        .content { 
            padding: 30px; 
        }
        .halftime-banner {
            background: linear-gradient(135deg, #fdcb6e, #e17055);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
        }
        .teams { 
            font-size: 24px; 
            font-weight: bold; 
            color: #333; 
            text-align: center;
            margin: 20px 0;
        }
        .vs { 
            color: #00b894; 
            margin: 0 15px;
        }
        .second-half-cta { 
            display: inline-block; 
            background: linear-gradient(135deg, #00b894, #00cec9); 
            color: white; 
            padding: 18px 40px; 
            text-decoration: none; 
            border-radius: 50px; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 25px 0;
            text-transform: uppercase;
        }
        .footer { 
            background: #333; 
            color: #ccc; 
            padding: 20px; 
            text-align: center; 
            font-size: 12px;
        }
        .footer a { 
            color: #00b894; 
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">IPTV SMARTERS PRO</div>
            <div class="halftime-text">⚽ HALFTIME BREAK ⚽</div>
        </div>
        
        <div class="content">
            <div class="halftime-banner">
                🥤 Halftime Break - Grab Your Snacks!
            </div>
            
            <div class="teams">{{homeTeam}} <span class="vs">VS</span> {{awayTeam}}</div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #2d5a2d; font-weight: bold;">🔥 Second Half Coming Up!</p>
                <p style="margin: 10px 0 0 0; color: #2d5a2d;">{{socialProofText}} are staying tuned for the exciting conclusion!</p>
            </div>
            
            <div style="text-align: center;">
                <a href="{{matchLink}}?{{utmParams}}" class="second-half-cta">
                    ⚽ Continue Watching Second Half
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>IPTV SMARTERS PRO</strong> - Don't Miss The Second Half!</p>
            <p><a href="{{unsubscribeLink}}">Unsubscribe</a> | © {{currentYear}} All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    textTemplate: `⚽ HALFTIME BREAK - IPTV SMARTERS PRO ⚽

🥤 {{homeTeam}} vs {{awayTeam}} - Halftime Break

🔥 Second Half Coming Up!
{{socialProofText}} are staying tuned for the exciting conclusion!

Continue Watching: {{matchLink}}?{{utmParams}}

Unsubscribe: {{unsubscribeLink}}
© {{currentYear}} IPTV SMARTERS PRO`
  }
};

export type EmailTemplateId = keyof typeof emailTemplates;

export default emailTemplates;