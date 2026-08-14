import mongoose, { Schema, Document } from 'mongoose';

export interface IBlockedIp extends Document {
  ip: string;
  reason: string;
  blockedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlockedIpSchema = new Schema<IBlockedIp>(
  {
    ip: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: 'Unauthorized admin access source' },
    blockedBy: { type: String, default: 'system' },
  },
  { timestamps: true }
);

BlockedIpSchema.index({ createdAt: -1 });

export default (mongoose.models.BlockedIp as mongoose.Model<IBlockedIp>) ||
  mongoose.model<IBlockedIp>('BlockedIp', BlockedIpSchema);
