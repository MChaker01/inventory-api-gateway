import express from "express";
const router = express.Router();
import { getActiveSessions, getSessionHistory } from "../controllers/sessionController";

router.get("/", getActiveSessions);
router.get("/history", getSessionHistory);

export default router ;
