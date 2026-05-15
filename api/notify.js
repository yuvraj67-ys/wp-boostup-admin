import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      }),
    });
  } catch (error) {
    console.error('Firebase admin init error', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { deviceToken, tokens, title, body, actionUrl, imageUrl } = req.body;

  try {
    // FIX: Send ONLY data payload. NO 'notification' object.
    // This forces Android to wake up FCMService.kt and use our custom icon & image!
    const message = {
      data: {
        title: title || 'WP BOOSTUP',
        body: body || '',
        url: actionUrl || '',
        image: imageUrl || ''
      }
    };

    let response;
    if (tokens && Array.isArray(tokens) && tokens.length > 0) {
      message.tokens = tokens;
      response = await admin.messaging().sendEachForMulticast(message);
    } else if (deviceToken) {
      message.token = deviceToken;
      response = await admin.messaging().send(message);
    } else {
      return res.status(400).json({ error: 'No tokens provided' });
    }

    return res.status(200).json({ success: true, response });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
