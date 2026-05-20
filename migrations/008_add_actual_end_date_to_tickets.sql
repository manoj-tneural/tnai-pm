-- Add actual_end_date column to tickets table
ALTER TABLE tickets ADD COLUMN actual_end_date date DEFAULT NULL;
