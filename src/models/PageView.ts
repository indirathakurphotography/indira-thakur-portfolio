import mongoose, { Schema, Document } from 'mongoose';

export interface IPageView extends Document {
  path: string;
  referrer?: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  sessionId: string;
  timestamp: Date;
}

const PageViewSchema: Schema = new Schema(
  {
    path: { type: String, required: true, index: true },
    referrer: { type: String, default: '' },
    device: { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'desktop' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    sessionId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

PageViewSchema.index({ timestamp: -1 });

export default mongoose.models.PageView || mongoose.model<IPageView>('PageView', PageViewSchema);
