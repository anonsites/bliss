import re, pathlib, urllib.request, json
env = {}
for line in pathlib.Path('.env.local').read_text(encoding='utf-8').splitlines():
    m = re.match(r'^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$', line)
    if m:
        env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
url = env['NEXT_PUBLIC_SUPABASE_URL']
key = env['SUPABASE_SERVICE_ROLE_KEY']
req = urllib.request.Request(url + '/rest/v1/profiles?select=user_id,username,avatar_url&limit=10', headers={'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
data = urllib.request.urlopen(req).read().decode()
print(data)
