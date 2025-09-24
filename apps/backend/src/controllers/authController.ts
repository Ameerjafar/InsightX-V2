import { Request, Response } from "express";
import zod from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "../db";

const signupSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(6),
});

const signinSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(6),
});

function createAuthToken(email: string): string {
  return jwt.sign({ email }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
}

export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  
  const parsed = signupSchema.safeParse({ email, password });
  if (!parsed.success) {
    return res.status(400).json({ 
      message: "Invalid input", 
      errors: parsed.error.errors 
    });
  }

  try {
    const existing = await prisma.user.findFirst({ where: { email: email! } });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password!, 10);
    
    const user = await prisma.user.create({ 
      data: { 
        email: email!, 
        password: hashedPassword,
        lastLoggedIn: new Date(),
        Balance: 5000,
        freeMargin: 5000,
        lockedMargin: 0
      } 
    });
    
    const token = createAuthToken(email!);
    res.cookie("session", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });
    
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  
  const parsed = signinSchema.safeParse({ email, password });
  if (!parsed.success) {
    return res.status(400).json({ 
      message: "Invalid input", 
      errors: parsed.error.errors 
    });
  }

  try {
    const user = await prisma.user.findFirst({ where: { email: email! } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password!, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoggedIn: new Date() }
    });

    const token = createAuthToken(email!);
    res.cookie("session", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });
    
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};