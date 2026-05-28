# Quick Start Guide

## System Overview

This is a content publishing platform with:
- User authentication (email/password)
- Draft management with auto-save
- Version control & history
- Semantic search with AI embeddings
- Row-level security for privacy

## Prerequisites

1. **Supabase Account** - https://supabase.com
2. **OpenAI API Key** - https://platform.openai.com
3. **Node.js 18+** and **pnpm**

## 1. Set Up Supabase Project

### Create Project
1. Sign up at https://supabase.com
2. Create a new project
3. Wait for it to initialize
4. Go to Settings → API to get your keys

### Run Database Schema
1. Copy the SQL from `/migrations/001_create_initial_schema.sql`
2. In Supabase, go to SQL Editor
3. Paste the SQL and execute
4. This creates tables, indexes, and RLS policies

### Generate Better Auth Secret
```bash
openssl rand -base64 32
# Copy the output - you'll need this
```

## 2. Configure Environment Variables

Create `.env.local` in the project root:

```env
# Supabase Keys (from Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here

# PostgreSQL Connection (from Settings → Database)
POSTGRES_URL=postgres://postgres:[PASSWORD]@db.[REGION].supabase.co:5432/postgres

# Better Auth Secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-generated-secret-here

# OpenAI API Key (from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Install Dependencies

```bash
pnpm install
```

This will install:
- Next.js 16 with React 19
- Supabase client & Better Auth
- TipTap editor & shadcn/ui
- AI SDK for embeddings

## 4. Start Development Server

```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

## 5. Create Your First Account

1. Go to http://localhost:3000
2. Click "Get Started" or navigate to Sign Up
3. Enter email and password
4. You'll be redirected to the dashboard

## 6. Test the Features

### Create a Draft
1. Click "New Article" button
2. Write a title and content
3. Content auto-saves every 10 seconds
4. See "Draft saved successfully" notifications

### Publish Content
1. Click "Publish" button
2. Your content becomes public
3. You can view it at /content/[slug]

### View Drafts
1. On Dashboard, go to "Drafts" tab
2. Click "Edit" to continue working
3. Click "Delete" to remove draft

### Search Content
1. Go to "Search" tab
2. Try full-text search (keywords)
3. Switch to "Semantic Search (AI)" for meaning-based search

### Version History
1. Edit published content
2. Go to "Version History" tab
3. See all previous versions
4. Click "Restore" to revert to any version

## Project Structure

```
app/
  - page.tsx              # Landing page
  - layout.tsx            # Root layout
  - auth/signin           # Sign in page
  - auth/signup           # Sign up page
  - dashboard             # Main dashboard
  - editor                # Content editor
  - content/[slug]        # Public content view
  - api/                  # API endpoints

components/
  - ContentEditor.tsx     # Rich text editor
  - DraftList.tsx        # Draft management
  - VersionHistory.tsx    # Version control
  - ContentSearch.tsx     # Search interface
  - PublishedContent.tsx  # Content display

lib/
  - auth.ts              # Auth setup
  - supabase.ts          # Database client
  - embeddings.ts        # AI embeddings
  - auth-client.ts       # Auth hooks

migrations/
  - 001_create_initial_schema.sql  # DB schema
```

## Common Issues & Solutions

### "Auth not configured"
- Verify POSTGRES_URL is correct
- Check BETTER_AUTH_SECRET is set
- Restart dev server

### "Missing Supabase environment variables"
- Verify all SUPABASE_* variables are set
- Check for typos in .env.local
- Restart dev server

### "Search not working"
- Verify OPENAI_API_KEY is set
- Check your OpenAI account has credits
- Try full-text search first (doesn't need AI)

### Database migration errors
- Verify PostgreSQL version supports pgvector
- Check Supabase extensions are enabled
- Try running migration in Supabase SQL Editor directly

## Next Steps

### Local Development
- Edit components in `/components`
- Add API routes in `/app/api`
- Styling with Tailwind CSS classes
- Test with `pnpm dev`

### Deployment to Vercel
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add all `.env.local` variables
4. Deploy with one click

### Customization
- Change colors in `/app/globals.css`
- Modify editor features in `ContentEditor.tsx`
- Add new fields to database schema
- Customize RLS policies

## Key Files to Understand

| File | Purpose |
|------|---------|
| `/migrations/001_*.sql` | Database schema & security |
| `/lib/auth.ts` | Authentication setup |
| `/lib/supabase.ts` | Database client |
| `/components/ContentEditor.tsx` | Main editor component |
| `/app/api/content/route.ts` | Content CRUD operations |
| `/app/api/search/semantic/route.ts` | AI search endpoint |

## Support

For issues:
1. Check the README.md for detailed documentation
2. Review error messages in browser console
3. Check server logs in terminal
4. Verify all environment variables are set

## What's Next?

Once everything is working:
- Customize the UI colors and fonts
- Add more editor features
- Implement image uploads
- Add analytics tracking
- Deploy to production

Happy publishing!
