ALTER TABLE "workflow_step_logs"
    ADD CONSTRAINT "workflow_step_logs_actor_id_fkey"
        FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
