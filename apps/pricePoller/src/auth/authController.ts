import { Request, Response } from 'express';
import zod from 'zod';
import jwt from 'jsonwebtoken';
const emailSchema = zod.object({
    email: zod.email()
})
export const signup = (req: Request, res: Response) => {
    const { email } = req.body;
    const response = emailSchema.safeParse(email);
    if(response) {
        return res.status(200).json({message: "This Email has set perfectly"});
    }
    jwt.sign({email}, process.env.JWT_SECRET!);
    return res.status(403).json({message: "Your entry is not in correct email format"});

}

export const signin = (req: Request, res: Response) => {
    const { email } = req.body;
    const response = emailSchema.safeParse(email);
    if(response) {
        return res.status(200).json({message: "This Email has set perfectly"});
    }
    const token = jwt.sign({email}, process.env.JWT_SECRET!);
    res.cookie("cookie", token)
    return res.status(403).json({message: "Your entry is not in correct email format"});

}