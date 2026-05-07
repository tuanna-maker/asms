import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import v1Routes from "./routes/v1";
import errorHandler from "./middleware/errorHandler";

import { corsOptions } from "./config/cors";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));
app.use("/api/v1/uploads", express.static("uploads"));

app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    data: { service: "backend", status: "ok" },
    message: "Service is healthy",
  });
});

app.use("/api/v1", v1Routes);

app.use((_req, res) => {
  res.status(404).json({ success: false, data: null, message: "Not found" });
});

app.use(errorHandler);

export default app;
