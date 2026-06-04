-- Migration: Add ticket tracking fields
-- Purpose: Track ticket source (internal/external), customer info, and testing details

-- Add new columns to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS ticket_source VARCHAR(20) DEFAULT 'internal' CHECK (ticket_source IN ('internal', 'external')),
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS tested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tested_date TIMESTAMP;

-- Create index for ticket source filtering
CREATE INDEX IF NOT EXISTS idx_tickets_source ON tickets(ticket_source);
CREATE INDEX IF NOT EXISTS idx_tickets_tested_by ON tickets(tested_by);
