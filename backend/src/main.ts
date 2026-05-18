import { startServer } from "./server";
// reload trigger for route registration

void startServer().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
