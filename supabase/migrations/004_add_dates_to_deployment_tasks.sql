-- Add start_date and end_date columns to deployment_tasks table
ALTER TABLE deployment_tasks ADD COLUMN start_date date DEFAULT NULL;
ALTER TABLE deployment_tasks ADD COLUMN end_date date DEFAULT NULL;
