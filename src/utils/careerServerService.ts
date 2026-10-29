import crypto from "crypto";
import fs from "fs";
import path from "path";
import { CAREER_QUESTIONS } from "../data/careerAssessmentData";
import {
  CareerAssessmentResponses,
  CareerGuidanceReport,
  CareerStudentDetails,
} from "../types/career";
import {
  attachAINarrativeToReport,
  generateCareerGuidanceReport,
  sanitizeAssessmentResponses,
  validateStudentDetailsForm,
} from "./careerScoringEngine";

export interface CareerAttemptServerRecord {
  attemptId: string;
  accessToken: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt: string;
  revoked?: boolean;
  studentDetails: CareerStudentDetails | null;
  responses: CareerAssessmentResponses;
  completedReport: CareerGuidanceReport | null;
}

const DEFAULT_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CareerStorePersistenceHooks {
  onUpsert?: (record: CareerAttemptServerRecord) => void;
  onDelete?: (attemptId: string) => void;
}

export class CareerAssessmentStore {
  private records = new Map<string, CareerAttemptServerRecord>();
  private filePath: string | null;
  private hooks: CareerStorePersistenceHooks = {};

  constructor(filePath: string | null = null) {
    this.filePath = filePath;
    if (this.filePath) {
      this.loadFromDisk();
    }
  }

  public setPersistenceHooks(hooks: CareerStorePersistenceHooks): void {
    this.hooks = hooks;
  }

  public hydrateRecords(externalRecords: CareerAttemptServerRecord[]): void {
    for (const rec of externalRecords) {
      if (rec && typeof rec.attemptId === "string" && rec.accessToken) {
        this.records.set(rec.attemptId, rec);
      }
    }
  }

  public getRecordCount(): number {
    return this.records.size;
  }

  private loadFromDisk(): void {
    if (!this.filePath) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw) as Record<
          string,
          CareerAttemptServerRecord
        >;
        if (parsed && typeof parsed === "object") {
          for (const [id, rec] of Object.entries(parsed)) {
            if (rec && typeof rec.attemptId === "string" && rec.accessToken) {
              this.records.set(id, rec);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load career attempts store:", err);
    }
  }

  private persistToDisk(): void {
    if (!this.filePath) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const serializable: Record<string, CareerAttemptServerRecord> = {};
      for (const [id, rec] of this.records.entries()) {
        serializable[id] = rec;
      }
      const tempPath = `${this.filePath}.tmp-${process.pid}-${Date.now()}`;
      fs.writeFileSync(
        tempPath,
        JSON.stringify(serializable, null, 2),
        "utf-8"
      );
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error("Failed to persist career attempts store:", err);
    }
  }

  public generateAttemptId(): string {
    return `cit-att-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  }

  public generateAccessToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  public verifyToken(
    record: CareerAttemptServerRecord,
    candidateToken: string | undefined | null
  ): { authorized: boolean; reason?: "INVALID_TOKEN" | "REVOKED" | "EXPIRED" } {
    if (!candidateToken || typeof candidateToken !== "string") {
      return { authorized: false, reason: "INVALID_TOKEN" };
    }
    if (record.revoked) {
      return { authorized: false, reason: "REVOKED" };
    }
    const now = Date.now();
    const exp = Date.parse(record.expiresAt);
    if (!Number.isNaN(exp) && now > exp) {
      return { authorized: false, reason: "EXPIRED" };
    }

    const expectedBuf = Buffer.from(record.accessToken, "utf-8");
    const candidateBuf = Buffer.from(candidateToken.trim(), "utf-8");
    if (
      expectedBuf.length !== candidateBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, candidateBuf)
    ) {
      return { authorized: false, reason: "INVALID_TOKEN" };
    }

    return { authorized: true };
  }

  /**
   * Creates or updates an assessment attempt idempotently without creating duplicate records
   * on browser refresh or resume.
   */
  public upsertAttempt(params: {
    attemptId?: string;
    accessToken?: string;
    studentDetails?: unknown;
    responses?: unknown;
    aiNarrative?: unknown;
  }): {
    status: "ok" | "validation_error" | "unauthorized";
    errors?: Record<string, string>;
    record?: CareerAttemptServerRecord;
  } {
    const nowIso = new Date().toISOString();
    const expiresIso = new Date(Date.now() + DEFAULT_TOKEN_TTL_MS).toISOString();

    let validatedDetails: CareerStudentDetails | null = null;
    if (params.studentDetails !== undefined && params.studentDetails !== null) {
      const validation = validateStudentDetailsForm(
        params.studentDetails as Record<string, unknown>
      );
      if (!validation.valid || !validation.sanitized) {
        return {
          status: "validation_error",
          errors: validation.errors as Record<string, string>,
        };
      }
      validatedDetails = validation.sanitized;
    }

    const sanitizedResponses =
      params.responses !== undefined
        ? sanitizeAssessmentResponses(params.responses, CAREER_QUESTIONS)
        : undefined;

    const requestedId =
      typeof params.attemptId === "string" ? params.attemptId.trim() : "";
    const existing = requestedId ? this.records.get(requestedId) : undefined;

    if (existing) {
      const auth = this.verifyToken(existing, params.accessToken);
      if (!auth.authorized) {
        return { status: "unauthorized" };
      }

      const nextDetails = validatedDetails ?? existing.studentDetails;
      const nextResponses =
        sanitizedResponses !== undefined
          ? sanitizedResponses
          : existing.responses;

      let nextReport = existing.completedReport;
      if (Object.keys(nextResponses).length > 0) {
        let generated = generateCareerGuidanceReport(nextResponses, {
          attemptId: existing.attemptId,
          studentName: nextDetails?.fullName,
          studentClass: nextDetails?.studentClass,
          studentDetails: nextDetails || undefined,
          reportId: existing.completedReport?.reportId,
          generatedAt: existing.completedReport?.generatedAt,
        });
        if (params.aiNarrative || existing.completedReport?.aiNarrative) {
          generated = attachAINarrativeToReport(
            generated,
            params.aiNarrative || existing.completedReport?.aiNarrative
          );
        }
        nextReport = generated;
      }

      const updatedRecord: CareerAttemptServerRecord = {
        ...existing,
        updatedAt: nowIso,
        studentDetails: nextDetails,
        responses: nextResponses,
        completedReport: nextReport,
        completedAt:
          Object.keys(nextResponses).length === CAREER_QUESTIONS.length
            ? existing.completedAt || nowIso
            : existing.completedAt,
      };

      this.records.set(existing.attemptId, updatedRecord);
      this.persistToDisk();
      this.hooks.onUpsert?.(updatedRecord);
      return { status: "ok", record: updatedRecord };
    }

    // Create new attempt record
    const newAttemptId = this.generateAttemptId();
    const newAccessToken = this.generateAccessToken();
    const initialResponses = sanitizedResponses || {};

    let initialReport: CareerGuidanceReport | null = null;
    if (Object.keys(initialResponses).length > 0) {
      initialReport = generateCareerGuidanceReport(initialResponses, {
        attemptId: newAttemptId,
        studentName: validatedDetails?.fullName,
        studentClass: validatedDetails?.studentClass,
        studentDetails: validatedDetails || undefined,
      });
    }

    const created: CareerAttemptServerRecord = {
      attemptId: newAttemptId,
      accessToken: newAccessToken,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt:
        Object.keys(initialResponses).length === CAREER_QUESTIONS.length
          ? nowIso
          : undefined,
      expiresAt: expiresIso,
      revoked: false,
      studentDetails: validatedDetails,
      responses: initialResponses,
      completedReport: initialReport,
    };

    this.records.set(newAttemptId, created);
    this.persistToDisk();
    this.hooks.onUpsert?.(created);
    return { status: "ok", record: created };
  }

  public getAuthorizedAttempt(
    attemptId: string,
    accessToken: string | undefined | null
  ): {
    status: "ok" | "not_found" | "unauthorized" | "expired";
    record?: CareerAttemptServerRecord;
  } {
    const rec = this.records.get(attemptId);
    if (!rec || rec.revoked) {
      return { status: "not_found" };
    }
    const auth = this.verifyToken(rec, accessToken);
    if (!auth.authorized) {
      if (auth.reason === "EXPIRED") return { status: "expired" };
      return { status: "unauthorized" };
    }
    return { status: "ok", record: rec };
  }

  public deleteAuthorizedAttempt(
    attemptId: string,
    accessToken: string | undefined | null
  ): { status: "ok" | "not_found" | "unauthorized" } {
    const rec = this.records.get(attemptId);
    if (!rec) {
      return { status: "not_found" };
    }
    const auth = this.verifyToken(rec, accessToken);
    if (!auth.authorized) {
      return { status: "unauthorized" };
    }
    this.records.delete(attemptId);
    this.persistToDisk();
    this.hooks.onDelete?.(attemptId);
    return { status: "ok" };
  }
}
