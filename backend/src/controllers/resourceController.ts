import { sql } from "../config/db";
import { Request, Response } from "express";

// @desc    Get all Depots
// @route   GET /api/resources/depots
export const getDepots = async (req: Request, res: Response) => {
  try {
    const pool = (req as any).pool as sql.ConnectionPool;
    const result = await pool
      .request()
      .query("SELECT nom FROM depot ORDER BY nom ASC");
    const depots = result.recordset.map((row: any) => row.nom);
    res.status(200).json(depots);
  } catch (error) {
    console.error("Error fetching depots:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all Article Groups
// @route   GET /api/resources/groups
export const getGroups = async (req: Request, res: Response) => {
  try {
    const pool = (req as any).pool as sql.ConnectionPool;
    const result = await pool
      .request()
      .query("SELECT Nom FROM Groupe ORDER BY Nom ASC");
    const groups = result.recordset.map((row: any) => row.Nom);
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
