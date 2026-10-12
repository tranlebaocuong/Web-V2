import { Pool } from "pg";
import bcrypt from "bcryptjs";

const DEFAULT_ADMIN_EMAIL = "admin@sentrang.gdpt.vn";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || "SenTrang@Admin2026!";

async function seedAdminForDb(dbName: string) {
  console.log(`--- Seeding Admin User into ${dbName} ---`);
  const pool = new Pool({
    connectionString: `postgresql://postgres:postgres@127.0.0.1:5434/${dbName}?sslmode=disable`,
  });

  try {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    const res = await pool.query(
      `
      INSERT INTO users (id, email, password_hash, role, is_active, created_at)
      VALUES (gen_random_uuid(), $1, $2, 'admin', true, NOW())
      ON CONFLICT (email) 
      DO UPDATE SET password_hash = $2, is_active = true
      RETURNING id, email, role, is_active;
      `,
      [DEFAULT_ADMIN_EMAIL, passwordHash]
    );

    console.log(`✓ Admin user ready in ${dbName}:`, res.rows[0]);
  } catch (err) {
    console.error(`✗ Error seeding admin in ${dbName}:`, err);
  } finally {
    await pool.end();
  }
}

async function main() {
  await seedAdminForDb("sentrang");
  await seedAdminForDb("sentrang_test");
  console.log("✓ Seeding admin completed for both databases!");
}

main().catch(console.error);
