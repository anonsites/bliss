const fs = require('fs');
const path = '.env.local';
const env = {};
for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) {
    env[m[1]] = m[2].trim().replace(/^['\"]/,'').replace(/['\"]$/,'');
  }
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
fetch(`${url}/rest/v1/profiles?select=user_id,username,avatar_url&limit=10`, {
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  },
})
  .then(async (res) => {
    const text = await res.text();
    console.log('status', res.status);
    console.log(text);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
