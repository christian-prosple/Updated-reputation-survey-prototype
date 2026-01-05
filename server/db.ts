// No real database connection needed for this prototype
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Export dummy objects to satisfy imports, but they won't be used
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy" 
});
export const db = drizzle(pool, { schema });
