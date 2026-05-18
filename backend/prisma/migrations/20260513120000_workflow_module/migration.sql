-- CreateTable: workflow_definitions
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workflow_definitions_code_key" ON "workflow_definitions"("code");
CREATE INDEX "idx_workflow_definitions_module_active" ON "workflow_definitions"("module_key", "is_active");
CREATE INDEX "idx_workflow_definitions_deleted_at" ON "workflow_definitions"("deleted_at");

ALTER TABLE "workflow_definitions"
    ADD CONSTRAINT "workflow_definitions_created_by_id_fkey"
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_definitions_updated_by_id_fkey"
        FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: workflow_steps
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "action_code" TEXT NOT NULL DEFAULT 'approve',
    "role_code" TEXT NOT NULL,
    "sla_hours" INTEGER,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_workflow_step_order" ON "workflow_steps"("workflow_id", "order");
CREATE INDEX "idx_workflow_steps_workflow_id" ON "workflow_steps"("workflow_id");

ALTER TABLE "workflow_steps"
    ADD CONSTRAINT "workflow_steps_workflow_id_fkey"
        FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: workflow_instances
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "current_step_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_workflow_instances_entity" ON "workflow_instances"("module_key", "entity_id");
CREATE INDEX "idx_workflow_instances_workflow_id" ON "workflow_instances"("workflow_id");

ALTER TABLE "workflow_instances"
    ADD CONSTRAINT "workflow_instances_workflow_id_fkey"
        FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_instances_current_step_id_fkey"
        FOREIGN KEY ("current_step_id") REFERENCES "workflow_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: workflow_step_logs
CREATE TABLE "workflow_step_logs" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "step_id" TEXT,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_step_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_workflow_step_logs_instance_id" ON "workflow_step_logs"("instance_id");

ALTER TABLE "workflow_step_logs"
    ADD CONSTRAINT "workflow_step_logs_instance_id_fkey"
        FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_step_logs_step_id_fkey"
        FOREIGN KEY ("step_id") REFERENCES "workflow_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
