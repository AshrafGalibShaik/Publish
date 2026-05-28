# Database Setup Instructions

## Overview

The application uses Supabase (PostgreSQL) with Row-Level Security (RLS) for secure, multi-tenant data storage. This guide explains how to set up the database schema.

## Prerequisites

- Supabase account (free tier is sufficient)
- PostgreSQL knowledge (optional)
- The migration SQL file: `/migrations/001_create_initial_schema.sql`

## Setup Steps

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - **Name**: Your project name
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 5-10 minutes for initialization

### Step 2: Get Connection Credentials

1. Go to **Settings** → **Database**
2. Find your credentials:
   - **Host**: `db.[region].supabase.co`
   - **User**: `postgres`
   - **Password**: Your database password
   - **Port**: `5432`
   - **Database**: `postgres`

3. Go to **Settings** → **API**
4. Copy these keys:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public**: Your anon key
   - **service_role secret**: Your service role key

### Step 3: Run Database Migrations

**Option A: Via Supabase SQL Editor (Recommended)**

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open `/migrations/001_create_initial_schema.sql` in your editor
4. Copy the entire SQL content
5. Paste into Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for completion (should show "Query complete")

**Option B: Via psql Command Line**

```bash
# From your terminal with psql installed
psql -h db.[region].supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -f migrations/001_create_initial_schema.sql
```

When prompted for password, enter your database password.

### Step 4: Verify Migration

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - `users`
   - `content`
   - `drafts`
   - `content_versions`
   - `edit_logs`
   - `content_embeddings`

3. Click each table to verify columns are created
4. Check **Extensions** → should have:
   - `uuid-ossp` (for UUIDs)
   - `vector` (for embeddings)

## Database Schema Details

### users Table
```sql
id (UUID, Primary Key)
email (Text, Unique)
name (Text)
image (Text)
created_at (Timestamp)
updated_at (Timestamp)
```
**Purpose**: Stores user accounts (managed by Better Auth)
**Security**: RLS - users can only see their own record

### content Table
```sql
id (UUID, Primary Key)
user_id (UUID, Foreign Key → users)
title (Text)
slug (Text, Unique)
description (Text)
content_html (Text) - HTML from TipTap editor
content_text (Text) - Plain text for search
topic (VARCHAR(255))
status (VARCHAR(50)) - 'published' or 'draft'
published_at (Timestamp)
created_at (Timestamp)
updated_at (Timestamp)
```
**Purpose**: Published articles
**Security**: RLS - published content visible to all, modifications only by owner
**Indexes**: user_id, topic, published_at

### drafts Table
```sql
id (UUID, Primary Key)
user_id (UUID, Foreign Key → users)
title (Text)
content_html (Text)
content_text (Text)
topic (VARCHAR(255))
content_id (UUID, Foreign Key → content, nullable)
last_saved_at (Timestamp)
created_at (Timestamp)
updated_at (Timestamp)
```
**Purpose**: Work-in-progress articles
**Security**: RLS - only owner can access
**Indexes**: user_id, content_id

### content_versions Table
```sql
id (UUID, Primary Key)
content_id (UUID, Foreign Key → content)
version_number (Integer)
title (Text)
content_html (Text)
content_text (Text)
changed_by (UUID, Foreign Key → users, nullable)
change_summary (Text)
created_at (Timestamp)
Unique: (content_id, version_number)
```
**Purpose**: Version history for published content
**Security**: RLS - only accessible to content owner
**Indexes**: content_id

### edit_logs Table
```sql
id (UUID, Primary Key)
content_id (UUID, Foreign Key → content, nullable)
draft_id (UUID, Foreign Key → drafts, nullable)
user_id (UUID, Foreign Key → users)
action (VARCHAR(50)) - 'draft_created', 'published', etc.
previous_content (Text, nullable)
new_content (Text, nullable)
timestamp (Timestamp)
```
**Purpose**: Audit trail of all edits
**Security**: RLS - users see only their logs
**Indexes**: user_id, content_id

### content_embeddings Table
```sql
id (UUID, Primary Key)
content_id (UUID, Foreign Key → content)
embedding (vector(1536)) - OpenAI embedding vector
embedding_model (VARCHAR(255)) - 'text-embedding-3-small'
created_at (Timestamp)
Unique: content_id
```
**Purpose**: Vector embeddings for semantic search
**Security**: RLS - visible for published content
**Index**: Vector index for similarity search

## Row-Level Security (RLS)

All tables have RLS enabled. Key policies:

### users
- SELECT: Only own records
- UPDATE: Only own records

### content
- SELECT: Published content visible to all
- INSERT: Authenticated users
- UPDATE/DELETE: Only owner

### drafts
- SELECT/INSERT/UPDATE/DELETE: Only owner

### content_versions
- SELECT: Only content owner

### edit_logs
- SELECT: Only own logs

### content_embeddings
- SELECT: Published content embeddings only

## Working with the Database

### Add New Content
```sql
INSERT INTO content (
  user_id, title, slug, content_html, content_text, topic
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'My Article',
  'my-article-1234567890',
  '<p>Content here</p>',
  'Content here',
  'Technology'
);
```

### Get User's Drafts
```sql
SELECT * FROM drafts 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY updated_at DESC;
```

### View All Versions of Content
```sql
SELECT * FROM content_versions
WHERE content_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY version_number DESC;
```

### Search Using Vector Similarity
```sql
SELECT c.* FROM content c
JOIN content_embeddings ce ON c.id = ce.content_id
ORDER BY ce.embedding <=> '[embedding_vector_here]'
LIMIT 10;
```

## Backups

Supabase automatically backs up your data daily. To create manual backup:

1. Go to **Settings** → **Backups**
2. Click **Create Backup Now**
3. Backup will be available for download

## Troubleshooting

### "Extension vector does not exist"
- Check if pgvector extension is enabled
- Go to **Extensions**, search for "vector"
- Enable it if disabled

### "Permission denied for schema public"
- Check RLS policies are correctly created
- Verify user role has correct permissions
- Restart Supabase project

### "UUID type not found"
- Ensure uuid-ossp extension is enabled
- Check Extensions in Supabase dashboard

### "Foreign key constraint violated"
- Verify you're providing valid UUIDs
- Check referenced user_id exists in users table
- Ensure content_id exists when linking versions

### "Vector dimension mismatch"
- OpenAI embeddings must be 1536 dimensions
- Verify embedding_model is text-embedding-3-small
- Don't use other embedding models

## Performance Tips

1. **Indexes** are already created for common queries
2. **Vector search** uses IVFFlat index (good balance of speed/accuracy)
3. **RLS policies** are efficient and cached
4. **Pagination** recommended for large result sets

## Monitoring

In Supabase dashboard:

1. **Performance** tab shows query performance
2. **Database** → **Logs** shows recent operations
3. **Extensions** shows enabled PostgreSQL extensions
4. **Realtime** can be enabled for live features

## Data Export

To export your data:

1. Go to **SQL Editor**
2. Run query: `SELECT * FROM content;`
3. Click "Download as CSV"

Or use pg_dump for full backup:
```bash
pg_dump -U postgres \
        -h db.[region].supabase.co \
        -d postgres > backup.sql
```

## Connection String for Other Tools

If connecting via external tools like DBeaver:

**Host**: db.[region].supabase.co
**Port**: 5432
**Database**: postgres
**User**: postgres
**Password**: Your database password
**SSL**: Required

## Next Steps

After setup:
1. Set environment variables in `.env.local`
2. Install dependencies: `pnpm install`
3. Run dev server: `pnpm dev`
4. Create test account
5. Test CRUD operations

See `/SETUP.md` for application setup instructions.

## Support

For database issues:
- Check Supabase docs: https://supabase.com/docs
- Review RLS policies in dashboard
- Check PostgreSQL error messages in SQL Editor
- Verify all migrations ran successfully

