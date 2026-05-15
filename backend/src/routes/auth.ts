import { Router, Response } from "express";
import { AuthedRequest, requireAuth, signToken, verifyCredentials } from "../auth";
import { Errors } from "../errors";

export const authRouter = Router();

authRouter.post("/login", (req, res, next) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    return next(Errors.invalidRequest("username and password are required"));
  }
  if (!verifyCredentials(username, password)) {
    return next(Errors.invalidCredentials());
  }
  const { token, expiresAt } = signToken(username);
  res.json({ token, expiresAt, user: { username } });
});

authRouter.get("/me", requireAuth, (req: AuthedRequest, res: Response) => {
  res.json({ user: req.user });
});
