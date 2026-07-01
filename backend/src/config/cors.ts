import type { CorsOptions } from "cors";

import { env } from "./env";

function resolveCorsOrigin(): CorsOptions["origin"] {
  if (env.NODE_ENV !== "production") {
    return true;
  }
  const allowed = env.CORS_ORIGINS;
  if (allowed.length === 0) {
    return false;
  }
  return (origin, callback) => {
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}

export const corsOptions: CorsOptions = {
  origin: resolveCorsOrigin(),
  credentials: true,
};

