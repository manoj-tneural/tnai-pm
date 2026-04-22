-- Add start_date column to features table
ALTER TABLE features ADD COLUMN start_date date;

-- Add end_date column to features table
ALTER TABLE features ADD COLUMN end_date date;

-- Add assigned_to column to features table (UUID array for multiple assignees)
ALTER TABLE features ADD COLUMN assigned_to uuid[];
