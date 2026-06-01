import { startServer } from "./server";
// reload trigger (customer-feedbacks ticket workflow + prisma enum)

void startServer().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
