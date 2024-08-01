import mongoose from 'mongoose';
import Users from './models/users.model.js';
import dotenv from 'dotenv';


let mongodb_atlas_password = process.env.NODE_APP_MG_PASSWORD;

const uri = `mongodb+srv://tommyy1708:${mongodb_atlas_password}@distribution-demo.nqisq1k.mongodb.net/?retryWrites=true&w=majority&appName=distribution-demo`;



mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB database.'))
  .catch((err) => console.error('Error connecting to MongoDB database:', err));

export default mongoose;
