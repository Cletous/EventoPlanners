-- Offline/manual payment audit support.
-- Existing databases should use: npm run db:migrate:manual-payments
ALTER TABLE payments
  ADD COLUMN payment_method ENUM('paynow', 'bank_transfer', 'manual') NOT NULL DEFAULT 'paynow' AFTER registration_id,
  ADD COLUMN external_reference VARCHAR(150) NULL AFTER paynow_reference,
  ADD COLUMN confirmation_notes VARCHAR(500) NULL AFTER external_reference,
  ADD COLUMN confirmed_by BIGINT UNSIGNED NULL AFTER status,
  ADD COLUMN confirmed_at DATETIME NULL AFTER confirmed_by,
  ADD KEY idx_payments_method (payment_method),
  ADD KEY idx_payments_confirmed_by (confirmed_by),
  ADD CONSTRAINT fk_payments_confirmed_by
    FOREIGN KEY (confirmed_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
