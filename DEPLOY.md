# 🚀 Pinverse - Vercel Deployment Guide

## Step 1: Set Up Supabase (Database)

1. Go to your existing Supabase project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database**
3. Copy the **Connection string** (URI format, use Transaction pooler)
   - It looks like: `postgresql://postgres.ref:password@aws-0-region.pooler.supabase.com:6543/postgres`

## Step 2: Set Up AWS S3 (Image Storage)

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com)
2. **Create a bucket**:
   - Name: something unique like `pinverse-uploads-yourname`
   - Region: pick closest to you (e.g., `ap-south-1`)
   - **Block ALL public access**: OFF (uncheck the box)
   - Click Create
3. **Create IAM credentials**:
   - Go to AWS Console → IAM → Users → Create User
   - Give it a name like `pinverse-s3`
   - Attach policy: `AmazonS3FullAccess`
   - Create the user, then go to Security Credentials → Create Access Key
   - Copy the **Access Key ID** and **Secret Access Key**

## Step 3: Prepare the Code

Open `prisma/schema.prisma` and change the provider:
```prisma
datasource db {
  provider = "postgresql"   // ← Change from "sqlite" to "postgresql"
  url      = env("DATABASE_URL")
}
```

## Step 4: Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. **Framework Preset**: Next.js (auto-detected)
4. **Build Command**: `npx prisma generate && next build`
5. **Output Directory**: `.next` (default)
6. **Install Command**: `npm install` (or `bun install`)

## Step 5: Add Environment Variables in Vercel

In Vercel Project Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase PostgreSQL connection string |
| `JWT_SECRET` | A random 32+ char string (run `openssl rand -base64 32`) |
| `STORAGE_PROVIDER` | `s3` |
| `AWS_ACCESS_KEY_ID` | Your AWS Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Access Key |
| `AWS_S3_BUCKET_NAME` | Your S3 bucket name (e.g., `pinverse-uploads-yourname`) |
| `AWS_REGION` | Your bucket region (e.g., `ap-south-1`) |
| `NEXT_PUBLIC_URL` | Your Vercel app URL (e.g., `https://pinverse.vercel.app`) |

## Step 6: Initialize Database

After first deployment, run this locally with your production DATABASE_URL:

```bash
DATABASE_URL="your-supabase-url" npx prisma db push
DATABASE_URL="your-supabase-url" npx prisma db seed
```

Or use the Supabase SQL editor to run the schema.

## Step 7: Done! 🎉

Your Pinverse app should now be live at your Vercel URL.

---

## Troubleshooting

- **Build fails with Prisma error**: Make sure `prisma generate` runs during build
- **Images not uploading**: Check AWS S3 credentials and bucket permissions
- **Database connection fails**: Verify DATABASE_URL uses the Transaction pooler (port 6543)
- **Hydration errors**: These should be fixed - the app uses `mounted` state for theme detection
