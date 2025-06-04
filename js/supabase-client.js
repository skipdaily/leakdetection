/**
 * Supabase Client
 * This file initializes the Supabase client for use throughout the application
 */

// Initialize the Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// Create a single supabase client for interacting with your database
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
