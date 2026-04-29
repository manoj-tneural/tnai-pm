-- Add actual_end_date column to dev_tasks table
-- This tracks the actual date when a task was completed (can differ from planned_end)
ALTER TABLE dev_tasks ADD COLUMN actual_end_date date DEFAULT NULL;
