import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";

import diagnosticRoutes from "./routes/diagnosticRoutes";
import articleRoutes from "./routes/articleRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import authRoutes from "./routes/authRoutes";

const app = express();

// middlewares

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

// Routes

app.use("/api/diagnostics", diagnosticRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/auth", authRoutes);

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;

  // Start Express server and listen for incoming requests
  app.listen(PORT, () => {
    console.log(`Server is running on Port : ${PORT}`);
    console.log(`http://localhost:${PORT}`);
  });
});
