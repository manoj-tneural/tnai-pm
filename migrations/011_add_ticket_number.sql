-- Add ticket_number auto-incrementing column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_number SERIAL UNIQUE;

-- Create index for ticket_number
CREATE INDEX IF NOT EXISTS idx_ticket_number ON tickets(ticket_number);
