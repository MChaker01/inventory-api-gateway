import { sql } from "../config/db";
import { Request, Response } from "express";

// @desc : The tablet needs a list of "Open Inventories" so the user can select one.
// @feat : GET /api/sessions
// @table : Groupe_stock

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    // Select the columns: id, depot, date, group_article, valide.
    const result = await sql.query`
            SELECT id, depot, date, group_article, valide 
            FROM Groupe_stock
            WHERE valide = 0 
            ORDER BY date DESC`;

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      rows: result.recordset,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
