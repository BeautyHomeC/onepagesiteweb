const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?(.*?)"?(?:\n|$)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY="?(.*?)"?(?:\n|$)/);

const supabaseUrl = urlMatch ? urlMatch[1] : null;
const supabaseKey = keyMatch ? keyMatch[1] : null;

if (!supabaseUrl || !supabaseKey) {
  console.error("Credentials not found in .env.local");
  process.exit(1);
}

const headers = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function seed() {
  console.log("Seeding formations...");
  
  const formationsRes = await fetch(`${supabaseUrl}/rest/v1/formations`, {
    method: 'POST',
    headers,
    body: JSON.stringify([
      { titre: 'Masterclass Perfectionnement', description: 'Maîtrisez les techniques.', prix: 450, duree: '2 Jours' },
      { titre: 'Art & Esthétique', description: 'L\'art du minimalisme.', prix: 250, duree: '1 Jour' }
    ])
  });

  const formations = await formationsRes.json();
  if (formations.error || !Array.isArray(formations)) {
    console.error("Error inserting formations:", formations);
    return;
  }

  console.log("Seeding sessions...");
  const f1 = formations[0].id;
  const f2 = formations[1].id;

  const sessionsRes = await fetch(`${supabaseUrl}/rest/v1/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify([
      { formation_id: f1, date_debut: '2026-06-12', date_fin: '2026-06-13', places_disponibles: 4 },
      { formation_id: f2, date_debut: '2026-06-20', date_fin: '2026-06-20', places_disponibles: 2 }
    ])
  });

  const sessions = await sessionsRes.json();
  if (sessions.error) {
    console.error("Error inserting sessions:", sessions);
    return;
  }

  console.log("Seeding complete! You can now test the booking tunnel.");
}

seed();
