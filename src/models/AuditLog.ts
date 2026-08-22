import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  adminEmail: string;
  adminName?: string;
  ip: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  targetResource?: string;
  details?: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    adminEmail: { type: String, required: true, index: true },
    adminName: { type: String, default: 'Administrator' },
    ip: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: '' },
    device: { type: String, default: 'Desktop' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    targetResource: { type: String, default: '' },
    details: { type: String, default: '' },
    status: { type: String, enum: ['success', 'failed', 'warning'], default: 'success' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ adminEmail: 1, timestamp: -1 });

export default (mongoose.models.AuditLog as mongoose.Model<IAuditLog>) ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
