import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (err: unknown) {
    console.error('Error fetching current user:', err);
    return NextResponse.json({ error: 'Failed to fetch user session' }, { status: 500 });
  }
}
