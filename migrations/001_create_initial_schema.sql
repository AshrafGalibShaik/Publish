-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table (for Better Auth integration)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content table (published articles/posts)
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content_html TEXT NOT NULL,
  content_text TEXT NOT NULL,
  topic VARCHAR(255),
  status VARCHAR(50) DEFAULT 'published',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drafts table (work-in-progress content)
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content_html TEXT,
  content_text TEXT,
  topic VARCHAR(255),
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content versions table (version history)
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_id, version_number)
);

-- Edit logs table (track all edits)
CREATE TABLE IF NOT EXISTS edit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  previous_content TEXT,
  new_content TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content embeddings table (for vector search)
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  embedding vector(1536),
  embedding_model VARCHAR(255) DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_topic ON content(topic);
CREATE INDEX IF NOT EXISTS idx_content_published_at ON content(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_content_id ON drafts(content_id);
CREATE INDEX IF NOT EXISTS idx_versions_content_id ON content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_edit_logs_user_id ON edit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_logs_content_id ON edit_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_id ON content_embeddings(content_id);

-- Create vector index for semantic search
CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector ON content_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- Content table policies
CREATE POLICY "Published content is viewable by all" ON content
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can create content" ON content
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own content" ON content
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own content" ON content
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Drafts table policies
CREATE POLICY "Users can view their own drafts" ON drafts
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own drafts" ON drafts
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own drafts" ON drafts
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Content versions policies
CREATE POLICY "Users can view versions of their content" ON content_versions
  FOR SELECT USING (
    content_id IN (
      SELECT id FROM content WHERE auth.uid()::text = user_id::text
    )
  );

-- Edit logs policies
CREATE POLICY "Users can view their own edit logs" ON edit_logs
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Content embeddings policies
CREATE POLICY "Content embeddings follow content visibility" ON content_embeddings
  FOR SELECT USING (
    content_id IN (
      SELECT id FROM content WHERE status = 'published'
    )
  );
