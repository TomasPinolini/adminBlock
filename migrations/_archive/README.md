# Archived Migrations

This folder contains legacy migration files that have been superseded by numbered migrations.

## Archived Files

### `add_invoice_fields.sql`
- **Status:** Superseded by `006_fix_invoice_type_enum.sql`
- **Reason:** Original attempt at adding invoice fields, replaced by numbered migration with proper enum handling

### `add_invoice_fields_simple.sql`
- **Status:** Superseded by `006_fix_invoice_type_enum.sql`
- **Reason:** Simplified version, replaced by idempotent numbered migration

### `check_locks.sql`
- **Status:** Debug utility
- **Reason:** Temporary debugging script for checking database locks during migration issues

## Migration History

All active migrations are now numbered sequentially in the parent directory:
- `003_add_payments.sql` - Payment tracking fields
- `004_add_dynamic_services.sql` - Dynamic services system
- `005_add_performance_indexes.sql` - Database indexes for performance
- `006_fix_invoice_type_enum.sql` - Invoice type enum (replaces archived files)
- `007_fix_soft_delete_boolean.sql` - Boolean conversion for soft deletes

These archived files are kept for reference but should not be executed.
