import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newline characters from environment variables
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { deviceToken, tokens, title, body } = req.body;

  try {
    const message = {
      notification: { title, body },
    };

    let response;

    // Send to multiple users (Global Push)
    if (tokens && Array.isArray(tokens) && tokens.length > 0) {
      message.tokens = tokens;
      response = await admin.messaging().sendEachForMulticast(message);
    } 
    // Send to single user (Link Approval/Rejection)
    else if (deviceToken) {
      message.token = deviceToken;
      response = await admin.messaging().send(message);
    } else {
      return res.status(400).json({ error: 'No tokens provided' });
    }

    return res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: error.message });
  }
}
