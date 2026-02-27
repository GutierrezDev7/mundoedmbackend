import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma.js";
export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? "mundoedm-admin-secret-change-in-production";
const JWT_EXPIRES = "7d";
authRouter.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Usuario e senha sao obrigatorios" });
        }
        const user = await prisma.adminUser.findFirst({
            where: {
                username: { equals: username.trim(), mode: "insensitive" },
            },
        });
        if (!user) {
            return res.status(401).json({ error: "Usuario ou senha invalidos" });
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: "Usuario ou senha invalidos" });
        }
        const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        res.json({ success: true, token, username: user.username });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
});
function getToken(req) {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer "))
        return auth.slice(7);
    return null;
}
authRouter.get("/me", async (req, res) => {
    try {
        const token = getToken(req);
        if (!token) {
            return res.status(401).json({ error: "Nao autorizado" });
        }
        const payload = jwt.verify(token, JWT_SECRET);
        res.json({ username: payload.username });
    }
    catch {
        res.status(401).json({ error: "Nao autorizado" });
    }
});
