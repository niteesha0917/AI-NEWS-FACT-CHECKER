import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  organization: { type: String, default: 'Independent Investigator', trim: true },
  password: { type: String },
  role: { type: String, default: 'analyst', enum: ['analyst', 'editor', 'admin'] },
  avatar: { type: String },
  lastActive: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
