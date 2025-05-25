# Supabase Schema Guidelines

## Overview

All database schema creation and queries must align with the existing Supabase structure. Reuse and reference existing tables where appropriate. Avoid duplicates, keep field names consistent, and structure the DB for scale and clarity.

## Key Guidelines

1. **Reuse Existing Tables**: If a table already exists (e.g. `users`, `tasks`, `invoices`, `quotes`, `referrals`), reuse and extend it as needed — do not duplicate or rename.

2. **Follow Naming Conventions**:
   - Use `snake_case` for table and column names
   - Use consistent naming patterns for similar concepts
   - Prefix related tables appropriately (e.g., `user_settings`, `user_preferences`)

3. **Data Types and Constraints**:
   - Use proper PostgreSQL data types
   - Add appropriate constraints (NOT NULL, UNIQUE, etc.)
   - Set up foreign key relationships correctly
   - Include default values where it makes sense

4. **Schema Organization**:
   - Avoid redundant structures
   - If a similar concept already exists, use good judgment to consolidate
   - Create a clean, maintainable schema design

5. **Performance Considerations**:
   - Add indexes to frequently queried columns
   - Consider query patterns when designing tables
   - Structure data for efficient joins

## Before Creating New Tables or Fields

Always:
1. Check existing tables in the database
2. Review the codebase for similar data structures
3. Align with existing patterns and conventions
4. Add only what is necessary - avoid premature optimization

## Example

**Instead of this:**
```sql
-- Bad: Creating a new table when a similar one exists
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES users(id),
  street TEXT,
  city TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Do this:**
```sql
-- Good: Reusing and extending existing patterns
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for improved query performance
CREATE INDEX addresses_user_id_idx ON addresses(user_id);
```

Remember: This Supabase database will power the full application — prioritize clarity, maintainability, and a clean schema design. 