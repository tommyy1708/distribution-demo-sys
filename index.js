// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import dotenv from 'dotenv';
import express from 'express';



import mongoose from 'mongoose';
import Users from './models/users.model.js';
const app = express();

dotenv.config();

app.use(express.json());

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

const PORT = process.env.NODE_APP_PORT || 3000;

// app.get('/', (req, res) => res.send('Express on Vercel'));

let mongodb_atlas_password = process.env.NODE_APP_MG_PASSWORD;

const uri = `mongodb+srv://tommyy1708:${mongodb_atlas_password}@distribution-demo.nqisq1k.mongodb.net/?retryWrites=true&w=majority&appName=distribution-demo`;

// Create an new connection with MongoDB
async function connect() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    app.listen(PORT, () =>
      console.log(`Server ready on port ${PORT}.`)
    );
  } catch (error) {4
    console.log('Error connecting to MongoDB', error);
  }
}

connect();

app.post('/api/user', async (req, res) => {
  try {
    console.log(req.body);
    const User = mongoose.model('Users');
    const newUser = await Users.create(req.body);
    console.log('User saved:', newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default app;
