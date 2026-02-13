import jwt from "jsonwebtoken";
import { IUser } from "../types/index";
import { Request, Response } from "express";
import { sql } from "../config/db";

/**
 * @desc    Authenticate a user
 * @route   POST /api/auth/login
 * @access  Public
 */

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Please provide username and password" });
    }

    // 1. Get the pool based on the header (x-branch)
    const pool = (req as any).pool as sql.ConnectionPool;

    // 2. Use pool.request()
    const request = pool.request();
    request.input("username", sql.VarChar, username);

    const result =
      await request.query`SELECT * FROM Users WHERE username = @username AND (deleted is NULL OR deleted = 0)`;
    const db_user = result.recordset[0] as IUser;

    if (!db_user || db_user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    } else {
      const token = jwt.sign(
        { id: db_user.username, role: db_user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" },
      );

      return res.status(200).json({
        success: true,
        token,
        user: { username: db_user.username, role: db_user.role },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error during login" });
  }
};
