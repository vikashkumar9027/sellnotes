import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
  _id: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  subject: string;
  university: string;
  college?: string;
  course: string;
  semester: string;
  year?: string;
  language: string;
  tags: string[];
  price: number;
  is_free: boolean;
  pdf_path: string;
  gridfs_id?: string;
  storage_key?: string;
  original_filename?: string;
  mime_type?: string;
  thumbnail_url?: string;
  preview_path?: string;
  file_size?: number;
  page_count: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  downloads: number;
  views: number;
  average_rating: number;
  rating_count: number;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    university: {
      type: String,
      required: [true, 'University/Board is required'],
      trim: true,
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
    semester: {
      type: String,
      default: '1st Semester',
    },
    year: {
      type: String,
      default: '2026',
    },
    language: {
      type: String,
      default: 'English',
    },
    tags: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_free: {
      type: Boolean,
      default: false,
    },
    pdf_path: {
      type: String,
      required: [true, 'PDF file path or URL is required'],
    },
    gridfs_id: {
      type: String,
      default: '',
    },
    storage_key: {
      type: String,
      default: '',
    },
    original_filename: {
      type: String,
      default: 'document.pdf',
    },
    mime_type: {
      type: String,
      default: 'application/pdf',
    },
    thumbnail_url: {
      type: String,
      default: '',
    },
    preview_path: {
      type: String,
      default: '',
    },
    file_size: {
      type: Number,
      default: 0,
    },
    page_count: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved', // Auto-approved for instant visibility
    },
    rejection_reason: {
      type: String,
      default: '',
    },
    downloads: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 1,
    },
    average_rating: {
      type: Number,
      default: 5.0,
    },
    rating_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : '';
        ret.seller_id = ret.seller ? ret.seller.toString() : '';
        return ret;
      },
    },
  }
);

// Indexes for real-time multi-field search and high-performance filtering
NoteSchema.index({
  title: 'text',
  subject: 'text',
  description: 'text',
  university: 'text',
  course: 'text',
  tags: 'text',
});

NoteSchema.index({ status: 1, createdAt: -1 });
NoteSchema.index({ status: 1, price: 1 });
NoteSchema.index({ status: 1, downloads: -1 });
NoteSchema.index({ subject: 1, status: 1 });
NoteSchema.index({ university: 1, status: 1 });
NoteSchema.index({ course: 1, status: 1 });
NoteSchema.index({ seller: 1, status: 1 });

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);

export default Note;
