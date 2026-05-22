require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log("Comprobando workspaces...");
  const { data: workspaces, error: wErr } = await supabase.from('workspaces').select('id, nombre');
  if (wErr) console.error("Error workspaces:", wErr);
  else console.log(workspaces);

  console.log("\nComprobando usuarios...");
  const { data: users, error: uErr } = await supabase.from('users').select('id, email');
  if (uErr) console.error("Error users:", uErr);
  else console.log(users);

  console.log("\nComprobando contactos...");
  const { data: contacts, error: cErr } = await supabase.from('contacts').select('id, workspace_id').limit(5);
  if (cErr) console.error("Error contacts:", cErr);
  else {
    console.log(`Total contactos devueltos (limit 5): ${contacts.length}`);
    if (contacts.length > 0) {
      console.log("Workspace ID del primer contacto:", contacts[0].workspace_id);
    }
  }
}

checkData();
