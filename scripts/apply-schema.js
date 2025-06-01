const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dglezauqqxybwiyfiriz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY is required. Please set it in your .env file.');
  process.exit(1);
}

// Initialize Supabase client with the service key for admin privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applySchemaSql() {
  try {
    // Read schema SQL file
    const schemaPath = path.join(__dirname, '..', 'docs', 'database_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split the SQL into separate commands
    // This is a simple approach and might not work for all SQL files
    const commands = schemaSql
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .split(';')
      .filter(cmd => cmd.trim() !== '');

    console.log(`Found ${commands.length} SQL commands to execute`);

    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim() + ';';
      console.log(`Executing command ${i + 1}/${commands.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error(`Error executing command ${i + 1}:`, error.message);
          console.log('Command:', command);
        }
      } catch (cmdError) {
        console.error(`Error executing command ${i + 1}:`, cmdError.message);
        console.log('Command:', command);
      }
    }

    console.log('Schema applied successfully!');
  } catch (error) {
    console.error('Error applying schema:', error.message);
    process.exit(1);
  }
}

// Create the exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  try {
    console.log('Creating exec_sql function...');
    
    const { error } = await supabase.rpc('exec_sql', { 
      sql: `
        CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (error) {
      // If the function doesn't exist yet, create it directly
      const { error: directError } = await supabase.sql(`
        CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      
      if (directError) {
        console.error('Error creating exec_sql function:', directError.message);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating exec_sql function:', error.message);
    return false;
  }
}

async function main() {
  console.log('Connecting to Supabase...');
  
  // First create the exec_sql function
  const success = await createExecSqlFunction();
  
  if (success) {
    // Then apply the schema
    await applySchemaSql();
  } else {
    console.error('Failed to create exec_sql function. Cannot apply schema.');
    process.exit(1);
  }
}

main();
