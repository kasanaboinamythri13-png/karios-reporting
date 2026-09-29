// Copies the Firebase service-account key into backend/.env (never prints the secret).
//   npm run firebase:key -- "C:\Users\you\Downloads\karios-reporting-firebase-adminsdk-xxxx.json"
// Afterwards, move or delete the .json file — .env now holds what the server needs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const keyPath = process.argv[2];
if (!keyPath) {
  console.error('❌ Give the path to the downloaded .json key file, e.g.');
  console.error('   npm run firebase:key -- "C:\\Users\\you\\Downloads\\karios-reporting-firebase-adminsdk-xxxx.json"');
  process.exit(1);
}

let key;
try {
  key = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch (err) {
  console.error(`❌ Could not read the key file: ${err.message}`);
  process.exit(1);
}

if (key.type !== 'service_account' || !key.project_id || !key.client_email || !key.private_key) {
  console.error('❌ This is not a Firebase service-account key (Project settings → Service accounts → Generate new private key).');
  process.exit(1);
}

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
const values = {
  FIREBASE_PROJECT_ID: key.project_id,
  FIREBASE_CLIENT_EMAIL: key.client_email,
  FIREBASE_PRIVATE_KEY: `"${key.private_key.replace(/\n/g, '\\n')}"`,
};

let lines = existsSync(envPath) ? readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
for (const [name, value] of Object.entries(values)) {
  const i = lines.findIndex((line) => line.startsWith(`${name}=`));
  if (i >= 0) lines[i] = `${name}=${value}`;
  else lines.push(`${name}=${value}`);
}
writeFileSync(envPath, lines.join('\n'));

console.log('✅ backend/.env updated');
console.log(`   FIREBASE_PROJECT_ID   = ${key.project_id}`);
console.log(`   FIREBASE_CLIENT_EMAIL = ${key.client_email}`);
console.log('   FIREBASE_PRIVATE_KEY  = (saved, hidden)');
console.log('Next: restart the backend (npm run dev) and move/delete the .json file.');
