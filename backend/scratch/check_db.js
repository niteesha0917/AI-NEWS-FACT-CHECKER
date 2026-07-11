import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FactCheck from '../models/FactCheck.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifact');
    console.log('Connected to MongoDB');
    const count = await FactCheck.countDocuments();
    console.log('Total documents in MongoDB:', count);
    if (count > 0) {
      const sample = await FactCheck.findOne();
      console.log('Sample document:', sample);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
