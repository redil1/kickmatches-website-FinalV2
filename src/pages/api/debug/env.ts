import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  
  console.log('=== Server-side Environment Debug ===');
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY:', vapidKey);
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY present:', !!vapidKey);
  console.log('All NEXT_PUBLIC env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')));
  
  res.status(200).json({
    vapidKeyPresent: !!vapidKey,
    vapidKeyValue: vapidKey ? `${vapidKey.substring(0, 10)}...` : 'undefined',
    allNextPublicVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')),
    timestamp: new Date().toISOString()
  });
}