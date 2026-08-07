import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  message: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    service: { type: String, required: true },
    date: { type: String, required: true },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
