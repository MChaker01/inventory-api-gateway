import express from "express";
const router = express.Router();
import {
  getTables,
  getArticleSchema,
} from "../controllers/diagnosticController";

router.get("/tables", getTables);
router.get("/article-schema", getArticleSchema);

export default router;
