// backend/src/app.ts
import express from "express";
import cors from "cors";
import diagnosticRoutes from "./routes/diagnosticRoutes";
import articleRoutes from "./routes/articleRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import authRoutes from "./routes/authRoutes";
import resourceRoutes from "./routes/resourceRoutes";
import { branchDetector } from "./middleware/branchMiddleware";

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

export default app;
