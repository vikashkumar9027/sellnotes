import { Category, Note, Profile, Review, Purchase, Withdrawal, Report, Notification, SystemSettings, TransactionStatus, RefundStatus } from '@/types';
import { INITIAL_CATEGORIES, MOCK_NOTES, MOCK_USERS, MOCK_REVIEWS, MOCK_PURCHASES, MOCK_WITHDRAWALS, MOCK_REPORTS, MOCK_NOTIFICATIONS, DEFAULT_SYSTEM_SETTINGS } from './mock-data';

// Helper function for server-side financial calculations
export function calculateOrderAmounts(
  basePrice: number,
  gstRatePercent: number = 18,
  platformCommissionPercent: number = 20
) {
  const baseAmount = Math.max(0, Number(basePrice) || 0);
  const gstRate = Math.max(0, Number(gstRatePercent) || 0);
  const platformFeeRate = Math.max(0, Number(platformCommissionPercent) || 0);

  const gstAmount = parseFloat(((baseAmount * gstRate) / 100).toFixed(2));
  const buyerTotalAmount = parseFloat((baseAmount + gstAmount).toFixed(2));

  const platformFeeAmount = parseFloat(((baseAmount * platformFeeRate) / 100).toFixed(2));
  const sellerGrossAmount = baseAmount;
  const sellerNetAmount = parseFloat((baseAmount - platformFeeAmount).toFixed(2));

  return {
    baseAmount,
    gstRate,
    gstAmount,
    buyerTotalAmount,
    platformFeeRate,
    platformFeeAmount,
    sellerGrossAmount,
    sellerNetAmount,
  };
}

// Global transient state for mock/local execution fallback
let categoriesState: Category[] = [...INITIAL_CATEGORIES];
let notesState: Note[] = [...MOCK_NOTES];
let usersState: Profile[] = [...MOCK_USERS];
let reviewsState: Review[] = [...MOCK_REVIEWS];
let purchasesState: Purchase[] = [...MOCK_PURCHASES];
let wishlistState: { id: string; user_id: string; note_id: string; created_at: string }[] = [
  { id: 'wish-1', user_id: 'user-student-1', note_id: 'note-1', created_at: new Date().toISOString() }
];
let withdrawalsState: Withdrawal[] = [...MOCK_WITHDRAWALS];
let reportsState: Report[] = [...MOCK_REPORTS];
let notificationsState: Notification[] = [...MOCK_NOTIFICATIONS];
let settingsState: SystemSettings = { ...DEFAULT_SYSTEM_SETTINGS };

export const store = {
  // Categories
  getCategories: () => categoriesState,
  getCategoryBySlug: (slug: string) => categoriesState.find((c) => c.slug === slug),
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => {
    const existing = categoriesState.find((c) => c.name.toLowerCase() === category.name.toLowerCase());
    if (existing) return existing;

    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}`,
      created_at: new Date().toISOString(),
      note_count: 1,
    };
    categoriesState.push(newCat);
    return newCat;
  },

  // Notes
  getNotes: () => notesState,
  getApprovedNotes: () => notesState.filter((n) => n.status === 'approved'),
  getNoteBySlug: (slug: string) => notesState.find((n) => n.slug === slug || n.id === slug),
  getNotesBySeller: (sellerId: string) => notesState.filter((n) => n.seller_id === sellerId),
  getNotesByCategory: (categorySlug: string) => {
    const cat = categoriesState.find((c) => c.slug === categorySlug);
    if (!cat) return [];
    return notesState.filter((n) => n.category_id === cat.id && n.status === 'approved');
  },
  createNote: (noteData: Partial<Note> & { custom_category_name?: string }, sellerId: string) => {
    const seller = usersState.find((u) => u.id === sellerId) || MOCK_USERS[0];
    
    let category: Category;

    if (noteData.custom_category_name && noteData.custom_category_name.trim()) {
      const customName = noteData.custom_category_name.trim();
      const customSlug = customName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      category = store.addCategory({
        name: customName,
        slug: customSlug || `custom-${Date.now()}`,
        description: `Custom seller created category for ${customName}`,
      });
    } else {
      category = categoriesState.find((c) => c.id === noteData.category_id) || INITIAL_CATEGORIES[0];
    }
    
    const newNote: Note = {
      id: `note-${Date.now()}`,
      seller_id: sellerId,
      category_id: category.id,
      title: noteData.title || 'Untitled Note',
      slug: (noteData.title || 'untitled').toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`,
      description: noteData.description || '',
      subject: noteData.subject || '',
      university: noteData.university || '',
      college: noteData.college || '',
      course: noteData.course || '',
      semester: noteData.semester || '1st Semester',
      year: noteData.year || '2026',
      language: noteData.language || 'English',
      tags: noteData.tags || [],
      pdf_path: noteData.pdf_path || '/sample-notes/sample.pdf',
      preview_path: noteData.preview_path || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      thumbnail_url: noteData.thumbnail_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
      file_size: noteData.file_size || 5200000,
      page_count: noteData.page_count || 45,
      price: noteData.is_free ? 0 : (noteData.price || 49),
      is_free: Boolean(noteData.is_free),
      status: settingsState.auto_approval ? 'approved' : 'pending',
      downloads: 0,
      views: 1,
      average_rating: 0,
      rating_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seller,
      category,
    };

    notesState.unshift(newNote);

    const user = usersState.find(u => u.id === sellerId);
    if (user && user.role === 'student') {
      user.role = 'seller';
    }

    return newNote;
  },
  updateNoteStatus: (noteId: string, status: Note['status'], reason?: string) => {
    const note = notesState.find((n) => n.id === noteId);
    if (note) {
      note.status = status;
      if (reason) note.rejection_reason = reason;
      note.updated_at = new Date().toISOString();

      notificationsState.unshift({
        id: `notif-${Date.now()}`,
        user_id: note.seller_id,
        title: `Note ${status === 'approved' ? 'Approved 🎉' : 'Status Updated'}`,
        message: status === 'approved'
          ? `Your note "${note.title}" has been approved and is now live.`
          : `Your note "${note.title}" status changed to ${status}. ${reason ? `Reason: ${reason}` : ''}`,
        type: status === 'approved' ? 'note_approved' : 'note_rejected',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
    return note;
  },
  deleteNote: (noteId: string) => {
    notesState = notesState.filter((n) => n.id !== noteId);
    return true;
  },
  incrementNoteDownloads: (noteId: string) => {
    const note = notesState.find((n) => n.id === noteId);
    if (note) {
      note.downloads += 1;
    }
  },

  // Purchases & Transactions
  getAllPurchases: () => purchasesState,
  getPurchasesByUser: (userId: string) => purchasesState.filter((p) => p.buyer_id === userId && p.status === 'paid'),
  getPurchasesBySeller: (sellerId: string) => purchasesState.filter((p) => p.seller_id === sellerId),
  hasUserPurchased: (userId: string, noteId: string) => {
    const note = notesState.find(n => n.id === noteId);
    if (note && note.is_free) return true;
    if (note && note.seller_id === userId) return true;
    return purchasesState.some((p) => p.buyer_id === userId && p.note_id === noteId && p.status === 'paid');
  },
  recordPurchase: ({
    buyerId,
    noteId,
    razorpayOrderId,
    razorpayPaymentId,
  }: {
    buyerId: string;
    noteId: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  }) => {
    const note = notesState.find((n) => n.id === noteId);
    if (!note) throw new Error('Note not found');

    const txnId = razorpayPaymentId || `txn-${Date.now()}`;

    // IDEMPOTENCY CHECK: Prevent duplicate purchase recording for same user/note or transaction
    const existing = purchasesState.find(
      (p) => (p.buyer_id === buyerId && p.note_id === noteId && p.status === 'paid') || p.transaction_id === txnId
    );
    if (existing) {
      return existing;
    }

    const buyer = usersState.find((u) => u.id === buyerId) || MOCK_USERS[2];
    const seller = usersState.find((u) => u.id === note.seller_id) || MOCK_USERS[0];

    // Server-side financial breakdown calculation
    const calc = calculateOrderAmounts(
      note.price,
      settingsState.gst_rate ?? 18,
      settingsState.platform_commission ?? 10
    );

    const purchase: Purchase = {
      id: `pur-${Date.now()}`,
      buyer_id: buyerId,
      seller_id: note.seller_id,
      note_id: noteId,
      transaction_id: txnId,

      base_amount: calc.baseAmount,
      gst_rate: calc.gstRate,
      gst_amount: calc.gstAmount,
      buyer_total_amount: calc.buyerTotalAmount,
      platform_fee_rate: calc.platformFeeRate,
      platform_fee_amount: calc.platformFeeAmount,
      seller_gross_amount: calc.sellerGrossAmount,
      seller_net_amount: calc.sellerNetAmount,

      // Legacy fields
      amount: calc.baseAmount,
      platform_fee: calc.platformFeeAmount,
      seller_amount: calc.sellerNetAmount,

      status: 'paid',
      payout_status: 'completed',
      refund_status: 'none',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      note,
      seller,
      buyer,
    };

    purchasesState.unshift(purchase);
    note.downloads += 1;

    notificationsState.unshift({
      id: `notif-${Date.now()}`,
      user_id: note.seller_id,
      title: 'New Sale Earned! 💰',
      message: `${buyer.full_name} purchased "${note.title}" for ₹${calc.buyerTotalAmount} (Base: ₹${calc.baseAmount} + 18% GST: ₹${calc.gstAmount}). You earned net ₹${calc.sellerNetAmount}!`,
      type: 'purchase',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return purchase;
  },

  // Refund Purchase Action (Idempotent)
  refundPurchase: (purchaseId: string, reason?: string) => {
    const purchase = purchasesState.find((p) => p.id === purchaseId || p.transaction_id === purchaseId);
    if (!purchase) throw new Error('Transaction record not found');

    if (purchase.status === 'refunded') {
      return purchase; // Already refunded (Idempotent)
    }

    purchase.status = 'refunded';
    purchase.refund_status = 'full';
    purchase.updated_at = new Date().toISOString();

    notificationsState.unshift({
      id: `notif-${Date.now()}`,
      user_id: purchase.seller_id,
      title: 'Sale Refund Processed 🔄',
      message: `A refund was processed for "${purchase.note?.title || 'Note'}". Seller earnings have been reconciled. ${reason ? `Reason: ${reason}` : ''}`,
      type: 'system',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return purchase;
  },

  // Wishlist
  getWishlistByUser: (userId: string) => {
    const userWish = wishlistState.filter((w) => w.user_id === userId);
    return userWish
      .map((w) => {
        const note = notesState.find((n) => n.id === w.note_id);
        return note ? { ...w, note } : null;
      })
      .filter(Boolean);
  },
  toggleWishlist: (userId: string, noteId: string) => {
    const existingIndex = wishlistState.findIndex((w) => w.user_id === userId && w.note_id === noteId);
    if (existingIndex > -1) {
      wishlistState.splice(existingIndex, 1);
      return false;
    } else {
      wishlistState.push({
        id: `wish-${Date.now()}`,
        user_id: userId,
        note_id: noteId,
        created_at: new Date().toISOString(),
      });
      return true;
    }
  },
  isInWishlist: (userId: string, noteId: string) => {
    return wishlistState.some((w) => w.user_id === userId && w.note_id === noteId);
  },

  // Reviews
  getReviewsByNote: (noteId: string) => {
    return reviewsState
      .filter((r) => r.note_id === noteId)
      .map((r) => {
        const user = usersState.find((u) => u.id === r.user_id);
        return { ...r, user };
      });
  },
  addReview: (userId: string, noteId: string, rating: number, reviewText: string) => {
    const user = usersState.find((u) => u.id === userId) || MOCK_USERS[2];
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      user_id: userId,
      note_id: noteId,
      rating,
      review: reviewText,
      created_at: new Date().toISOString(),
      user,
    };
    reviewsState.unshift(newRev);

    const noteReviews = reviewsState.filter((r) => r.note_id === noteId);
    const avg = noteReviews.reduce((sum, r) => sum + r.rating, 0) / noteReviews.length;
    const note = notesState.find((n) => n.id === noteId);
    if (note) {
      note.average_rating = parseFloat(avg.toFixed(1));
      note.rating_count = noteReviews.length;
    }

    return newRev;
  },

  // Withdrawals
  getWithdrawalsBySeller: (sellerId: string) => withdrawalsState.filter((w) => w.seller_id === sellerId),
  getAllWithdrawals: () => withdrawalsState.map(w => ({ ...w, seller: usersState.find(u => u.id === w.seller_id) })),
  requestWithdrawal: (sellerId: string, amount: number, payment_method: 'upi' | 'bank_transfer', payment_details: string) => {
    const newWth: Withdrawal = {
      id: `wth-${Date.now()}`,
      seller_id: sellerId,
      amount,
      payment_method,
      payment_details,
      status: 'pending',
      created_at: new Date().toISOString(),
      seller: usersState.find((u) => u.id === sellerId),
    };
    withdrawalsState.unshift(newWth);
    return newWth;
  },
  updateWithdrawalStatus: (withdrawalId: string, status: Withdrawal['status'], admin_note?: string) => {
    const wth = withdrawalsState.find((w) => w.id === withdrawalId);
    if (wth) {
      wth.status = status;
      if (admin_note) wth.admin_note = admin_note;
      if (status === 'completed') wth.processed_at = new Date().toISOString();

      notificationsState.unshift({
        id: `notif-${Date.now()}`,
        user_id: wth.seller_id,
        title: `Withdrawal ${status.toUpperCase()} 🏦`,
        message: `Your payout request of ₹${wth.amount} status is now ${status}. ${admin_note ? `Note: ${admin_note}` : ''}`,
        type: 'withdrawal',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
    return wth;
  },

  // Reports
  createReport: (reporterId: string, noteId: string, reason: Report['reason'], description: string) => {
    const newReport: Report = {
      id: `rep-${Date.now()}`,
      reporter_id: reporterId,
      note_id: noteId,
      reason,
      description,
      status: 'pending',
      created_at: new Date().toISOString(),
      reporter: usersState.find((u) => u.id === reporterId),
      note: notesState.find((n) => n.id === noteId),
    };
    reportsState.unshift(newReport);
    return newReport;
  },
  getReports: () => reportsState.map((r) => ({
    ...r,
    reporter: usersState.find((u) => u.id === r.reporter_id),
    note: notesState.find((n) => n.id === r.note_id),
  })),
  resolveReport: (reportId: string, status: Report['status'], adminResponse?: string) => {
    const r = reportsState.find((item) => item.id === reportId);
    if (r) {
      r.status = status;
      if (adminResponse) r.admin_response = adminResponse;
    }
    return r;
  },

  // Notifications
  getNotificationsByUser: (userId: string) => notificationsState.filter((n) => n.user_id === userId),
  markNotificationRead: (notifId: string) => {
    const n = notificationsState.find((item) => item.id === notifId);
    if (n) n.is_read = true;
  },

  // Users & Roles
  getUsers: () => usersState,
  getUserById: (id: string) => usersState.find((u) => u.id === id),
  updateUserProfile: (id: string, updates: Partial<Profile>) => {
    const user = usersState.find((u) => u.id === id);
    if (user) {
      Object.assign(user, updates, { updated_at: new Date().toISOString() });
    }
    return user;
  },
  updateUserRole: (id: string, role: Profile['role']) => {
    const user = usersState.find((u) => u.id === id);
    if (user) {
      user.role = role;
      user.updated_at = new Date().toISOString();
    }
    return user;
  },

  // System Settings
  getSettings: () => settingsState,
  updateSettings: (newSettings: Partial<SystemSettings>) => {
    settingsState = { ...settingsState, ...newSettings };
    return settingsState;
  },
};
