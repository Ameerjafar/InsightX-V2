import { Request, Response } from "express";
import zod from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
const emailSchema = zod.object({
  email: zod.email(),
});
export const signup = async (req: Request, res: Response) => {
  const { email } = req.body;
  const response = emailSchema.safeParse(email);
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });
  if (user) {
    return res.status(411).json({ message: "this email is already present" });
  }
  const date = new Date();
  prisma.user.create({
    data: {
      email,
      lastLoggedIn: date.getTime().toString(),
    },
  });
  if (response) {
    return res.status(200).json({ message: "This Email has set perfectly" });
  }
  jwt.sign({ email }, process.env.JWT_SECRET!);
  return res
    .status(403)
    .json({ message: "Your entry is not in correct email format" });
};

export const signin = async (req: Request, res: Response) => {
  const { email } = req.body;
  const response = emailSchema.safeParse(email);
  if (response) {
    return res.status(200).json({ message: "This Email has set perfectly" });
  }
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });
  if (user) {
    return res.status(200).json({ message: "signin successfully" });
  }
  const token = jwt.sign({ email }, process.env.JWT_SECRET!);
  res.cookie("cookie", token);
  return res.status(403).json(token);
};
