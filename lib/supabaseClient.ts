// Import directly from supabase-js instead of ssr
import { createClient } from '@supabase/supabase-js'

// Create and export the Supabase client with hardcoded values for now
// These values will be replaced by the environment variables at runtime
export const supabase = createClient(
  'https://untfuunvtokhcdqctuzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudGZ1dW52dG9raGNkcWN0dXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2OTI4MDEsImV4cCI6MjAyODI2ODgwMX0.5DJlkVSXI7O-wxvh77C4GmW9_S7-Bf3dT1NjNQrpdbU'
)
