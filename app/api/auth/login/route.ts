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
    const { action, email, password, otp } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // OPTION 1: EMAIL OTP LOGIN REQUEST (Send OTP)
    if (action === 'send-otp') {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this email. Please register first.' },
          { status: 404 }
        );
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await OtpVerification.findOneAndUpdate(
        { email: cleanEmail },
        { email: cleanEmail, otp: generatedOtp, expiresAt },
        { upsert: true, new: true }
      );

      const emailResult = await sendRealEmailOtp(cleanEmail, generatedOtp);

      return NextResponse.json({
        success: true,
        message:
          emailResult.mode === 'live'
            ? `A 6-digit login code has been sent to ${cleanEmail}.`
            : `Login code generated for ${cleanEmail} (Dev OTP: ${generatedOtp}). Valid for 5 minutes.`,
      });
    }

    // OPTION 2: EMAIL OTP LOGIN VERIFY
    if (action === 'verify-otp') {
      if (!otp) {
        return NextResponse.json({ error: 'Please enter the 6-digit OTP code.' }, { status: 400 });
      }

      const record = await OtpVerification.findOne({ email: cleanEmail });
      if (!record || record.otp !== otp.trim()) {
        return NextResponse.json({ error: 'Invalid or incorrect OTP code.' }, { status: 400 });
      }

      if (new Date() > record.expiresAt) {
        await OtpVerification.deleteOne({ _id: record._id });
        return NextResponse.json({ error: 'OTP code has expired. Please request a new one.' }, { status: 400 });
      }

      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
      }

      await OtpVerification.deleteOne({ _id: record._id });

      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const response = NextResponse.json({
        success: true,
        user: user.toJSON(),
        message: `Welcome back, ${user.name}!`,
      });

      setAuthCookie(response, token);
      return response;
    }

    // OPTION 3: STANDARD EMAIL & PASSWORD LOGIN
    if (!password) {
      return NextResponse.json({ error: 'Password is required to log in.' }, { status: 400 });
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials.' },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials.' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: user.toJSON(),
      message: `Welcome back, ${user.name}!`,
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: unknown) {
    console.error('Login error:', err);
    const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
