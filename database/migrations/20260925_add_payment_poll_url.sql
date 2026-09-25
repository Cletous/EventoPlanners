-- Milestone 9 Paynow polling support.
-- Existing databases should use: npm run db:migrate:paynow-poll
ALTER TABLE payments ADD COLUMN poll_url VARCHAR(1000) NULL AFTER paynow_reference;
