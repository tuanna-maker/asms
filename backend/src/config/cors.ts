import type { CorsOptions } from "cors";

import { env } from "./env";
import { HttpError } from "../lib/errors/HttpError";

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
    // Throw HttpError 403 thay vì Error thường — errorHandler sẽ trả 403 đúng chuẩn.
    callback(new HttpError(403, `CORS blocked for origin: ${origin}`));
  };
}

export const corsOptions: CorsOptions = {
  origin: resolveCorsOrigin(),
  credentials: true,
};

