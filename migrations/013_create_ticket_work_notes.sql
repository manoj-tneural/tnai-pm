-- Migration: Create ticket_work_notes table
-- Purpose: Store technical work notes separate from user comments
-- Work notes contain detailed information about fixes, solutions, and technical changes
-- Comments are for PM, CS, and client communication

CREATE TABLE IF NOT EXISTS ticket_work_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_note TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_ticket_work_notes_ticket_id ON ticket_work_notes(ticket_id);
CREATE INDEX idx_ticket_work_notes_created_at ON ticket_work_notes(ticket_id, created_at DESC);
CREATE INDEX idx_ticket_work_notes_user_id ON ticket_work_notes(user_id);
