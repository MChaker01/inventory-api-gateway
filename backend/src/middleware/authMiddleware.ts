import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sql } from "../config/db";

// 1. Define the shape of the User inside the Token
interface DecodedToken {
  id: string; // username
  role: string;
  iat: number; // iat => issued At
  exp: number;
}

// 2. Extend the standard Request to include our User
export interface AuthRequest extends Request {
  user?: DecodedToken;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. Extract token from headers (Authorization: Bearer <token>)
      token = req.headers.authorization.split(" ")[1];
      // 2. Verify token using jwt.verify()
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!,
      ) as DecodedToken;

      // 3. If valid: Attach user info to the request object (Cast req to AuthRequest) and call next()
      if (decoded) {
        (req as AuthRequest).user = decoded;

        next();
      }
    } catch (error) {
      console.error("Token Verification Failed");
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
