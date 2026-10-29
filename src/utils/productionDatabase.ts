import crypto from "crypto";
import fs from "fs";
import path from "path";
import pg from "pg";
import { CareerAttemptServerRecord, CareerAssessmentStore } from "./careerServerService";

const { Pool } = pg;

export interface StoredStudentRecord {
  studentId: string;
  token: string;
  state: unknown;
  updatedAt: string;
}

/**
 * Computes a deterministic 32-byte SHA-256 digest of a token so `crypto.timingSafeEqual`
 * always compares fixed-length buffers without leaking token length.
 */
export function hashTokenDigest(token: string): Buffer {
  return crypto.createHash("sha256").update(token, "utf8").digest();
}

/**
 * Performs constant-time comparison of two tokens using SHA-256 digests.
 */
export function timingSafeTokenMatch(
  expectedToken: string | undefined | null,
  candidateToken: string | undefined | null
): boolean {
  if (
    !expectedToken ||
    !candidateToken ||
    typeof expectedToken !== "string" ||
    typeof candidateToken !== "string"
  ) {
    return false;
  }
  const expectedTrimmed = expectedToken.trim();
  const candidateTrimmed = candidateToken.trim();
  if (!expectedTrimmed || !candidateTrimmed) {
    return false;
  }
  const digestA = hashTokenDigest(expectedTrimmed);
  const digestB = hashTokenDigest(candidateTrimmed);
  return crypto.timingSafeEqual(digestA, digestB);
}

/**
 * Validates that a studentId is a safe, bounded identifier (alphanumeric, hyphen, underscore, colon, dot).
 */
export function isValidStudentId(studentId: unknown): studentId is string {
  if (typeof studentId !== "string") return false;
  const trimmed = studentId.trim();
  if (trimmed.length < 2 || trimmed.length > 128) return false;
  return /^[a-zA-Z0-9._:-]+$/.test(trimmed);
}

/**
 * Writes JSON atomically to disk via a temporary file + rename so concurrent requests
 * or unexpected process termination never leave a half-written corrupted JSON file.
 */
export function writeJsonFileAtomically(
  targetFilePath: string,
  data: unknown
): void {
  const dir = path.dirname(targetFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempFilePath = `${targetFilePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempFilePath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempFilePath, targetFilePath);
}

/**
 * Creates a PostgreSQL connection pool when `DATABASE_URL` is configured.
 * Supports Render PostgreSQL, Neon, Supabase, Railway, and standard PostgreSQL instances.
 */
export function createPostgresPoolFromEnv(): pg.Pool | null {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (
    !connectionString ||
    connectionString === "MY_DATABASE_URL" ||
    connectionString.startsWith("postgresql://USER:PASSWORD@")
  ) {
    return null;
  }

  const disableSsl =
    process.env.DATABASE_SSL === "false" ||
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: disableSsl ? false : { rejectUnauthorized: false },
  });
}

/**
 * Persistent store for student workspace profiles, study progress, and session tokens.
 * Supports PostgreSQL (`DATABASE_URL`) in production with automatic schema creation,
 * plus atomic JSON disk persistence (`DATA_DIR`) as a zero-config fallback.
 */
export class StudentRecordStore {
  private records = new Map<string, StoredStudentRecord>();
  private filePath: string | null;
  private pgPool: pg.Pool | null = null;

  constructor(filePath: string | null = null) {
    this.filePath = filePath;
    if (this.filePath) {
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    if (!this.filePath) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf8");
        const parsed = JSON.parse(raw) as Record<string, StoredStudentRecord>;
        if (parsed && typeof parsed === "object") {
          for (const [id, rec] of Object.entries(parsed)) {
            if (rec && typeof rec.studentId === "string" && rec.token) {
              this.records.set(id, rec);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load student records from disk:", err);
    }
  }

  private persistToDisk(): void {
    if (!this.filePath) return;
    try {
      const serializable: Record<string, StoredStudentRecord> = {};
      for (const [id, rec] of this.records.entries()) {
        serializable[id] = rec;
      }
      writeJsonFileAtomically(this.filePath, serializable);
    } catch (err) {
      console.error("Failed to persist student records to disk:", err);
    }
  }

  public attachPostgresPool(pool: pg.Pool | null): void {
    this.pgPool = pool;
  }

  public async initializePostgresSchemaAndHydrate(): Promise<boolean> {
    if (!this.pgPool) return false;
    try {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS vidyakshara_student_records (
          student_id TEXT PRIMARY KEY,
          token TEXT NOT NULL,
          state_json JSONB,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const res = await this.pgPool.query<{
        student_id: string;
        token: string;
        state_json: unknown;
        updated_at: Date | string;
      }>(`
        SELECT student_id, token, state_json, updated_at
        FROM vidyakshara_student_records;
      `);

      for (const row of res.rows) {
        this.records.set(row.student_id, {
          studentId: row.student_id,
          token: row.token,
          state: row.state_json,
          updatedAt:
            row.updated_at instanceof Date
              ? row.updated_at.toISOString()
              : String(row.updated_at),
        });
      }
      return true;
    } catch (err) {
      console.error(
        "PostgreSQL initialization for student records failed (falling back to local store):",
        err
      );
      return false;
    }
  }

  private persistRecordToPostgresAsync(record: StoredStudentRecord): void {
    if (!this.pgPool) return;
    void this.pgPool
      .query(
        `
        INSERT INTO vidyakshara_student_records (student_id, token, state_json, updated_at)
        VALUES ($1, $2, $3::jsonb, $4::timestamptz)
        ON CONFLICT (student_id) DO UPDATE SET
          token = EXCLUDED.token,
          state_json = EXCLUDED.state_json,
          updated_at = EXCLUDED.updated_at;
      `,
        [
          record.studentId,
          record.token,
          JSON.stringify(record.state ?? null),
          record.updatedAt,
        ]
      )
      .catch((err) => {
        console.error("Failed to upsert student record in PostgreSQL:", err);
      });
  }

  public createOrVerifySession(params: {
    studentId: unknown;
    existingToken?: unknown;
    initialState?: unknown;
  }): {
    status: "ok" | "invalid_student_id" | "forbidden";
    record?: StoredStudentRecord;
  } {
    if (!isValidStudentId(params.studentId)) {
      return { status: "invalid_student_id" };
    }

    const cleanId = params.studentId.trim();
    const existingRecord = this.records.get(cleanId);

    if (!existingRecord) {
      const newToken = crypto.randomBytes(24).toString("hex");
      const newRecord: StoredStudentRecord = {
        studentId: cleanId,
        token: newToken,
        state: params.initialState ?? null,
        updatedAt: new Date().toISOString(),
      };
      this.records.set(cleanId, newRecord);
      this.persistToDisk();
      this.persistRecordToPostgresAsync(newRecord);
      return { status: "ok", record: newRecord };
    }

    const candidateToken =
      typeof params.existingToken === "string" ? params.existingToken : null;
    if (!timingSafeTokenMatch(existingRecord.token, candidateToken)) {
      return { status: "forbidden" };
    }

    return { status: "ok", record: existingRecord };
  }

  public getAuthorizedState(
    studentId: unknown,
    candidateToken: string | null
  ): {
    status: "ok" | "not_found" | "forbidden";
    record?: StoredStudentRecord;
  } {
    if (!isValidStudentId(studentId)) {
      return { status: "not_found" };
    }
    const cleanId = studentId.trim();
    const record = this.records.get(cleanId);
    if (!record) {
      return { status: "not_found" };
    }
    if (!timingSafeTokenMatch(record.token, candidateToken)) {
      return { status: "forbidden" };
    }
    return { status: "ok", record };
  }

  public updateAuthorizedState(
    studentId: unknown,
    candidateToken: string | null,
    nextState: unknown
  ): {
    status: "ok" | "not_found" | "forbidden" | "invalid_state";
    record?: StoredStudentRecord;
  } {
    if (!isValidStudentId(studentId)) {
      return { status: "not_found" };
    }
    const cleanId = studentId.trim();
    const record = this.records.get(cleanId);
    if (!record) {
      return { status: "not_found" };
    }
    if (!timingSafeTokenMatch(record.token, candidateToken)) {
      return { status: "forbidden" };
    }
    if (!nextState || typeof nextState !== "object" || Array.isArray(nextState)) {
      return { status: "invalid_state" };
    }

    const updatedRecord: StoredStudentRecord = {
      ...record,
      state: nextState,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(cleanId, updatedRecord);
    this.persistToDisk();
    this.persistRecordToPostgresAsync(updatedRecord);

    return { status: "ok", record: updatedRecord };
  }

  public getRecordCount(): number {
    return this.records.size;
  }
}

/**
 * Initializes PostgreSQL persistence for `CareerAssessmentStore` when a `pg.Pool` is active.
 */
export async function initializeCareerStorePostgres(
  careerStore: CareerAssessmentStore,
  pool: pg.Pool | null
): Promise<boolean> {
  if (!pool) return false;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vidyakshara_career_attempts (
        attempt_id TEXT PRIMARY KEY,
        access_token TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        student_details JSONB,
        responses JSONB NOT NULL,
        completed_report JSONB
      );
    `);

    const res = await pool.query<{
      attempt_id: string;
      access_token: string;
      created_at: Date | string;
      updated_at: Date | string;
      completed_at: Date | string | null;
      expires_at: Date | string;
      revoked: boolean;
      student_details: CareerAttemptServerRecord["studentDetails"];
      responses: CareerAttemptServerRecord["responses"];
      completed_report: CareerAttemptServerRecord["completedReport"];
    }>(`
      SELECT
        attempt_id,
        access_token,
        created_at,
        updated_at,
        completed_at,
        expires_at,
        revoked,
        student_details,
        responses,
        completed_report
      FROM vidyakshara_career_attempts;
    `);

    const hydrated: CareerAttemptServerRecord[] = res.rows.map((row) => ({
      attemptId: row.attempt_id,
      accessToken: row.access_token,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at),
      completedAt: row.completed_at
        ? row.completed_at instanceof Date
          ? row.completed_at.toISOString()
          : String(row.completed_at)
        : undefined,
      expiresAt:
        row.expires_at instanceof Date
          ? row.expires_at.toISOString()
          : String(row.expires_at),
      revoked: Boolean(row.revoked),
      studentDetails: row.student_details || null,
      responses: row.responses || {},
      completedReport: row.completed_report || null,
    }));

    careerStore.hydrateRecords(hydrated);
    careerStore.setPersistenceHooks({
      onUpsert: (rec) => {
        void pool
          .query(
            `
            INSERT INTO vidyakshara_career_attempts (
              attempt_id,
              access_token,
              created_at,
              updated_at,
              completed_at,
              expires_at,
              revoked,
              student_details,
              responses,
              completed_report
            ) VALUES (
              $1, $2, $3::timestamptz, $4::timestamptz, $5::timestamptz, $6::timestamptz, $7, $8::jsonb, $9::jsonb, $10::jsonb
            )
            ON CONFLICT (attempt_id) DO UPDATE SET
              updated_at = EXCLUDED.updated_at,
              completed_at = EXCLUDED.completed_at,
              expires_at = EXCLUDED.expires_at,
              revoked = EXCLUDED.revoked,
              student_details = EXCLUDED.student_details,
              responses = EXCLUDED.responses,
              completed_report = EXCLUDED.completed_report;
          `,
            [
              rec.attemptId,
              rec.accessToken,
              rec.createdAt,
              rec.updatedAt,
              rec.completedAt ?? null,
              rec.expiresAt,
              Boolean(rec.revoked),
              JSON.stringify(rec.studentDetails ?? null),
              JSON.stringify(rec.responses ?? {}),
              JSON.stringify(rec.completedReport ?? null),
            ]
          )
          .catch((err) => {
            console.error("Failed to upsert career attempt in PostgreSQL:", err);
          });
      },
      onDelete: (attemptId) => {
        void pool
          .query(
            `DELETE FROM vidyakshara_career_attempts WHERE attempt_id = $1;`,
            [attemptId]
          )
          .catch((err) => {
            console.error("Failed to delete career attempt in PostgreSQL:", err);
          });
      },
    });

    return true;
  } catch (err) {
    console.error(
      "PostgreSQL initialization for career attempts failed (falling back to local store):",
      err
    );
    return false;
  }
}

/**
 * Simple in-memory sliding-window rate limiter per IP address and route bucket
 * to protect AI quota and prevent brute-force token enumeration in production.
 */
export class RateLimiter {
  private buckets = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: { windowMs: number; maxRequests: number }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  public check(key: string, now = Date.now()): {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
  } {
    const cutoff = now - this.windowMs;
    const existing = this.buckets.get(key) || [];
    const active = existing.filter((ts) => ts > cutoff);

    if (active.length >= this.maxRequests) {
      const oldest = active[0] || now;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + this.windowMs - now) / 1000)
      );
      this.buckets.set(key, active);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    active.push(now);
    this.buckets.set(key, active);

    // Periodic cleanup to prevent unbounded map growth
    if (this.buckets.size > 2000) {
      for (const [k, timestamps] of this.buckets.entries()) {
        if (timestamps.every((ts) => ts <= cutoff)) {
          this.buckets.delete(k);
        }
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - active.length),
      retryAfterSeconds: 0,
    };
  }
}
