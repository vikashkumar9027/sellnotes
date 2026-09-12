# NoteMart – Student Handwritten Notes Marketplace

**"Share Notes. Learn Better. Earn Together."**

NoteMart is a production-ready, modern, responsive full-stack web application built specifically for college and university students to upload, sell, buy, preview, and download handwritten study notes in PDF format.

---

## 🚀 Key Features

* **Student Marketplace**: Advanced search and multi-facet filtering by domain category, university, subject, course, semester, rating, and free/paid pricing.
* **Watermarked PDF Sample Previews**: Multi-page canvas preview for prospective buyers while keeping complete paid PDFs securely protected in private storage.
* **Razorpay Payment Integration**: Server-side HMAC SHA256 signature verification for instant unlocked downloads and automated revenue splitting.
* **Dashboards for All Roles**:
  * **Buyer Dashboard**: Purchases log, Wishlist items, Download history, and Profile settings.
  * **Seller Dashboard**: Real-time sales metrics, upload manager, revenue analytics charts, and UPI/Bank withdrawal requests.
  * **Admin Dashboard**: Content moderation queue (Approve/Reject with reasons), User role controls, Category manager, Reports triage, Withdrawal payouts, and Global platform settings.
* **Commission & Anti-Piracy Systems**: Configurable platform commission rate (default 10%), seller ownership confirmation, and copyright reporting workflow.

---

## 🛠️ Technology Stack

* **Framework**: Next.js 15+ (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Database & Auth**: Supabase PostgreSQL & Supabase Auth
* **Storage**: Supabase Storage (Private PDF bucket + Public preview bucket)
* **Payments**: Razorpay Node SDK & Web Checkout
* **Icons & Animation**: Lucide React & Framer Motion
* **Deployment Target**: Vercel

---

## 📂 Project Structure

```
sell notes/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (marketing)/
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── privacy/page.tsx
│   │   └── copyright-policy/page.tsx
│   ├── notes/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── categories/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── sellers/
│   │   └── [id]/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── purchases/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── profile/page.tsx
│   │   └── seller/
│   │       ├── page.tsx
│   │       ├── notes/page.tsx
│   │       ├── upload/page.tsx
│   │       ├── sales/page.tsx
│   │       ├── earnings/page.tsx
│   │       └── withdrawals/page.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── users/page.tsx
│   │   ├── notes/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── withdrawals/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── notes/download/route.ts
│   │   └── payments/
│   │       ├── create-order/route.ts
│   │       └── verify/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── layout/ (Navbar, Footer)
│   └── notes/ (NoteCard, SearchBar, FilterSidebar, PdfPreviewer, PurchaseButton, UploadForm)
├── lib/
│   ├── supabase/ (client.ts, server.ts, admin.ts)
│   ├── razorpay.ts
│   ├── store.ts
│   ├── utils.ts
│   └── validators.ts
├── types/
│   └── index.ts
├── supabase/
│   ├── schema.sql
│   └── seed.sql
├── .env.example
└── package.json
```

---

## 🗄️ Database Setup Instructions (Supabase)

1. Sign in to your [Supabase Dashboard](https://supabase.com) and create a new PostgreSQL project.
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this repository, paste the contents into the SQL Editor, and click **Run**.
4. (Optional) Run `supabase/seed.sql` to populate sample categories and realistic Indian university study notes.

---

## 🪣 Storage Bucket Setup Instructions

In your Supabase project under **Storage**:
1. Create a **Private** bucket named `notes-private` (stores full original note PDFs).
2. Create a **Public** bucket named `notes-preview` (stores thumbnails and preview sample images).

---

## 🔐 Authentication Setup

1. Go to **Authentication -> Settings** in your Supabase dashboard.
2. Enable **Email/Password** provider.
3. Set your site URL in **URL Configuration** (e.g. `http://localhost:3000` or your Vercel URL).

---

## 💳 Razorpay Payment Setup

1. Sign in to your [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Account Settings -> API Keys** and generate **Key ID** and **Key Secret**.
3. Copy these keys into your `.env.local` or Vercel environment variables.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 💻 Local Development Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start local Next.js development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 1-Click Free Deployment on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvikashkumar9027%2Fsellnotes&project-name=notemart&env=NEXT_PUBLIC_APP_URL,NEXT_PUBLIC_RAZORPAY_KEY_ID,RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET,RAZORPAY_WEBHOOK_SECRET,BREVO_API_KEY,SMTP_VERIFIED_SENDER)

### Deploying Manually:
1. Push your repository to GitHub: `https://github.com/vikashkumar9027/sellnotes` (Already synced!)
2. Go to [Vercel Dashboard](https://vercel.com) and sign in with GitHub.
3. Click **Add New...** -> **Project**.
4. Select **vikashkumar9027/sellnotes** from the list and click **Import**.
5. Under **Environment Variables**, expand the tab and enter your credentials (or copy from `.env.local`):
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `BREVO_API_KEY` (or Gmail SMTP details)
   - `SMTP_VERIFIED_SENDER`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel domain e.g. `https://your-project.vercel.app`)
6. Click **Deploy**. Vercel will build and launch your site with a free `.vercel.app` domain and free SSL!


---

## 🛡️ Production Security Checklist

- [x] All payment signature verifications executed server-side via HMAC SHA256.
- [x] Original paid PDF files stored in private Supabase Storage buckets (never public).
- [x] Download links generated dynamically via server validation of purchase ownership.
- [x] Row Level Security (RLS) policies enforced across PostgreSQL tables.
- [x] Input data validated server-side using Zod schemas.
