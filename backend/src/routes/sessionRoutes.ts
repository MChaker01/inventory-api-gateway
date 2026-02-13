import express from "express";
const router = express.Router();
import {
  getActiveSessions,
  getSessionHistory,
  createSession,
  getSessionItems,
  getSessionById,
  updateItemCount,
  validateSession,
} from "../controllers/sessionController";
import { protect } from "../middleware/authMiddleware";

// router.use(protect);

router.get("/", getActiveSessions);
router.get("/history", getSessionHistory);
router.post("/", createSession);
router.get("/:id", getSessionById);
router.get("/:id/items", getSessionItems);
router.put("/items/:id", updateItemCount);
router.put("/:id/validate", validateSession);

export default router;
