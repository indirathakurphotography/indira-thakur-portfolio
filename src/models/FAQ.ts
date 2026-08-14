import mongoose, { Schema, Document } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  order: number;
  serviceId?: string;  // null = global FAQ, else references a service
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'General' },
    order: { type: Number, default: 0 },
    serviceId: { type: String, default: null },  // null = global FAQ
  },
  { timestamps: true }
);

const FAQ = (mongoose.models.FAQ as mongoose.Model<IFAQ>) || mongoose.model<IFAQ>('FAQ', FAQSchema);

export default FAQ;
