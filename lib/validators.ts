import { z } from 'zod';

export const NoteUploadSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120, 'Title too long'),
  subject: z.string().min(2, 'Subject is required'),
  category_id: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  university: z.string().min(2, 'University/College is required'),
  college: z.string().optional(),
  course: z.string().min(2, 'Course name is required'),
  semester: z.string().min(1, 'Semester is required'),
  year: z.string().optional(),
  language: z.string().default('English'),
  tags: z.string().transform((val) => val.split(',').map((t) => t.trim()).filter(Boolean)),
  is_free: z.boolean(),
  price: z.number().min(0, 'Price cannot be negative').default(0),
  page_count: z.number().min(1, 'Page count must be at least 1').default(1),
  terms_agreed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm ownership rights to upload notes' }),
  }),
});

export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  college: z.string().optional(),
  university: z.string().optional(),
  course: z.string().optional(),
  semester: z.string().optional(),
  bio: z.string().max(500, 'Bio maximum 500 characters').optional(),
});

export const ReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().min(5, 'Review must be at least 5 characters'),
});

export const WithdrawalSchema = z.object({
  amount: z.number().min(100, 'Minimum withdrawal amount is ₹100'),
  payment_method: z.enum(['upi', 'bank_transfer']),
  payment_details: z.string().min(5, 'Please provide valid UPI ID or bank account details'),
});

export const ReportSchema = z.object({
  reason: z.enum([
    'copyright_violation',
    'fake_notes',
    'wrong_description',
    'poor_quality',
    'spam',
    'inappropriate_content',
    'other',
  ]),
  description: z.string().min(10, 'Please provide a brief explanation for reporting'),
});
