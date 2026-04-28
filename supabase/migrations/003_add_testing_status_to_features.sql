-- Add 'testing' status to features table check constraint
ALTER TABLE dev_tasks DROP CONSTRAINT dev_tasks_status_check;
ALTER TABLE dev_tasks ADD CONSTRAINT dev_tasks_status_check CHECK (status IN ('completed', 'in_progress', 'planned', 'blocked', 'testing'));
