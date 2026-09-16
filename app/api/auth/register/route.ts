import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import OtpVerification from '@/models/OtpVerification';
import { signToken, setAuthCookie } from '@/lib/auth';
import { sendRealEmailOtp } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { action } = body;

    // STEP 1: SEND REAL EMAIL OTP FOR REGISTRATION
    if (action === 'send-otp') {
      const { name, email, password, confirmPassword, phone, college, course, semester, role } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
      }
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
      }
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }
      if (confirmPassword && password !== confirmPassword) {
        return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
      }
      if (!course || !course.trim()) {
        return NextResponse.json({ error: 'Course/Degree is required.' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check if user already exists
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please log in.' },
          { status: 409 }
        );
      }

      // Generate 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

      // Save/update pending registration OTP in MongoDB
      await OtpVerification.findOneAndUpdate(
        { email: cleanEmail },
        {
          email: cleanEmail,
          otp,
          registrationData: {
            name: name.trim(),
            password,
            phone: phone ? phone.trim() : '',
            college: college ? college.trim() : '',
            course: course.trim(),
            semester: semester ? semester.trim() : '1st Semester',
            role: role || 'student',
          },
          expiresAt,
        },
        { upsert: true, new: true }
      );

      // Send real email OTP via Brevo SMTP / API
      const emailResult = await sendRealEmailOtp(cleanEmail, otp);

      return NextResponse.json({
        success: true,
        message:
          emailResult.mode === 'live'
            ? `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox and spam folder.`
            : `Verification code generated for ${cleanEmail} (Dev mode OTP: ${otp}). Valid for 5 minutes.`,
      });
    }

    // STEP 2: VERIFY OTP AND COMPLETE REGISTRATION
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP verification code are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // Verify OTP record in MongoDB
    const record = await OtpVerification.findOne({ email: cleanEmail });

    if (!record || record.otp !== cleanOtp) {
      return NextResponse.json({ error: 'Invalid or incorrect OTP verification code.' }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
      await OtpVerification.deleteOne({ _id: record._id });
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Retrieve validated registration data
    const regData = record.registrationData || body;

    // Check once more if email was taken in the meantime
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      return NextResponse.json({ error: 'Account already exists. Please log in.' }, { status: 409 });
    }

    // Create user in MongoDB with bcrypt hashing automatically via pre-save hook
    user = await User.create({
      name: regData.name,
      email: cleanEmail,
      password: regData.password,
      phone: regData.phone || '',
      college: regData.college || '',
      course: regData.course || '',
      semester: regData.semester || '1st Semester',
      role: regData.role || 'student',
      isEmailVerified: true,
    });

    // Delete used OTP record
    await OtpVerification.deleteOne({ _id: record._id });

    // Generate JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Build response with HTTP-only cookie and sanitized user data
    const response = NextResponse.json({
      success: true,
      user: user.toJSON(),
      message: 'Account created and email verified successfully! Welcome to NoteMart.',
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: unknown) {
    console.error('Registration error:', err);
    const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
