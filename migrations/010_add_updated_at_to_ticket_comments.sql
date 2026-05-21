-- Add updated_at column to ticket_comments table
ALTER TABLE ticket_comments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
