// backend/src/server.ts
import app from "./app";
import { connectDB } from "./config/db";

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
