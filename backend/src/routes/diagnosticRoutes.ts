import express from "express";
const router = express.Router();
import {
  getTables,
  getArticleSchema,
} from "../controllers/diagnosticController";
import { protect } from "../middleware/authMiddleware";

router.use(protect);

router.get("/tables", getTables);
router.get("/article-schema", getArticleSchema);

export default router;
