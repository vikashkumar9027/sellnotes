import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Note from '@/models/Note';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required to view your uploaded notes' }, { status: 401 });
    }

    await connectToDatabase();

    // Strictly fetch notes belonging to the authenticated user's MongoDB _id
    const myNotes = await Note.find({ seller: authUser._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      notes: myNotes.map((n) => n.toJSON()),
      totalCount: myNotes.length,
    });
  } catch (err: unknown) {
    console.error('Error fetching user notes:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch your notes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
