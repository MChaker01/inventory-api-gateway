import express from "express";
const router = express.Router();
import { getArticles } from "../controllers/articleController";

router.get("/", getArticles);

export default router ;
