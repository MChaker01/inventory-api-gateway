import express from "express";
import { getDepots, getGroups } from "../controllers/resourceController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// These endpoints are read-only, but let's protect them to be safe
router.get("/depots", protect, getDepots);
router.get("/groups", protect, getGroups);

export default router;
