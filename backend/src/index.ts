import cors from "cors";
import express from "express";
import { adminRouter } from "./admin/admin.routes.js";
import { authRouter } from "./auth/auth.routes.js";
import { initializeDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL
  })
);
app.use(express.json());

app.get("/health", (_, response) => {
  response.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

initializeDatabase()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Backend server running on http://localhost:${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
