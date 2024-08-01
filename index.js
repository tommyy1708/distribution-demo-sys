// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import cors from 'cors';
import {getSupplierUsers, checkSupplierPause } from './server.js';
dotenv.config();
const app = express();

app.use(cors());
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

// hair supplier Apis
app.post('/api/supplier-login', async (req, res) => {
  const { email, password } = req.body;

  const aAccountInfo = await getSupplierUsers(email);

  if (!aAccountInfo) {
    return res.send({
      errCode: 1,
      message: 'User not exists',
    });
  }

  const isPause = await checkSupplierPause(email);

  if (!isPause) {
    return res.send({
      errCode: 1,
      message: 'User not exists',
    });
  }
  if (isPause[0].pause === 1) {
    return res.send({
      errCode: 2,
      message: 'Account is paused. Please contact support.',
    });
  }

  const sPassWord = aAccountInfo.passWord.toString();

  if (aAccountInfo && password === sPassWord) {
    let token = jwt.sign(aAccountInfo, `${process.env.SECRET}`, {
      expiresIn: '24h',
    });

    //update token to account and return newest account info
    const updateLoginInfo = await updateTokenHairSupplier(
      token,
      email
    );

    if (!updateLoginInfo) {
      res.send({
        errCode: 1,
        message: 'Database error',
      });
    } else {
      res.send({
        errCode: 0,
        message: 'Success',
        userToken: updateLoginInfo.token.toString(),
      });
    }
  } else {
    res.send({
      errCode: 1,
      message: 'Wrong Password',
    });
  }
});





const PORT = process.env.NODE_APP_PORT || 8001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
