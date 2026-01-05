import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We're not using a real DB, but defining the schema structure helps with types
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
});

// Basic schemas for type inference if needed
export const insertUserSchema = createInsertSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Shared types for the survey (frontend-only logic, but good to have types)
export const RoleEnum = z.enum([
  "Business, Commerce & Management",
  "Finance and Banking",
  "Law"
]);

export type Role = z.infer<typeof RoleEnum>;

export interface Company {
  name: string;
  role: Role;
}
