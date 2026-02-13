import { sql } from "../config/db";
import { Request, Response } from "express";
import { ISession } from "../types";

// @desc : The tablet needs a list of "Open Inventories" so the user can select one.
// @feat : GET /api/sessions
// @table : Groupe_stock

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const pool = (req as any).pool; // The Key

    // Select the columns: id, depot, date, group_article, valide.
    const result = await pool.request().query(`
            SELECT id, depot, date, group_article, valide 
            FROM Groupe_stock
            WHERE valide = 0 
            ORDER BY date DESC`);

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

    // Get the pool from the request (injected by branchDetector)
    const pool = (req as any).pool;

    // Create the request FROM THE POOL
    const request = pool.request();

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
    const pool = (req as any).pool;

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        "SELECT id, depot, date, group_article, valide, id_chef FROM Groupe_stock WHERE id = @id",
      );

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
  const pool = (req as any).pool;
  const transaction = new sql.Transaction(pool);
  let newArticlesCount = 0;

  try {
    const { depot, group_article, id_chef, items } = req.body;
    let now = new Date();

    await transaction.begin();

    const requestHeader = new sql.Request(transaction);
    requestHeader.input("depot", sql.VarChar, depot);
    requestHeader.input("group", sql.VarChar, group_article);
    requestHeader.input("chef", sql.VarChar, id_chef);
    requestHeader.input("now", sql.DateTime, now);

    // LEGACY FIX: Set id_control = id_chef to avoid mobile crash
    const headerResult = await requestHeader.query(`
      INSERT INTO Groupe_stock (depot, group_article, date, id_chef, valide, id_control)
      VALUES (@depot, @group, @now, @chef, 0, @chef); 
      SELECT SCOPE_IDENTITY() AS id;
    `);

    const sessionId = headerResult.recordset[0].id;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const requestItem = new sql.Request(transaction);

      const staggeredDate = new Date(now.getTime() + i * 10);
      const articleCode = item.code_article.trim();
      const articleName = item.article_name || "Nouveau Produit";

      // Use the transaction-bound request for the check!
      const checkRequest = new sql.Request(transaction);
      checkRequest.input("code", sql.VarChar, articleCode);

      // --- STEP A: REGISTER NEW ARTICLE IF MISSING ---
      // We check if the article exists in the master table
      const checkArticle = await checkRequest.query(
        "SELECT 1 FROM Article WHERE code_article = @code",
      );

      if (checkArticle.recordset.length === 0) {
        newArticlesCount++;

        const regRequest = new sql.Request(transaction);
        regRequest.input("code", sql.VarChar, articleCode);
        regRequest.input("name", sql.VarChar, articleName);
        regRequest.input("grp", sql.VarChar, group_article); // Use current session group

        // Insert into Master Article Table with default values
        await regRequest.query(`
          INSERT INTO Article (code_article, article, groupe, famille, souss_famille, Prix, Qrcode)
          VALUES (@code, @name, @grp, 'NON CLASSIFIE', 'NON CLASSIFIE', 0, '')
        `);
      }

      // --- STEP B: INSERT INTO STOCK_ITEM (As before) ---
      requestItem.input("sid", sql.Int, sessionId);
      requestItem.input("code", sql.VarChar, articleCode);
      requestItem.input("itemDate", sql.DateTime, staggeredDate);
      requestItem.input("chef", sql.VarChar, id_chef);

      const qtySys = parseFloat(item.qte_globale || 0);

      await requestItem.query(`
        INSERT INTO Stock_item 
        (id_group_stock, id_article, qte_globale, qte_physique, date, id_control, Qte_sosadis, qte_perime_ph, descreption, qte_perime_nr, qrcode)
        VALUES (@sid, @code, ${qtySys}, 0, @itemDate, @chef, 0, 0, '-', NULL, '')
      `);
    }

    await transaction.commit();
    res.status(201).json({
      success: true,
      message: `Session ${sessionId} créée avec succès.`,
      newArticlesCount: newArticlesCount,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Transaction Error:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// @desc    Get only the items belonging to a specific session
// @route   GET /api/sessions/:id/items
export const getSessionItems = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id as string);
    const pool = (req as any).pool;

    const request = pool.request();
    request.input("sid", sql.Int, sessionId);

    const query = `
      SELECT 
        si.id, 
        si.id_article AS code_article, 
        -- Fallback to 'descreption' if the master Article table doesn't have the item
        COALESCE(A.article, si.descreption, 'Article Inconnu') AS article, 
        A.Prix,
        COALESCE(si.qte_globale, 0) as qte_globale, 
        COALESCE(si.qte_physique, 0) as qte_physique,
        COALESCE(si.qte_perime_nr, 0) as qte_perime_nr,
        COALESCE(si.qte_perime_ph, 0) as qte_perime_ph,
        si.date
      FROM Stock_item si
      LEFT JOIN Article A ON si.id_article = A.code_article
      WHERE si.id_group_stock = @sid
      ORDER BY si.date ASC
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
    // Support both Web (quantity) and Mobile (qte_physique) field names
    const qte_physique = req.body.quantity ?? req.body.qte_physique;

    // 1. Get the pool from the request (injected by middleware)
    const pool = (req as any).pool;

    // 2. Create the request FROM THE POOL, not from global sql
    const request = pool.request();

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

    // Get the pool
    const pool = (req as any).pool;
    const request = pool.request();

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
