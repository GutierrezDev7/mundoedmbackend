import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "mundoedm-admin-secret-change-in-production";
const JWT_EXPIRES = "7d";

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      return res.status(400).json({ error: "Usuario e senha sao obrigatorios" });
    }

    const { rows } = await pool.query(
      "SELECT id, username, password_hash FROM admin_users WHERE LOWER(username) = LOWER($1)",
      [username.trim()],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario ou senha invalidos" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Usuario ou senha invalidos" });
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES },
    );

    res.json({ success: true, token, username: user.username });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

function getToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ error: "Nao autorizado" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number; username: string };
    res.json({ username: payload.username });
  } catch {
    res.status(401).json({ error: "Nao autorizado" });
  }
});
