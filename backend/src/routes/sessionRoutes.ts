import express from "express";
const router = express.Router();
import { getActiveSessions } from "../controllers/sessionController";

router.get("/", getActiveSessions);

export default router ;
