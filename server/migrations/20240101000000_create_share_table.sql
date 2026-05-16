-- Create share table
CREATE TABLE IF NOT EXISTS share (
    id UUID PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on created_at for potential future queries
CREATE INDEX idx_share_created_at ON share(created_at);