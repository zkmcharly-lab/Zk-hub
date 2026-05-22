import { createClient } from '@supabase/supabase-js';

const url = 'https://uoeqhmcmodlaudzuzkaa.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXFobWNtb2RsYXVkenV6a2FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIwNzk1OSwiZXhwIjoyMDk0NzgzOTU5fQ.Xr7s_IAPoaiHx4XtbQrdIEZP0ZIKORRIdArWaJAzYBg';
const supabase = createClient(url, key);

const tables = ['contact_notes', 'contact_folders', 'contact_lists', 'contact_list_members', 'reminders'];

async function checkTables() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table} error:`, error.message);
    } else {
      console.log(`Table ${table} exists (Data length: ${data?.length})`);
    }
  }
}

checkTables();
