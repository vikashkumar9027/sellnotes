import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { name, full_name, phone, college, course, semester, profileImage } = body;

    const updateFields: Record<string, unknown> = {};

    if (name || full_name) updateFields.name = (name || full_name).trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (college !== undefined) updateFields.college = college.trim();
    if (course !== undefined) updateFields.course = course.trim();
    if (semester !== undefined) updateFields.semester = semester.trim();
    if (profileImage !== undefined) updateFields.profileImage = profileImage.trim();

    const updatedUser = await User.findByIdAndUpdate(authUser._id, updateFields, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser.toJSON(),
      message: 'Profile updated successfully',
    });
  } catch (err: unknown) {
    console.error('Error updating profile:', err);
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
