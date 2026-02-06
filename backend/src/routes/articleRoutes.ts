import express from "express";
const router = express.Router();
import { getArticles } from "../controllers/articleController";
import { protect } from "../middleware/authMiddleware";

router.use(protect);

router.get("/", getArticles);

export default router;
