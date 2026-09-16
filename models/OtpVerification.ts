import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOtpVerification extends Document {
  email: string;
  otp: string;
  registrationData?: {
    name: string;
    password?: string;
    phone?: string;
    college?: string;
    course?: string;
    semester?: string;
    role?: string;
  };
  expiresAt: Date;
  createdAt: Date;
}

const OtpVerificationSchema = new Schema<IOtpVerification>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    registrationData: {
      type: Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: auto-deletes when expiresAt passes
    },
  },
  { timestamps: true }
);

const OtpVerification: Model<IOtpVerification> =
  mongoose.models.OtpVerification ||
  mongoose.model<IOtpVerification>('OtpVerification', OtpVerificationSchema);

export default OtpVerification;
