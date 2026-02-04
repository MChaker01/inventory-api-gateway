import { sql } from "../config/db";
import { Request, Response } from "express";
// @desc    Get all tables in the database
// @route   GET /api/diagnostics/tables
// @access  Public (for now)

export const getTables = async (req: Request, res: Response) => {
  try {
    // 1. Get the pool connection (already open)
    // 2. Create a request object
    const result = await sql.query`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        `;

    // SQL returns data in a 'recordset' array
    res.status(200).json({
      success: true,
      count: result.recordset.length,
      tables: result.recordset,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: (error as Error).message,
    });
  }
};

export const getArticleSchema = async (req: Request, res: Response) => {
  try {
    const result = await sql.query`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Article'
        `;

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      columns: result.recordset,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: (error as Error).message,
    });
  }
};
