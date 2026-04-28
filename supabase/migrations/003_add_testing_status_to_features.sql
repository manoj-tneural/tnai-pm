-- Add 'testing' status to features table check constraint
ALTER TABLE features DROP CONSTRAINT features_status_check;
ALTER TABLE features ADD CONSTRAINT features_status_check CHECK (status IN ('completed', 'in_progress', 'planned', 'blocked', 'testing'));
