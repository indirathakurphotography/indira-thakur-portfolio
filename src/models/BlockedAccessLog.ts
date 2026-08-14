import mongoose, { Schema, Document } from 'mongoose';

export interface IBlockedAccessLog extends Document {
  ip: string;
  path: string;
  method: string;
  reason: string;
  userAgent: string;
  createdAt: Date;
}

const BlockedAccessLogSchema = new Schema<IBlockedAccessLog>(
  {
    ip: { type: String, required: true, index: true },
    path: { type: String, default: '' },
    method: { type: String, default: '' },
    reason: { type: String, default: 'denylist' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

BlockedAccessLogSchema.index({ createdAt: -1 });

export default (mongoose.models.BlockedAccessLog as mongoose.Model<IBlockedAccessLog>) ||
  mongoose.model<IBlockedAccessLog>('BlockedAccessLog', BlockedAccessLogSchema);
