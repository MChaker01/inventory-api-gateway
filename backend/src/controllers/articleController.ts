import { sql } from "../config/db";
import { Request, Response } from "express";

// @desc    Get articles with pagination
// @route   GET /api/articles?page=1&limit=10
// @access  Private (eventually)

export const getArticles = async (req: Request, res: Response) => {
  try {
    // 1. Extract Query Params (Default to Page 1, Limit 20 if not provided)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const groupID = parseInt(req.query.groupID as string) || 0; // CRITICAL: Which inventory session?
    const category = (req.query.category as string) || "";
    // 2. Calculate Offset (How many rows to skip)
    // If page is 1: (1-1)*20 = 0. If page is 2: (2-1)*20 = 20.
    const offset = (page - 1) * limit;

    // 3. Prepare the Request
    // We use 'new sql.Request()' to create a fresh request object
    const request = new sql.Request();

    // SELECT: Get Article info AND Stock info
    // We use COALESCE(S.qte_physique, 0) to return 0 if no stock record exists
    let query = `SELECT 
                A.code_article, 
                A.article, 
                A.Prix,
                COALESCE(S.qte_physique, 0) as quantity_physical,
                COALESCE(S.qte_globale, 0) as quantity_system
            FROM Article A
            LEFT JOIN Stock_item S 
                ON A.code_article = S.id_article 
                AND S.id_group_stock = @groupID`;

    // 2. FILTERING
    // Note: We filter WHERE A.article... because we search the Article table
    let whereClause = " WHERE 1=1 ";

    if (search) {
      whereClause +=
        " AND (A.article LIKE @search OR A.code_article LIKE @search) ";
      request.input("search", sql.VarChar, `%${search}%`);
    }

    if (category) {
      whereClause += "AND A.groupe = @category";
      request.input("category", sql.VarChar, `${category}`);
    }

    query += whereClause;

    // Pagination (ALWAYS required for large datasets)
    // MUST come after WHERE
    query += ` ORDER BY A.article ASC 
                   OFFSET @offset ROWS 
                   FETCH NEXT @limit ROWS ONLY`;

    request.input("groupID", sql.Int, groupID || 0); // Default to 0 if not provided
    request.input("offset", sql.Int, offset);
    request.input("limit", sql.Int, limit);

    const result = await request.query(query);

    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("❌ SQL Error:", error);
    res.status(500).json({
      success: false,
      message: "Database Error",
      error: (error as Error).message,
    });
  }
};
