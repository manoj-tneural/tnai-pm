-- Add actual_end_date column to deployment_tasks table
-- This tracks when the task was actually completed
ALTER TABLE deployment_tasks ADD COLUMN actual_end_date date DEFAULT NULL;
