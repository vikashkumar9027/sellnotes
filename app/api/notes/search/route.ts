import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Note from '@/models/Note';
import User from '@/models/User';
import { ensureSeededNotes } from '@/lib/seed-notes';
import { store } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '12', 10)));
    const subject = (searchParams.get('subject') || '').trim();
    const university = (searchParams.get('university') || '').trim();
    const course = (searchParams.get('course') || '').trim();
    const semester = (searchParams.get('semester') || '').trim();
    const priceFilter = (searchParams.get('price') || 'all').toLowerCase();
    const sort = (searchParams.get('sort') || 'relevance').toLowerCase();

    let mongoAvailable = false;
    try {
      await connectToDatabase();
      await ensureSeededNotes();
      mongoAvailable = true;
    } catch (dbErr: any) {
      console.warn('MongoDB search notice (using fallback store):', dbErr.message);
    }

    if (mongoAvailable) {
      // Base filter: only approved notes
      const filter: Record<string, any> = {
        status: 'approved',
      };

      // Text / Query Search across multiple fields
      if (q) {
        const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const queryRegex = new RegExp(escapedQuery, 'i');

        // 1. Find any sellers matching the query
        const matchingUsers = await User.find({
          name: { $regex: queryRegex },
        })
          .select('_id')
          .lean();
        const matchingSellerIds = matchingUsers.map((u) => u._id);

        // 2. Build multi-field conditions
        const primaryOrConditions: any[] = [
          { title: { $regex: queryRegex } },
          { subject: { $regex: queryRegex } },
          { description: { $regex: queryRegex } },
          { university: { $regex: queryRegex } },
          { college: { $regex: queryRegex } },
          { course: { $regex: queryRegex } },
          { semester: { $regex: queryRegex } },
          { tags: { $regex: queryRegex } },
        ];

        if (matchingSellerIds.length > 0) {
          primaryOrConditions.push({ seller: { $in: matchingSellerIds } });
        }

        // 3. Multi-token handling (e.g. "python aktu" or "dbms btech 3rd")
        const tokens = q.split(/\s+/).filter((t) => t.length > 1);
        if (tokens.length > 1) {
          const tokenAndConditions = tokens.map((token) => {
            const tokenRegex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            return {
              $or: [
                { title: { $regex: tokenRegex } },
                { subject: { $regex: tokenRegex } },
                { description: { $regex: tokenRegex } },
                { university: { $regex: tokenRegex } },
                { college: { $regex: tokenRegex } },
                { course: { $regex: tokenRegex } },
                { semester: { $regex: tokenRegex } },
                { tags: { $regex: tokenRegex } },
              ],
            };
          });

          filter.$or = [
            { $or: primaryOrConditions },
            { $and: tokenAndConditions },
          ];
        } else {
          filter.$or = primaryOrConditions;
        }
      }

      // Additional facet filters
      if (subject) {
        filter.subject = { $regex: new RegExp(subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
      }
      if (university) {
        filter.university = { $regex: new RegExp(university.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
      }
      if (course) {
        filter.course = { $regex: new RegExp(course.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
      }
      if (semester) {
        filter.semester = { $regex: new RegExp(semester.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
      }

      // Price Filter
      if (priceFilter === 'free') {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [{ is_free: true }, { price: 0 }],
        });
      } else if (priceFilter === 'paid') {
        filter.is_free = false;
        filter.price = { $gt: 0 };
      }

      // Sorting
      let sortOptions: Record<string, any> = { createdAt: -1 };
      if (sort === 'newest') {
        sortOptions = { createdAt: -1 };
      } else if (sort === 'price_low') {
        sortOptions = { price: 1, createdAt: -1 };
      } else if (sort === 'price_high') {
        sortOptions = { price: -1, createdAt: -1 };
      } else if (sort === 'popular') {
        sortOptions = { downloads: -1, views: -1 };
      } else {
        sortOptions = q ? { downloads: -1, views: -1, average_rating: -1 } : { createdAt: -1 };
      }

      const total = await Note.countDocuments(filter);
      const skip = (page - 1) * limit;

      let notes = await Note.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('seller', 'name college profileImage course')
        .lean();

      // If relevance sorting and query provided, boost notes where title begins with query
      if (q && sort === 'relevance' && notes.length > 1) {
        const lowerQ = q.toLowerCase();
        notes = [...notes].sort((a: any, b: any) => {
          const aTitle = (a.title || '').toLowerCase();
          const bTitle = (b.title || '').toLowerCase();
          const aStarts = aTitle.startsWith(lowerQ) ? 2 : aTitle.includes(lowerQ) ? 1 : 0;
          const bStarts = bTitle.startsWith(lowerQ) ? 2 : bTitle.includes(lowerQ) ? 1 : 0;
          if (bStarts !== aStarts) {
            return bStarts - aStarts;
          }
          return (b.downloads || 0) - (a.downloads || 0);
        });
      }

      const formattedNotes = notes.map((note: any) => {
        const seller = note.seller as Record<string, any> | null;
        return {
          ...note,
          id: note._id.toString(),
          seller_id: seller?._id ? seller._id.toString() : (typeof note.seller === 'string' ? note.seller : ''),
          seller: seller
            ? {
                id: seller._id ? seller._id.toString() : '',
                full_name: seller.name || 'Verified Student',
                college: seller.college || '',
                avatar_url: seller.profileImage || '',
                role: 'seller',
              }
            : undefined,
        };
      });

      const [distinctSubjects, distinctUniversities, distinctCourses] = await Promise.all([
        Note.distinct('subject', { status: 'approved' }),
        Note.distinct('university', { status: 'approved' }),
        Note.distinct('course', { status: 'approved' }),
      ]);

      return NextResponse.json({
        success: true,
        notes: formattedNotes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        availableFilters: {
          subjects: distinctSubjects.filter(Boolean),
          universities: distinctUniversities.filter(Boolean),
          courses: distinctCourses.filter(Boolean),
        },
      });
    }

    // ==========================================
    // FALLBACK: In-Memory Store / Static Notes
    // ==========================================
    let filtered = store.getApprovedNotes();

    if (q) {
      const lowerQ = q.toLowerCase();
      filtered = filtered.filter((n) => {
        const inTitle = n.title?.toLowerCase().includes(lowerQ);
        const inSubject = n.subject?.toLowerCase().includes(lowerQ);
        const inDesc = n.description?.toLowerCase().includes(lowerQ);
        const inUni = n.university?.toLowerCase().includes(lowerQ);
        const inCourse = n.course?.toLowerCase().includes(lowerQ);
        const inSemester = n.semester?.toLowerCase().includes(lowerQ);
        const inTags = n.tags?.some((t) => t.toLowerCase().includes(lowerQ));
        const inSeller = n.seller?.full_name?.toLowerCase().includes(lowerQ);
        return inTitle || inSubject || inDesc || inUni || inCourse || inSemester || inTags || inSeller;
      });
    }

    if (subject) {
      filtered = filtered.filter((n) => n.subject?.toLowerCase().includes(subject.toLowerCase()));
    }
    if (university) {
      filtered = filtered.filter((n) => n.university?.toLowerCase().includes(university.toLowerCase()));
    }
    if (course) {
      filtered = filtered.filter((n) => n.course?.toLowerCase().includes(course.toLowerCase()));
    }
    if (semester) {
      filtered = filtered.filter((n) => n.semester?.toLowerCase().includes(semester.toLowerCase()));
    }

    if (priceFilter === 'free') {
      filtered = filtered.filter((n) => n.is_free || n.price === 0);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter((n) => !n.is_free && n.price > 0);
    }

    // Sort
    if (sort === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    } else if (sort === 'price_low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === 'popular') {
      filtered.sort((a, b) => b.downloads - a.downloads);
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const allApproved = store.getApprovedNotes();
    const subjects = Array.from(new Set(allApproved.map((n) => n.subject).filter(Boolean)));
    const universities = Array.from(new Set(allApproved.map((n) => n.university).filter(Boolean)));
    const courses = Array.from(new Set(allApproved.map((n) => n.course).filter(Boolean)));

    return NextResponse.json({
      success: true,
      notes: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      availableFilters: {
        subjects,
        universities,
        courses,
      },
    });
  } catch (error: any) {
    console.error('Notes search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search notes',
        notes: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      },
      { status: 500 }
    );
  }
}
