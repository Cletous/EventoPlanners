USE eventoplanners_db;

ALTER TABLE users
  ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER role,
  ADD COLUMN deleted_at DATETIME NULL AFTER updated_at,
  ADD KEY idx_users_deleted_at (deleted_at);
