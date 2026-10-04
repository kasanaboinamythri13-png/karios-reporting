import { auth } from '../config/firebase.js';
import { query } from '../config/db.js';

/**
 * Account sync utility.
 * Pass accounts dynamically via ACCOUNTS_SYNC_JSON env variable:
 * e.g. ACCOUNTS_SYNC_JSON='[{"email":"...","password":"...","role":"...","department":"...","title":"..."}]'
 */
const accounts = process.env.ACCOUNTS_SYNC_JSON
  ? JSON.parse(process.env.ACCOUNTS_SYNC_JSON)
  : [];

async function run() {
  if (accounts.length === 0) {
    console.log('No accounts configured in ACCOUNTS_SYNC_JSON environment variable.');
    console.log('To sync accounts, provide a JSON array via ACCOUNTS_SYNC_JSON.');
    process.exit(0);
  }

  for (const acc of accounts) {
    let fbUser;
    try {
      fbUser = await auth.getUserByEmail(acc.email);
      console.log('Firebase user exists, updating password:', acc.email);
      await auth.updateUser(fbUser.uid, { password: acc.password });
    } catch (e) {
      fbUser = await auth.createUser({
        email: acc.email,
        password: acc.password,
        displayName: acc.title,
      });
      console.log('Created Firebase user:', acc.email, fbUser.uid);
    }

    await query(
      'UPDATE users SET email = $1, firebase_uid = $2 WHERE role = $3',
      [acc.email, fbUser.uid, acc.role]
    );
    console.log('Synced DB for:', acc.role);
  }

  const list = await auth.listUsers();
  console.log('All Firebase users now:');
  for (const u of list.users) {
    console.log(` - ${u.email} (UID: ${u.uid})`);
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
