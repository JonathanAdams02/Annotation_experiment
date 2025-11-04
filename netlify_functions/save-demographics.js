const admin = require('firebase-admin');

// Initialize Firebase Admin (reuse credentials from save-data.js)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const demographics = JSON.parse(event.body);
    
    // Save to separate "demographics" collection in Firestore
    await admin.firestore().collection('demographics').doc(demographics.subject_id.toString()).set({
      ...demographics,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save demographics' })
    };
  }
};