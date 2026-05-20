-- Create ticket_history table to track all changes made to tickets
CREATE TABLE IF NOT EXISTS ticket_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action varchar(255) NOT NULL, -- 'created', 'updated', 'status_changed', etc.
  field_name varchar(255), -- which field was changed
  old_value text, -- previous value
  new_value text, -- new value
  description text, -- human readable description of the change
  created_at timestamp DEFAULT NOW()
);

CREATE INDEX idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_created_at ON ticket_history(created_at DESC);
