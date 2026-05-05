-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('draft', 'active', 'completed', 'late', 'liquidated');

-- CreateEnum
CREATE TYPE "HandoverStatus" AS ENUM ('pending', 'active', 'completed', 'late');

-- CreateEnum
CREATE TYPE "WarrantyType" AS ENUM ('warranty', 'repair', 'maintenance');

-- CreateEnum
CREATE TYPE "WarrantyPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('open', 'processing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('identified', 'consumable');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('developing', 'producing', 'equipped', 'stopped');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('planning', 'active', 'completed', 'suspended');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'review', 'completed', 'delayed');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('research', 'report', 'fieldwork', 'admin', 'review');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('internal', 'external', 'online');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('planned', 'ongoing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'pending');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('planned', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('contract', 'technical', 'policy', 'training', 'report', 'other');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('pdf', 'doc', 'xls', 'img', 'other');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "contracts_count" INTEGER NOT NULL DEFAULT 0,
    "active_contracts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "title" TEXT NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "products" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "warranty_end" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'draft',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handovers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "products" INTEGER NOT NULL DEFAULT 0,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" "HandoverStatus" NOT NULL DEFAULT 'pending',
    "start_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranties" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contract_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "product_id" TEXT,
    "assignee_id" TEXT,
    "issue" TEXT NOT NULL,
    "source" TEXT,
    "type" "WarrantyType" NOT NULL,
    "priority" "WarrantyPriority" NOT NULL DEFAULT 'medium',
    "status" "WarrantyStatus" NOT NULL DEFAULT 'open',
    "workflow_step" INTEGER NOT NULL DEFAULT 1,
    "sla_hours" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "warranties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "serial" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "warehouse" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contract_id" TEXT,
    "customer_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'developing',
    "version" TEXT,
    "manufacturer" TEXT,
    "unit" TEXT,
    "year_released" INTEGER,
    "total_produced" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_projects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "manager_id" TEXT,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "funding_source" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'planning',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "budget" DECIMAL(18,2),
    "budget_spent" DECIMAL(18,2),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "research_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "project_id" TEXT,
    "assignee_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "type" "TaskType" NOT NULL DEFAULT 'admin',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contract_id" TEXT,
    "customer_id" TEXT,
    "instructor_id" TEXT,
    "title" TEXT NOT NULL,
    "type" "TrainingType" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "status" "TrainingStatus" NOT NULL DEFAULT 'planned',
    "location" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainees" (
    "id" TEXT NOT NULL,
    "training_course_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "unit" TEXT,
    "rank" TEXT,
    "attendance" "AttendanceStatus" NOT NULL DEFAULT 'pending',
    "score" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "trainees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_sessions" (
    "id" TEXT NOT NULL,
    "training_course_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "location" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'planned',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "schedule_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "owner_id" TEXT,
    "customer_id" TEXT,
    "contract_id" TEXT,
    "product_id" TEXT,
    "project_id" TEXT,
    "training_course_id" TEXT,
    "name" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "file_type" "FileType" NOT NULL,
    "file_size" TEXT,
    "file_url" TEXT,
    "tags" TEXT[],
    "description" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MaterialToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MaterialToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "idx_roles_deleted_at" ON "roles"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role_id" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_users_deleted_at" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE INDEX "idx_customers_name" ON "customers"("name");

-- CreateIndex
CREATE INDEX "idx_customers_deleted_at" ON "customers"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_contacts_customer_id" ON "contacts"("customer_id");

-- CreateIndex
CREATE INDEX "idx_contacts_deleted_at" ON "contacts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_code_key" ON "contracts"("code");

-- CreateIndex
CREATE INDEX "idx_contracts_customer_id" ON "contracts"("customer_id");

-- CreateIndex
CREATE INDEX "idx_contracts_created_by_id" ON "contracts"("created_by_id");

-- CreateIndex
CREATE INDEX "idx_contracts_status" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "idx_contracts_date_range" ON "contracts"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "idx_contracts_deleted_at" ON "contracts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "handovers_code_key" ON "handovers"("code");

-- CreateIndex
CREATE INDEX "idx_handovers_contract_id" ON "handovers"("contract_id");

-- CreateIndex
CREATE INDEX "idx_handovers_customer_id" ON "handovers"("customer_id");

-- CreateIndex
CREATE INDEX "idx_handovers_created_by_id" ON "handovers"("created_by_id");

-- CreateIndex
CREATE INDEX "idx_handovers_status" ON "handovers"("status");

-- CreateIndex
CREATE INDEX "idx_handovers_deleted_at" ON "handovers"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "warranties_code_key" ON "warranties"("code");

-- CreateIndex
CREATE INDEX "idx_warranties_contract_id" ON "warranties"("contract_id");

-- CreateIndex
CREATE INDEX "idx_warranties_customer_id" ON "warranties"("customer_id");

-- CreateIndex
CREATE INDEX "idx_warranties_product_id" ON "warranties"("product_id");

-- CreateIndex
CREATE INDEX "idx_warranties_assignee_id" ON "warranties"("assignee_id");

-- CreateIndex
CREATE INDEX "idx_warranties_status_priority" ON "warranties"("status", "priority");

-- CreateIndex
CREATE INDEX "idx_warranties_deleted_at" ON "warranties"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "materials_code_key" ON "materials"("code");

-- CreateIndex
CREATE INDEX "idx_materials_type" ON "materials"("type");

-- CreateIndex
CREATE INDEX "idx_materials_warehouse" ON "materials"("warehouse");

-- CreateIndex
CREATE INDEX "idx_materials_deleted_at" ON "materials"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE INDEX "idx_products_contract_id" ON "products"("contract_id");

-- CreateIndex
CREATE INDEX "idx_products_customer_id" ON "products"("customer_id");

-- CreateIndex
CREATE INDEX "idx_products_status" ON "products"("status");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category");

-- CreateIndex
CREATE INDEX "idx_products_deleted_at" ON "products"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "research_projects_code_key" ON "research_projects"("code");

-- CreateIndex
CREATE INDEX "idx_research_projects_manager_id" ON "research_projects"("manager_id");

-- CreateIndex
CREATE INDEX "idx_research_projects_status" ON "research_projects"("status");

-- CreateIndex
CREATE INDEX "idx_research_projects_date_range" ON "research_projects"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "idx_research_projects_deleted_at" ON "research_projects"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_code_key" ON "tasks"("code");

-- CreateIndex
CREATE INDEX "idx_tasks_project_id" ON "tasks"("project_id");

-- CreateIndex
CREATE INDEX "idx_tasks_assignee_id" ON "tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "idx_tasks_status_priority" ON "tasks"("status", "priority");

-- CreateIndex
CREATE INDEX "idx_tasks_deadline" ON "tasks"("deadline");

-- CreateIndex
CREATE INDEX "idx_tasks_deleted_at" ON "tasks"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "training_courses_code_key" ON "training_courses"("code");

-- CreateIndex
CREATE INDEX "idx_training_courses_contract_id" ON "training_courses"("contract_id");

-- CreateIndex
CREATE INDEX "idx_training_courses_customer_id" ON "training_courses"("customer_id");

-- CreateIndex
CREATE INDEX "idx_training_courses_instructor_id" ON "training_courses"("instructor_id");

-- CreateIndex
CREATE INDEX "idx_training_courses_status" ON "training_courses"("status");

-- CreateIndex
CREATE INDEX "idx_training_courses_deleted_at" ON "training_courses"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_trainees_training_course_id" ON "trainees"("training_course_id");

-- CreateIndex
CREATE INDEX "idx_trainees_attendance" ON "trainees"("attendance");

-- CreateIndex
CREATE INDEX "idx_trainees_deleted_at" ON "trainees"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_schedule_sessions_training_course_id" ON "schedule_sessions"("training_course_id");

-- CreateIndex
CREATE INDEX "idx_schedule_sessions_date" ON "schedule_sessions"("date");

-- CreateIndex
CREATE INDEX "idx_schedule_sessions_deleted_at" ON "schedule_sessions"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "documents_code_key" ON "documents"("code");

-- CreateIndex
CREATE INDEX "idx_documents_owner_id" ON "documents"("owner_id");

-- CreateIndex
CREATE INDEX "idx_documents_customer_id" ON "documents"("customer_id");

-- CreateIndex
CREATE INDEX "idx_documents_contract_id" ON "documents"("contract_id");

-- CreateIndex
CREATE INDEX "idx_documents_product_id" ON "documents"("product_id");

-- CreateIndex
CREATE INDEX "idx_documents_project_id" ON "documents"("project_id");

-- CreateIndex
CREATE INDEX "idx_documents_training_course_id" ON "documents"("training_course_id");

-- CreateIndex
CREATE INDEX "idx_documents_category" ON "documents"("category");

-- CreateIndex
CREATE INDEX "idx_documents_uploaded_at" ON "documents"("uploaded_at");

-- CreateIndex
CREATE INDEX "idx_documents_deleted_at" ON "documents"("deleted_at");

-- CreateIndex
CREATE INDEX "_MaterialToProduct_B_index" ON "_MaterialToProduct"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainees" ADD CONSTRAINT "trainees_training_course_id_fkey" FOREIGN KEY ("training_course_id") REFERENCES "training_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_sessions" ADD CONSTRAINT "schedule_sessions_training_course_id_fkey" FOREIGN KEY ("training_course_id") REFERENCES "training_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_training_course_id_fkey" FOREIGN KEY ("training_course_id") REFERENCES "training_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialToProduct" ADD CONSTRAINT "_MaterialToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialToProduct" ADD CONSTRAINT "_MaterialToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
