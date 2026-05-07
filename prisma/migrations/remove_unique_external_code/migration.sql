-- AlterTable
-- Removed UNIQUE constraint on external_code to allow multiple NULL values
-- This prevents "Unique constraint failed" errors when importing orders without external_code

-- Drop the old unique constraint
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_external_code_key";

-- The external_code column remains as optional String field
-- Uniqueness is now enforced at the application layer
