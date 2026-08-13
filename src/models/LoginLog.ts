import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginLog extends Document {
  email: string;
  userId?: string;
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  location: string;
  status: 'success' | 'failed' | 'revoked';
  sessionId: string;
  loginTime: Date;
  logoutTime?: Date;
  lastActiveTime: Date;
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const LoginLogSchema = new Schema<ILoginLog>(
  {
    email: { type: String, required: true, index: true },
    userId: { type: String, default: '' },
    ip: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: '' },
    browser: { type: String, default: 'Unknown Browser' },
    os: { type: String, default: 'Unknown OS' },
    device: { type: String, default: 'Desktop' },
    location: { type: String, default: 'Approximate/Internal' },
    status: { type: String, enum: ['success', 'failed', 'revoked'], default: 'success' },
    sessionId: { type: String, required: true, index: true },
    loginTime: { type: Date, default: Date.now },
    logoutTime: { type: Date },
    lastActiveTime: { type: Date, default: Date.now },
    sessionVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

LoginLogSchema.index({ email: 1, loginTime: -1 });
LoginLogSchema.index({ sessionId: 1 });

export default (mongoose.models.LoginLog as mongoose.Model<ILoginLog>) ||
  mongoose.model<ILoginLog>('LoginLog', LoginLogSchema);
