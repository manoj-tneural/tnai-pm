-- Add DEFAULT NULL to actual_end_date column in features table
ALTER TABLE features ALTER COLUMN actual_end_date SET DEFAULT NULL;

-- Add DEFAULT NULL to actual_end_date column in dev_tasks table
ALTER TABLE dev_tasks ALTER COLUMN actual_end_date SET DEFAULT NULL;
