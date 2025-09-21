import { Request, Response } from "express";
import zod from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { Resend } from "resend";
const emailSchema = zod.object({
  email: zod.string().email(),
});
const resend = new Resend(process.env.RESEND_API_KEY || "");

function createLoginToken(email: string): string {
  return jwt.sign({ email }, process.env.JWT_SECRET || "secret", { expiresIn: "15m" });
}

function buildSigninLink(token: string): string {
  const base = process.env.BACKEND_URL || "http://localhost:3000";
  return `${base}/api/v1/signin/post?token=${encodeURIComponent(token)}`;
}

async function sendEmail(to: string, subject: string, link: string) {
  const from = process.env.RESEND_FROM || "ameerjafar123@gmail.com";
  await resend.emails.send({
    from,
    to,
    subject,
    html: `<p>Click to sign in: <a href="${link}">${link}</a></p>`,
  });
}

export const signup = async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const existing = await prisma.user.findFirst({ where: { email: email! } });
  if (!existing) {
    await prisma.user.create({ data: { email: email!, lastLoggedIn: new Date() as any } });
  }

  const token = createLoginToken(email!);
  const link = buildSigninLink(token);
  await sendEmail(email!, "Sign up to your account", link);
  return res.status(200).json({ message: "Email sent" });
};

export const signin = async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid email" });
  }
  const user = await prisma.user.findFirst({ where: { email: email! } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const token = createLoginToken(email!);
  const link = buildSigninLink(token);
  await sendEmail(email!, "Sign in to your account", link);
  return res.status(200).json({ message: "Email sent" });
};

export const postSignin = async (req: Request, res: Response) => {
  const token = String(req.query.token || "");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret") as { email: string };
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    const jwtCookie = jwt.sign({ email: payload.email }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    res.cookie("session", jwtCookie);
    return res.redirect(frontend);
  } catch (e) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};
