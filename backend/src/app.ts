import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { routes } from "./routes";
import { errorHandler } from "./utils/errors";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(morgan(env.NODE_ENV === "test" ? "tiny" : "combined"));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", routes);
  app.use(errorHandler);

  return app;
}

