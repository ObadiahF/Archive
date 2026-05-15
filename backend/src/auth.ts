import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { config } from "./config";
import { Errors } from "./errors";

export interface JwtPayload {
  sub: string;
}

export interface AuthedRequest extends Request {
  user?: { username: string };
}

export function verifyCredentials(username: string, password: string): boolean {
  if (typeof username !== "string" || typeof password !== "string") return false;
  const userOk = timingSafeEqStr(username, config.auth.username);
  const passOk = timingSafeEqStr(password, config.auth.password);
  return userOk && passOk;
}

function timingSafeEqStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signToken(username: string): { token: string; expiresAt: string } {
  const ttlSec = config.jwt.ttlHours * 60 * 60;
  const token = jwt.sign({ sub: username } satisfies JwtPayload, config.jwt.secret, {
    expiresIn: ttlSec,
  });
  const expiresAt = new Date(Date.now() + ttlSec * 1000).toISOString();
  return { token, expiresAt };
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7);
  const t = req.query.t;
  if (typeof t === "string" && t.length > 0) return t;
  return null;
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(Errors.unauthenticated("Missing token"));
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = { username: payload.sub };
    next();
  } catch {
    next(Errors.unauthenticated("Invalid or expired token"));
  }
}
