import { auth } from '../config/firebase.js';
import { query } from '../config/db.js';

const accounts = [
  { email: 'developer.head@karios.com', password: 'Developer@123', role: 'DEVELOPER_HEAD', department: 'DEVELOPMENT', title: 'Developer Head' },
  { email: 'sales.head@karios.com',     password: 'Sales@123',     role: 'SALES_HEAD',     department: 'SALES',       title: 'Sales Head' },
  { email: 'marketing.head@karios.com', password: 'Marketing@123', role: 'MARKETING_HEAD', department: 'MARKETING',   title: 'Marketing Head' },
  { email: 'finance.head@karios.com',   password: 'Finance@123',   role: 'FINANCE_HEAD',   department: 'FINANCE',     title: 'Finance Head' },
];

async function run() {
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
