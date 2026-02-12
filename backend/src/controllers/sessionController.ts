import { sql } from "../config/db";
import { Request, Response } from "express";
import { ISession } from "../types";

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

export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    // 1. Get Query Params (Default to Page 1, Limit 10)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const offset = (page - 1) * limit;

    const request = new sql.Request();
    request.input("offset", sql.Int, offset);
    request.input("limit", sql.Int, limit);
    request.input("search", sql.VarChar, `%${search}%`);

    // 2. Query 1: Get Total Count (For pagination UI)
    const countResult = await request.query(
      `SELECT COUNT(*) as total FROM Groupe_stock 
       WHERE group_article LIKE @search OR depot LIKE @search OR id_chef LIKE @search`,
    );
    const totalItems = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // 3. Query 2: Get Paginated Data
    // NOTICE: We MUST have an ORDER BY for OFFSET to work
    const query = `
      SELECT id, depot, date, group_article, valide, id_chef, id_control 
      FROM Groupe_stock 
      WHERE group_article LIKE @search OR depot LIKE @search OR id_chef LIKE @search
      ORDER BY date DESC
      OFFSET @offset ROWS 
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await request.query(query);

    res.status(200).json({
      success: true,
      data: result.recordset,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// @desc    Get Session Header (Status, Depot, etc.)
// @route   GET /api/sessions/:id
export const getSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await sql.query`
      SELECT id, depot, date, group_article, valide, id_chef 
      FROM Groupe_stock 
      WHERE id = ${id}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const createSession = async (req: Request, res: Response) => {
  const transaction = new sql.Transaction();
  try {
    const { depot, group_article, id_chef, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cannot create empty session" });
    }

    // 1. Begin Transaction
    await transaction.begin();

    // 2. Create the Session Header (Groupe_stock)
    // We use a Request attached to the Transaction
    const requestHeader = new sql.Request(transaction);

    requestHeader.input("depot", sql.VarChar, depot);
    requestHeader.input("group", sql.VarChar, group_article);
    requestHeader.input("chef", sql.VarChar, id_chef);
    // id_control is null initially
    // valide = 0 (En cours)

    const headerResult = await requestHeader.query`
      INSERT INTO Groupe_stock (depot, group_article, date, id_chef, valide)
      VALUES (@depot, @group, GETDATE(), @chef, 0);
      SELECT SCOPE_IDENTITY() AS id;
    `;

    const sessionId = headerResult.recordset[0].id;

    // 3. Insert Items (The "Pages" of the notebook)
    // For 500 items, we can loop. It's not the fastest, but it's safe for now.
    // (In the future, we can optimize with sql.Table for bulk insert)
    for (const item of items) {
      const requestItem = new sql.Request(transaction);

      // item.code_article coming from Excel/React
      // item.qte_globale coming from Excel "Stk Unité"
      requestItem.input("sid", sql.Int, sessionId);
      requestItem.input("code", sql.VarChar, item.code_article);
      // 1. Pass the name from Excel
      requestItem.input("name", sql.VarChar, item.article_name || "");
      requestItem.input("qty_sys", sql.Float, item.qte_globale || 0);
      // qte_physique starts at 0

      // 2. Insert into 'descreption' (Note the DB typo)
      await requestItem.query`INSERT INTO Stock_item 
  (id_group_stock, id_article, qte_globale, qte_physique, Qte_sosadis, qte_perime_nr, descreption)
  VALUES (@sid, @code, @qty_sys, 0, 0, 0, @name)`;
    }

    // 4. Commit (Save everything)
    await transaction.commit();

    res.status(201).json({
      success: true,
      message: `Session ${sessionId} created with ${items.length} items.`,
    });
  } catch (error) {
    // 5. Rollback (Undo everything if error)
    if (transaction) await transaction.rollback();
    console.error("Transaction Error:", error);

    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// @desc    Get only the items belonging to a specific session
// @route   GET /api/sessions/:id/items
export const getSessionItems = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id as string); // Validates it's a number

    const request = new sql.Request();
    request.input("sid", sql.Int, sessionId);

    // FIX:
    // 1. Use 'id_article' (from Stock_item) as 'code_article'
    // 2. JOIN with Article table to get the name ('article' column)
    const query = `
      SELECT 
        si.id, 
        si.id_article AS code_article, 
                -- LOGIC: Try to get name from Master Table. If NULL, use the backup from Excel (descreption)
                COALESCE(A.article, si.descreption, 'Article Inconnu') AS article, 

        A.Prix,
        si.qte_globale, 
        si.qte_physique,
        si.qrcode
      FROM Stock_item si
      LEFT JOIN Article A ON si.id_article = A.code_article
      WHERE si.id_group_stock = @sid
      ORDER BY A.article ASC
    `;

    const result = await request.query(query);

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      items: result.recordset,
    });
  } catch (error) {
    console.error("❌ SQL Error:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const updateItemCount = async (req: Request, res: Response) => {
  try {
    const itemId = req.params.id;
    const qte_physique = req.body.quantity;

    const request = new sql.Request();

    request.input("item_id", sql.Int, itemId);
    request.input("qte_physique", sql.Float, qte_physique);

    const query = `UPDATE Stock_item SET qte_physique = @qte_physique WHERE id = @item_id`;

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `item updated successfully.`,
    });
  } catch (error) {
    console.error("❌ SQL Error:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// ROUTE : PUT /api/sessions/:id/validate
export const validateSession = async (req: Request, res: Response) => {
  try {
    // 1. Get data
    const { username } = req.body;
    const sessionId = req.params.id;

    const request = new sql.Request();

    // 2. Fix Types: IDs are Int, Usernames are VarChar
    request.input("id", sql.Int, sessionId);
    request.input("controller", sql.VarChar, username);

    // 3. The Query
    // We hardcode 'valide = 1' because this function ALWAYS validates.
    // We update 'id_control' to sign who did it.
    // We check 'valide = 0' to ensure we don't validate twice.
    const query = `
        UPDATE Groupe_stock 
        SET valide = 1, id_control = @controller 
        WHERE id = @id AND valide = 0
    `;

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        success: false,
        message: "Session not found or already validated.",
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Session validated successfully." });
  } catch (error) {
    console.error("❌ SQL Error:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
