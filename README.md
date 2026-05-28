# Content Publishing & Draft Management Platform - freelance

A modern, full-stack content publishing system with draft management, version control, and AI-powered semantic search built with Next.js 16, Supabase, and Better Auth.

## Features

- **Draft Management**: Auto-saving drafts with full editing capabilities
- **Version Control**: Track all changes with detailed version history and restoration
- **Rich Text Editor**: TipTap-based editor with markdown support
- **Semantic Search**: AI-powered content discovery using embeddings
- **User Authentication**: Better Auth integration with email/password
- **Row-Level Security**: Supabase RLS policies for data privacy
- **Edit Logging**: Complete audit trail of all modifications

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui with Tailwind CSS
- **Editor**: TipTap (rich text editor)
- **State Management**: React hooks + SWR for data fetching
- **Auth Client**: Better Auth client library

### Backend
- **Runtime**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Better Auth
- **Vector Database**: pgvector for semantic search
- **AI Embeddings**: OpenAI text-embedding-3-small

### Database Schema

#### Core Tables
- **users**: User accounts managed by Better Auth
- **content**: Published articles/posts
- **drafts**: Work-in-progress content with auto-save
- **content_versions**: Full version history for all content
- **edit_logs**: Audit trail of all modifications
- **content_embeddings**: Vector embeddings for semantic search

All tables include Row-Level Security (RLS) policies for user data isolation.

## Project Structure

```
/app
  /api
    /auth/[...all]/route.ts       # Better Auth handler
    /drafts/route.ts               # Draft CRUD operations
    /drafts/[id]/route.ts          # Draft detail operations
    /content/route.ts              # Content CRUD operations
    /content/[id]/route.ts         # Content detail operations
    /search/semantic/route.ts       # Vector search endpoint
  /auth
    /signin/page.tsx               # Sign in page
    /signup/page.tsx               # Sign up page
  /dashboard/page.tsx              # Main dashboard
  /editor/page.tsx                 # Content editor
  /content/[slug]/page.tsx         # Public content view
  /layout.tsx                      # Root layout
  /page.tsx                        # Landing page

/components
  /ContentEditor.tsx               # Rich text editor component
  /DraftList.tsx                   # Draft list with selection
  /VersionHistory.tsx              # Version history viewer
  /ContentSearch.tsx               # Full-text & semantic search
  /PublishedContent.tsx            # Public content display

/lib
  /auth.ts                         # Better Auth configuration
  /auth-client.ts                  # Client-side auth hooks
  /supabase.ts                     # Supabase client initialization
  /embeddings.ts                   # OpenAI embeddings utilities

/migrations
  /001_create_initial_schema.sql   # Database schema & RLS policies
```

## Setup & Installation

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account
- OpenAI API key (for embeddings)

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
POSTGRES_URL=your_postgres_connection_url

# Better Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your_secret_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation Steps

1. **Clone and install dependencies**
   ```bash
   pnpm install
   ```

2. **Run database migrations**
   - Navigate to Supabase dashboard
   - Go to SQL Editor
   - Run the SQL from `/migrations/001_create_initial_schema.sql`

3. **Create RLS policies**
   - The migration file includes all necessary RLS policies
   - Verify they're applied in Supabase

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

## API Endpoints

### Authentication
- `POST /api/auth/[...all]` - Better Auth handler

### Drafts
- `GET /api/drafts?userId=<id>` - List user drafts
- `POST /api/drafts` - Create new draft
- `GET /api/drafts/[id]` - Get draft details
- `PATCH /api/drafts/[id]` - Update draft
- `DELETE /api/drafts/[id]` - Delete draft

### Content
- `GET /api/content` - List published content
- `POST /api/content` - Publish new content
- `GET /api/content/[id]` - Get content details
- `PATCH /api/content/[id]` - Update published content
- `DELETE /api/content/[id]` - Delete content

### Search
- `POST /api/search/semantic` - Semantic search (AI)

## Usage Examples

### Creating & Publishing Content

1. **Start a new draft**
   - Go to Dashboard → New Article
   - Write content (auto-saves every 10 seconds)
   - Add title, description, and topic

2. **Publish content**
   - Click "Publish" button
   - Creates first version entry
   - Content becomes publicly accessible

3. **Manage versions**
   - Edit existing content
   - Each save creates a new version
   - Can restore any previous version

### Searching Content

**Full-text search**: Uses PostgreSQL `ilike` operator
- Searches title, description, content, and topic

**Semantic search**: Uses AI embeddings
- Finds content by meaning, not keywords
- Example: "Cloud infrastructure" finds articles about AWS, GCP, Azure

## Security

### Row-Level Security (RLS)
- Users can only see their own drafts
- Published content is visible to all
- Edit logs are user-specific

### Authentication
- Email/password with Better Auth
- Secure session management
- Password hashing by Better Auth

### API Security
- User ID validation on all protected endpoints
- RLS prevents unauthorized data access
- Parameterized queries prevent SQL injection

## Performance Optimizations

- **Auto-save debouncing**: 10-second intervals
- **Vector index**: IVFFlat index on embeddings for fast search
- **Database indexes**: Optimized query patterns
- **Component lazy loading**: Dynamic imports where possible
- **Caching**: SWR for client-side data caching

## Development

### Adding New Features

1. **Database changes**: Add migration file, apply via Supabase
2. **API endpoints**: Create route files in `/app/api`
3. **Components**: Add to `/components` directory
4. **Styling**: Use Tailwind CSS classes

### Testing

```bash
# Build the project
pnpm build

# Start production server
pnpm start
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Environment Variables for Vercel
Add all variables from `.env.local` to Vercel project settings → Environment Variables

## Known Limitations

- Vector search requires OpenAI API key
- Embeddings generated on-demand (can be optimized with background jobs)
- File uploads not yet implemented
- Collaborative editing not supported

## Future Enhancements

- [ ] Image/file uploads with Vercel Blob
- [ ] Real-time collaborative editing
- [ ] AI-powered content suggestions
- [ ] Export to PDF/Markdown
- [ ] Content scheduling
- [ ] Advanced analytics

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` file
- Verify all SUPABASE_* variables are set
- Restart dev server

### "Auth not configured"
- Ensure POSTGRES_URL is set
- Verify Better Auth secret is generated
- Check database migrations were applied

### "Search not working"
- Verify OPENAI_API_KEY is set
- Check OpenAI API quota
- Test with full-text search first

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
