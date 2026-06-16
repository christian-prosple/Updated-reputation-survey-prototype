import { eq, desc, and, sql, asc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  surveyConfigs,
  surveyResponses,
  taxonomies,
  taxonomyImports,
  appSettings,
  careerPathEmployers,
  type User,
  type InsertUser,
  type SurveyConfig,
  type InsertSurveyConfig,
  type SurveyResponse,
  type InsertSurveyResponse,
  type Taxonomy,
  type InsertTaxonomy,
  type TaxonomyImport,
  type InsertTaxonomyImport,
  type ResponseStatus,
  type CareerPathEmployer,
  type InsertCareerPathEmployer,
} from "@shared/schema";

// Filters for querying responses. careerPath matches against the employer
// exposure recorded in metadata; email is a case-insensitive substring match.
export interface ResponseFilter {
  status?: ResponseStatus;
  email?: string;
  careerPath?: string;
  startDate?: Date;
  endDate?: Date;
}
export interface ResponseQuery extends ResponseFilter {
  limit?: number;
  offset?: number;
}

export interface IStorage {
  // Legacy users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Survey configs
  listSurveyConfigs(): Promise<SurveyConfig[]>;
  getSurveyConfig(id: number): Promise<SurveyConfig | undefined>;
  getActiveSurveyConfig(): Promise<SurveyConfig | undefined>;
  createSurveyConfig(config: InsertSurveyConfig): Promise<SurveyConfig>;
  updateSurveyConfig(id: number, patch: Partial<InsertSurveyConfig>): Promise<SurveyConfig | undefined>;
  activateSurveyConfig(id: number): Promise<SurveyConfig | undefined>;
  deleteSurveyConfig(id: number): Promise<void>;

  // Responses
  listResponses(opts?: ResponseQuery): Promise<SurveyResponse[]>;
  countResponses(filter?: ResponseFilter): Promise<number>;
  getResponse(id: number): Promise<SurveyResponse | undefined>;
  getResponseBySession(sessionId: string): Promise<SurveyResponse | undefined>;
  createResponse(resp: InsertSurveyResponse): Promise<SurveyResponse>;
  updateResponseBySession(sessionId: string, patch: Partial<InsertSurveyResponse> & { completedAt?: Date | null }): Promise<SurveyResponse | undefined>;
  deleteResponse(id: number): Promise<void>;

  // Taxonomies
  listTaxonomies(): Promise<Taxonomy[]>;
  getTaxonomy(id: number): Promise<Taxonomy | undefined>;
  getTaxonomyByType(type: string): Promise<Taxonomy | undefined>;
  createTaxonomy(tax: InsertTaxonomy): Promise<Taxonomy>;
  updateTaxonomy(id: number, patch: Partial<InsertTaxonomy>): Promise<Taxonomy | undefined>;
  deleteTaxonomy(id: number): Promise<void>;

  // Taxonomy imports
  listTaxonomyImports(taxonomyId?: number): Promise<TaxonomyImport[]>;
  getTaxonomyImport(id: number): Promise<TaxonomyImport | undefined>;
  createTaxonomyImport(imp: InsertTaxonomyImport): Promise<TaxonomyImport>;
  updateTaxonomyImport(id: number, patch: Partial<InsertTaxonomyImport>): Promise<TaxonomyImport | undefined>;

  // Settings
  getSetting<T = Record<string, unknown>>(key: string): Promise<T | undefined>;
  setSetting(key: string, value: Record<string, unknown>): Promise<void>;

  // Career path employers
  listCareerPaths(): Promise<string[]>;
  listCareerPathEmployers(careerPath?: string): Promise<CareerPathEmployer[]>;
  createCareerPathEmployer(data: InsertCareerPathEmployer): Promise<CareerPathEmployer>;
  bulkSeedCareerPathEmployers(rows: InsertCareerPathEmployer[], mode: "replace" | "merge"): Promise<void>;
  updateCareerPathEmployer(id: number, patch: Partial<InsertCareerPathEmployer>): Promise<CareerPathEmployer | undefined>;
  deleteCareerPathEmployer(id: number): Promise<void>;
}

export class DbStorage implements IStorage {
  // --- Users ---
  async getUser(id: number): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.username, username));
    return row;
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const [row] = await db.insert(users).values(insertUser).returning();
    return row;
  }

  // --- Survey configs ---
  async listSurveyConfigs(): Promise<SurveyConfig[]> {
    return db.select().from(surveyConfigs).orderBy(desc(surveyConfigs.updatedAt));
  }
  async getSurveyConfig(id: number): Promise<SurveyConfig | undefined> {
    const [row] = await db.select().from(surveyConfigs).where(eq(surveyConfigs.id, id));
    return row;
  }
  async getActiveSurveyConfig(): Promise<SurveyConfig | undefined> {
    const [row] = await db
      .select()
      .from(surveyConfigs)
      .where(eq(surveyConfigs.status, "active"))
      .orderBy(desc(surveyConfigs.updatedAt));
    return row;
  }
  async createSurveyConfig(config: InsertSurveyConfig): Promise<SurveyConfig> {
    const [row] = await db.insert(surveyConfigs).values(config as typeof surveyConfigs.$inferInsert).returning();
    return row;
  }
  async updateSurveyConfig(id: number, patch: Partial<InsertSurveyConfig>): Promise<SurveyConfig | undefined> {
    const [row] = await db
      .update(surveyConfigs)
      .set({ ...patch, updatedAt: new Date() } as Partial<typeof surveyConfigs.$inferInsert>)
      .where(eq(surveyConfigs.id, id))
      .returning();
    return row;
  }
  async activateSurveyConfig(id: number): Promise<SurveyConfig | undefined> {
    // Only one active config at a time.
    await db.update(surveyConfigs).set({ status: "archived" }).where(eq(surveyConfigs.status, "active"));
    const [row] = await db
      .update(surveyConfigs)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(surveyConfigs.id, id))
      .returning();
    return row;
  }
  async deleteSurveyConfig(id: number): Promise<void> {
    await db.delete(surveyConfigs).where(eq(surveyConfigs.id, id));
  }

  // --- Responses ---
  private buildResponseWhere(f?: ResponseFilter) {
    const clauses = [] as any[];
    if (f?.status) clauses.push(eq(surveyResponses.status, f.status));
    if (f?.email) clauses.push(sql`${surveyResponses.respondentEmail} ILIKE ${"%" + f.email + "%"}`);
    if (f?.startDate) clauses.push(sql`${surveyResponses.startedAt} >= ${f.startDate}`);
    if (f?.endDate) clauses.push(sql`${surveyResponses.startedAt} <= ${f.endDate}`);
    if (f?.careerPath) {
      // careerPaths is a jsonb array inside metadata.employerExposure.
      clauses.push(
        sql`${surveyResponses.metadata}->'employerExposure'->'careerPaths' @> ${JSON.stringify([f.careerPath])}::jsonb`,
      );
    }
    return clauses.length ? and(...clauses) : undefined;
  }
  async listResponses(opts?: ResponseQuery): Promise<SurveyResponse[]> {
    const limit = opts?.limit ?? 100;
    const offset = opts?.offset ?? 0;
    const where = this.buildResponseWhere(opts);
    const q = db.select().from(surveyResponses);
    return (where ? q.where(where) : q)
      .orderBy(desc(surveyResponses.updatedAt))
      .limit(limit)
      .offset(offset);
  }
  async countResponses(filter?: ResponseFilter): Promise<number> {
    const where = this.buildResponseWhere(filter);
    const base = db.select({ count: sql<number>`count(*)::int` }).from(surveyResponses);
    const [row] = where ? await base.where(where) : await base;
    return row?.count ?? 0;
  }
  async getResponse(id: number): Promise<SurveyResponse | undefined> {
    const [row] = await db.select().from(surveyResponses).where(eq(surveyResponses.id, id));
    return row;
  }
  async getResponseBySession(sessionId: string): Promise<SurveyResponse | undefined> {
    const [row] = await db.select().from(surveyResponses).where(eq(surveyResponses.sessionId, sessionId));
    return row;
  }
  async createResponse(resp: InsertSurveyResponse): Promise<SurveyResponse> {
    const [row] = await db.insert(surveyResponses).values(resp as typeof surveyResponses.$inferInsert).returning();
    return row;
  }
  async updateResponseBySession(
    sessionId: string,
    patch: Partial<InsertSurveyResponse> & { completedAt?: Date | null },
  ): Promise<SurveyResponse | undefined> {
    const [row] = await db
      .update(surveyResponses)
      .set({ ...patch, updatedAt: new Date() } as Partial<typeof surveyResponses.$inferInsert>)
      .where(eq(surveyResponses.sessionId, sessionId))
      .returning();
    return row;
  }
  async deleteResponse(id: number): Promise<void> {
    await db.delete(surveyResponses).where(eq(surveyResponses.id, id));
  }

  // --- Taxonomies ---
  async listTaxonomies(): Promise<Taxonomy[]> {
    return db.select().from(taxonomies).orderBy(desc(taxonomies.updatedAt));
  }
  async getTaxonomy(id: number): Promise<Taxonomy | undefined> {
    const [row] = await db.select().from(taxonomies).where(eq(taxonomies.id, id));
    return row;
  }
  async getTaxonomyByType(type: string): Promise<Taxonomy | undefined> {
    const [row] = await db
      .select()
      .from(taxonomies)
      .where(eq(taxonomies.type, type))
      .orderBy(desc(taxonomies.updatedAt));
    return row;
  }
  async createTaxonomy(tax: InsertTaxonomy): Promise<Taxonomy> {
    const [row] = await db.insert(taxonomies).values(tax as typeof taxonomies.$inferInsert).returning();
    return row;
  }
  async updateTaxonomy(id: number, patch: Partial<InsertTaxonomy>): Promise<Taxonomy | undefined> {
    const [row] = await db
      .update(taxonomies)
      .set({ ...patch, updatedAt: new Date() } as Partial<typeof taxonomies.$inferInsert>)
      .where(eq(taxonomies.id, id))
      .returning();
    return row;
  }
  async deleteTaxonomy(id: number): Promise<void> {
    await db.delete(taxonomies).where(eq(taxonomies.id, id));
  }

  // --- Taxonomy imports ---
  async listTaxonomyImports(taxonomyId?: number): Promise<TaxonomyImport[]> {
    if (taxonomyId !== undefined) {
      return db
        .select()
        .from(taxonomyImports)
        .where(eq(taxonomyImports.taxonomyId, taxonomyId))
        .orderBy(desc(taxonomyImports.createdAt));
    }
    return db.select().from(taxonomyImports).orderBy(desc(taxonomyImports.createdAt));
  }
  async getTaxonomyImport(id: number): Promise<TaxonomyImport | undefined> {
    const [row] = await db.select().from(taxonomyImports).where(eq(taxonomyImports.id, id));
    return row;
  }
  async createTaxonomyImport(imp: InsertTaxonomyImport): Promise<TaxonomyImport> {
    const [row] = await db.insert(taxonomyImports).values(imp as typeof taxonomyImports.$inferInsert).returning();
    return row;
  }
  async updateTaxonomyImport(id: number, patch: Partial<InsertTaxonomyImport>): Promise<TaxonomyImport | undefined> {
    const [row] = await db
      .update(taxonomyImports)
      .set(patch as Partial<typeof taxonomyImports.$inferInsert>)
      .where(eq(taxonomyImports.id, id))
      .returning();
    return row;
  }

  // --- Settings ---
  async getSetting<T = Record<string, unknown>>(key: string): Promise<T | undefined> {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return row?.value as T | undefined;
  }
  async setSetting(key: string, value: Record<string, unknown>): Promise<void> {
    await db
      .insert(appSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
  }

  // --- Career path employers ---
  async listCareerPaths(): Promise<string[]> {
    const rows = await db
      .selectDistinct({ careerPath: careerPathEmployers.careerPath })
      .from(careerPathEmployers)
      .orderBy(asc(careerPathEmployers.careerPath));
    return rows.map((r) => r.careerPath);
  }

  async listCareerPathEmployers(careerPath?: string): Promise<CareerPathEmployer[]> {
    if (careerPath) {
      return db
        .select()
        .from(careerPathEmployers)
        .where(eq(careerPathEmployers.careerPath, careerPath))
        .orderBy(asc(careerPathEmployers.rank));
    }
    return db.select().from(careerPathEmployers).orderBy(asc(careerPathEmployers.careerPath), asc(careerPathEmployers.rank));
  }

  async createCareerPathEmployer(data: InsertCareerPathEmployer): Promise<CareerPathEmployer> {
    const [row] = await db.insert(careerPathEmployers).values(data).returning();
    return row;
  }

  async bulkSeedCareerPathEmployers(rows: InsertCareerPathEmployer[], mode: "replace" | "merge"): Promise<void> {
    if (rows.length === 0) return;
    if (mode === "replace") {
      await db.delete(careerPathEmployers);
      const CHUNK = 500;
      for (let i = 0; i < rows.length; i += CHUNK) {
        await db.insert(careerPathEmployers).values(rows.slice(i, i + CHUNK));
      }
    } else {
      // Upsert in chunks — conflict on (careerPath, employerName)
      const CHUNK = 500;
      for (let i = 0; i < rows.length; i += CHUNK) {
        await db
          .insert(careerPathEmployers)
          .values(rows.slice(i, i + CHUNK))
          .onConflictDoUpdate({
            target: [careerPathEmployers.careerPath, careerPathEmployers.employerName],
            set: { rank: sql`excluded.rank`, isCore: sql`excluded.is_core`, active: sql`excluded.active` },
          });
      }
    }
  }

  async updateCareerPathEmployer(id: number, patch: Partial<InsertCareerPathEmployer>): Promise<CareerPathEmployer | undefined> {
    const [row] = await db
      .update(careerPathEmployers)
      .set(patch)
      .where(eq(careerPathEmployers.id, id))
      .returning();
    return row;
  }

  async deleteCareerPathEmployer(id: number): Promise<void> {
    await db.delete(careerPathEmployers).where(eq(careerPathEmployers.id, id));
  }
}

export const storage = new DbStorage();
