
const admin = require('firebase-admin');
const config = require('./config');

let firebaseApp;

const initializeFirebase = () => {
  try {
    // Skip Firebase initialization in development if config is missing
    if (!config.firebaseProjectId || 
        config.firebaseProjectId  === 'dev-project-id' ||
        !config.firebasePrivateKey ||
        config.firebasePrivateKey === 'dev-private-key') {
      console.log('Firebase skipped - using development mode (missing or placeholder config)');
      return;
    }

    const serviceAccount = {
      type: "service_account",
      project_id: config.firebaseProjectId,
      private_key: config.firebasePrivateKey?.replace(/\\n/g, '\n'),
      client_email: config.firebaseClientEmail,
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // projectId: config.firebaseProjectId ,
      storageBucket: config.storageBucket, 
    });
  

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.warn('Firebase initialization skipped:', error.message);
    console.log('Running in development mode without Firebase');
  }
};

const getFirebaseApp = () => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return firebaseApp;
};

const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid Firebase token');
  }
};

const sendPushNotification = async (tokens, notification, data = {}) => {
  try {
    if (!Array.isArray(tokens)) {
      tokens = [tokens];
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon192.png'
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      tokens: tokens.filter(token => token && token.length > 0)
    };

    if (message.tokens.length === 0) {
      console.log('No valid tokens provided for push notification');
      return;
    }

    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`Push notification sent successfully: ${response.successCount}/${tokens.length}`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
        }
      });
    }

    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

  async function uploadFileFirebaseService(filePath, folderPath) {
    try {
      console.log(config.storageBucket, "storage bucket")
      const bucket  = admin.storage().bucket(config.storageBucket);
      await bucket.upload(filePath, { destination: folderPath });

      console.log('upload file success to firebase.');

      // logger.info('upload file success to firebase.');

    } catch (error) {
      console.error(`upload file to firebase error: ${error}`);
      throw new Error(error);
    }
  }

  async function createPublicUrlService(filePath) {
    try {
      const bucket  = admin.storage().bucket(config.storageBucket);
      const file = bucket.file(filePath);
      const signedUrl = await file.getSignedUrl({
        action: 'read',
        expires: '12-31-9999',
      });

      return signedUrl[0];
    } catch (error) {
     //logger.error(`Error generating download link:: ${error}`);
      throw new Error(error);
    }
  }

  async function copyFile(sourcePath, destinationPath) {
    try {
      await this.bucket.file(sourcePath).copy(this.bucket.file(destinationPath));
      logger.info(`File copied from ${sourcePath} to ${destinationPath}`);
    } catch (error) {
      logger.error(`Error copying file from ${sourcePath} to ${destinationPath}: ${error}`);
      // throw new Error(error);
    }
  }

  async function deleteFolder(folderPath) {
    try {
      const [files] = await this.bucket.getFiles({ prefix: folderPath });
      files.forEach(async (file) => {
        await file.delete();
      });
      logger.info(`Folder ${folderPath} deleted successfully.`);
    } catch (error) {
      logger.error(`Error deleting folder ${folderPath}: ${error}`);
      throw new Error(error);
    }
  }

  async function deleteFile(filePath) {
    //logger.info('deleteFile', filePath);
    console.log('deleteFile', filePath);
    try {
    
      const bucket  = admin.storage().bucket(config.storageBucket);
      const file = bucket.file(filePath);
     
      await file.delete();
      //logger.info(`File ${filePath} deleted successfully.`);
      console.log(`File ${filePath} deleted successfully.`);
    } catch (error) {
      //logger.error(`Error deleting file ${filePath}: ${error}`);
      console.log(`Error deleting file ${filePath}: ${error}`);
      // throw new Error(error);
    }
  }

module.exports = {
  initializeFirebase,
  getFirebaseApp,
  verifyFirebaseToken,
  sendPushNotification,
  deleteFile,
  uploadFileFirebaseService,
  createPublicUrlService
  
};
