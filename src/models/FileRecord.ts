import mongoose, { Schema, Document } from 'mongoose';

export interface IFileRecord extends Document {
  url: string;
  publicId: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  folder: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileRecordSchema = new Schema<IFileRecord>(
  {
    url: { type: String, required: true, index: true },
    publicId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    folder: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

FileRecordSchema.index({ folder: 1, createdAt: -1 });

export default mongoose.models.FileRecord || mongoose.model<IFileRecord>('FileRecord', FileRecordSchema);