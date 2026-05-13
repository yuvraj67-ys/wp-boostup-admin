import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // \n ko theek se read karne ke liye replace lagaya hai
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { deviceToken, title, body } = req.body;
    if (!deviceToken) return res.status(400).json({ error: 'No device token' });

    const message = {
      notification: { title, body },
      token: deviceToken,
    };

    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, response });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
