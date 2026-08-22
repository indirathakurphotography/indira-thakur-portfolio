import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPageView extends Document {
  path: string;
  referrer?: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  ip?: string;
  country?: string;
  city?: string;
  sessionId: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PageViewSchema: Schema = new Schema(
  {
    path: { type: String, required: true, index: true },
    referrer: { type: String, default: '' },
    device: { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'desktop' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    ip: { type: String, default: '127.0.0.1' },
    country: { type: String, default: '' },
    city: { type: String, default: '' },
    sessionId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

PageViewSchema.index({ timestamp: -1 });
PageViewSchema.index({ path: 1, timestamp: -1 });

export default (mongoose.models.PageView as Model<IPageView>) || mongoose.model<IPageView>('PageView', PageViewSchema);
