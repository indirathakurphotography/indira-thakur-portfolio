import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email?: string;
  phone: string;
  mumbaiArea?: string;
  shootType?: string;
  eventType?: string;
  eventDate?: string;
  eventDetails?: string;
  subject?: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, required: true },
    mumbaiArea: { type: String, default: '' },
    shootType: { type: String, default: '' },
    eventType: { type: String, default: '' },
    eventDate: { type: String, default: '' },
    eventDetails: { type: String, default: '' },
    subject: { type: String, default: '' },
    message: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
