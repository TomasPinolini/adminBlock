-- Migration: Fix quotes.order_id foreign key to SET NULL on delete
-- Without this, deleting an order that has a linked quote fails with FK constraint violation.

ALTER TABLE quotes
  DROP CONSTRAINT IF EXISTS quotes_order_id_orders_id_fk;

ALTER TABLE quotes
  ADD CONSTRAINT quotes_order_id_orders_id_fk
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
