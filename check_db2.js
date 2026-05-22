const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log("=== COMPROBANDO WORKSPACES ===");
  const { data: workspaces, error: wErr } = await supabase.from('workspaces').select('id, nombre, owner_id').order('created_at', { ascending: true });
  if (wErr) console.error("Error workspaces:", wErr);
  else console.log(workspaces);

  console.log("\n=== COMPROBANDO USUARIOS AUTH ===");
  const { data: authUsers, error: auErr } = await supabase.auth.admin.listUsers();
  if (auErr) console.error("Error auth.users:", auErr);
  else console.log(authUsers.users.map(u => ({ id: u.id, email: u.email })));

  console.log("\n=== COMPROBANDO USUARIOS PUBLIC ===");
  const { data: users, error: uErr } = await supabase.from('users').select('id, email, nombre');
  if (uErr) console.error("Error users:", uErr);
  else console.log(users);

  console.log("\n=== COMPROBANDO WORKSPACE_USERS ===");
  const { data: wu, error: wuErr } = await supabase.from('workspace_users').select('*');
  if (wuErr) console.error("Error workspace_users:", wuErr);
  else console.log(wu);

  console.log("\n=== COMPROBANDO CONTACTOS ===");
  const { data: contacts, error: cErr } = await supabase.from('contacts').select('id, workspace_id').limit(2);
  if (cErr) console.error("Error contacts:", cErr);
  else {
    console.log(`Contactos totales devueltos: ${contacts.length}`);
    if (contacts.length > 0) {
      console.log("Workspace ID del primer contacto:", contacts[0].workspace_id);
    }
  }
}

checkData();
