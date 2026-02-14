// backend/src/app.ts
import express from "express";
import cors from "cors";
import diagnosticRoutes from "./routes/diagnosticRoutes";
import articleRoutes from "./routes/articleRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import authRoutes from "./routes/authRoutes";
import resourceRoutes from "./routes/resourceRoutes";
import { branchDetector } from "./middleware/branchMiddleware";
import path from "path";

const app = express();

app.use((req, res, next) => {
  console.log(
    `\n🔎 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`,
  );
  // Log Headers to check for Auth tokens or Content-Type
  // console.log("Headers:", req.headers);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

// Multi-city Traffic Controller
app.use(branchDetector);

// Routes
app.use("/api/diagnostics", diagnosticRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);

// 1. Point to the frontend's build folder
// Note: This assumes my folders are:
// /project
//    /backend
//    /frontend
const frontendPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));

// 2. The "Fallback" route
// If the user refreshes on /session/123, the server must still send index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

export default app;
