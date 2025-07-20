/*
  # Fix Policy Conflict and Duplicate Printer Models

  1. Policy Issues
    - Drop existing conflicting policy "Admin users can read own data" on admin_users table
    - Create new policy with different name to avoid conflicts

  2. Data Issues
    - Remove duplicate printer models (DeskJet 1112)
    - Ensure unique constraint on printer model names within same brand

  3. Query Issues
    - Fix queries that expect single results but get multiple rows
*/

-- Fix Policy Issue: Drop existing conflicting policy and recreate with different name
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;

-- Create new policy with different name
CREATE POLICY "Admin users can access own profile" ON admin_users
    FOR SELECT TO authenticated
    USING (auth.uid()::text = id::text);

-- Fix Duplicate Printer Models Issue
-- First, let's identify and remove duplicate DeskJet 1112 entries
DO $$
DECLARE
    hp_brand_id UUID;
    duplicate_count INTEGER;
    model_to_keep UUID;
BEGIN
    -- Get HP brand ID
    SELECT id INTO hp_brand_id FROM printer_brands WHERE name = 'HP';
    
    IF hp_brand_id IS NOT NULL THEN
        -- Count duplicates
        SELECT COUNT(*) INTO duplicate_count 
        FROM printer_models 
        WHERE brand_id = hp_brand_id AND name = 'DeskJet 1112' AND is_active = true;
        
        -- If there are duplicates, keep only one
        IF duplicate_count > 1 THEN
            -- Get the first model to keep (oldest one)
            SELECT id INTO model_to_keep 
            FROM printer_models 
            WHERE brand_id = hp_brand_id AND name = 'DeskJet 1112' AND is_active = true
            ORDER BY created_at ASC 
            LIMIT 1;
            
            -- Deactivate all other duplicates
            UPDATE printer_models 
            SET is_active = false, 
                name = name || '_duplicate_' || id::text
            WHERE brand_id = hp_brand_id 
              AND name = 'DeskJet 1112' 
              AND is_active = true 
              AND id != model_to_keep;
              
            RAISE NOTICE 'Removed % duplicate DeskJet 1112 models, kept model ID: %', duplicate_count - 1, model_to_keep;
        END IF;
    END IF;
END $$;

-- Add unique constraint to prevent future duplicates
-- First check if constraint already exists
DO $$
BEGIN
    -- Add unique constraint on (brand_id, name) for active models
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_active_printer_model_per_brand'
    ) THEN
        -- Create partial unique index for active models only
        CREATE UNIQUE INDEX unique_active_printer_model_per_brand 
        ON printer_models (brand_id, name) 
        WHERE is_active = true;
    END IF;
END $$;

-- Update any other potential duplicate models across all brands
DO $$
DECLARE
    brand_record RECORD;
    model_record RECORD;
    duplicate_count INTEGER;
    model_to_keep UUID;
BEGIN
    -- Loop through all brands
    FOR brand_record IN SELECT id, name FROM printer_brands WHERE is_active = true LOOP
        -- Check for duplicate model names within this brand
        FOR model_record IN 
            SELECT name, COUNT(*) as count
            FROM printer_models 
            WHERE brand_id = brand_record.id AND is_active = true
            GROUP BY name 
            HAVING COUNT(*) > 1
        LOOP
            -- Get the first model to keep
            SELECT id INTO model_to_keep 
            FROM printer_models 
            WHERE brand_id = brand_record.id 
              AND name = model_record.name 
              AND is_active = true
            ORDER BY created_at ASC 
            LIMIT 1;
            
            -- Deactivate duplicates
            UPDATE printer_models 
            SET is_active = false,
                name = name || '_duplicate_' || id::text
            WHERE brand_id = brand_record.id 
              AND name = model_record.name 
              AND is_active = true 
              AND id != model_to_keep;
              
            RAISE NOTICE 'Fixed duplicate model "% %", kept model ID: %', brand_record.name, model_record.name, model_to_keep;
        END LOOP;
    END LOOP;
END $$;

-- Verify the fixes
DO $$
DECLARE
    policy_count INTEGER;
    duplicate_count INTEGER;
BEGIN
    -- Check policy
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'admin_users' 
      AND policyname = 'Admin users can access own profile';
    
    IF policy_count > 0 THEN
        RAISE NOTICE 'Policy "Admin users can access own profile" created successfully';
    ELSE
        RAISE WARNING 'Policy creation may have failed';
    END IF;
    
    -- Check for remaining duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT brand_id, name, COUNT(*)
        FROM printer_models 
        WHERE is_active = true
        GROUP BY brand_id, name
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE 'All duplicate printer models have been resolved';
    ELSE
        RAISE WARNING 'There are still % duplicate printer model groups', duplicate_count;
    END IF;
END $$;