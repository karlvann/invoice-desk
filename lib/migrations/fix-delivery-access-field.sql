-- GORDON'S FIX: Delivery access field was too small (VARCHAR(50))
-- Some donkey was putting full addresses in there instead of dropdown values!
-- This migration increases the field size to handle both proper dropdown values 
-- AND accidental address entries without breaking

-- Increase delivery_access field size from VARCHAR(50) to VARCHAR(255)
ALTER TABLE quotes 
ALTER COLUMN delivery_access TYPE VARCHAR(255);

-- Add a comment to document what this field SHOULD contain
COMMENT ON COLUMN quotes.delivery_access IS 'Delivery access type (e.g., Ground floor, Lift access, Stairs). Should be a dropdown value, not a full address!';