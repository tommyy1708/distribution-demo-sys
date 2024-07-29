// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import dotenv from 'dotenv';
import express from 'express';

const app = express();

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.NODE_APP_APIKEY,
  authDomain: process.env.NODE_APP_AUTHDOMAIN,
  projectId: process.env.NODE_APP_PROJECTID,
  storageBucket: process.env.NODE_APP_STORAGEBUKET,
  messagingSenderId: process.env.NODE_APP_MESSAGESENDID,
  appId: process.env.NODE_APP_APPID,
  measurementId: process.env.NODE_APP_MESUREMENTID,
};

// Load service account credentials

const admin = initializeApp(firebaseConfig);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Express on Vercel'));

app.listen(PORT, () => console.log(`Server ready on port ${PORT}.`));

export default app;
