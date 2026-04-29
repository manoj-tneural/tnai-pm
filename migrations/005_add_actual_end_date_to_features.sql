-- Add actual_end_date column to features table
-- This tracks the actual date when a feature was completed (can differ from planned end_date)
ALTER TABLE features ADD COLUMN actual_end_date date DEFAULT NULL;
