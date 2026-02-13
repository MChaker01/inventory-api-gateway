import { Request, Response, NextFunction } from "express";
import { getPool } from "../config/db";
import { ConnectionPool } from "mssql";

// We extend the Express Request type to include our pool
export interface BranchRequest extends Request {
  pool?: ConnectionPool;
}

export const branchDetector = async (
  req: BranchRequest,
  res: Response,
  next: NextFunction,
) => {
  // 1. Get branch from headers (Sent by React)
  // Fallback to 'agadir' if the tablet doesn't send a header
  const branch = (req.headers["x-branch"] as string) || "agadir";

  console.log(
    `📡 Incoming Request: ${req.method} ${req.url} | Branch: ${branch}`,
  );

  try {
    // 2. Get the specific pool for this city
    const pool = await getPool(branch);

    // 3. Attach it to the request object
    req.pool = pool;

    next();
  } catch (error) {
    console.error(`Middleware Error [Branch: ${branch}]:`, error);
    res.status(500).json({ message: "Database Connection Error" });
  }
};
