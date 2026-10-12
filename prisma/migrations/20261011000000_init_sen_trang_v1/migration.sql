-- Kích hoạt PostgreSQL Extension phục vụ tìm kiếm tiếng Việt không dấu (V1.3 Spec)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateTable branches
CREATE TABLE "branches" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable study_levels
CREATE TABLE "study_levels" (
    "id" VARCHAR(50) NOT NULL,
    "branch_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "study_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable categories
CREATE TABLE "categories" (
    "id" VARCHAR(80) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable sources
CREATE TABLE "sources" (
    "id" VARCHAR(80) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "branch_id" VARCHAR(50) NOT NULL,
    "level_id" VARCHAR(50) NOT NULL,
    "publication_year" SMALLINT,
    "original_filename" VARCHAR(255),
    "page_count" INTEGER,
    "sha256" CHAR(64),
    "publication_note" TEXT,
    "distribution_rights" TEXT,
    "public_pdf" BOOLEAN NOT NULL DEFAULT false,
    "publisher" VARCHAR(300),

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable lessons
CREATE TABLE "lessons" (
    "id" VARCHAR(80) NOT NULL,
    "branch_id" VARCHAR(50) NOT NULL,
    "level_id" VARCHAR(50) NOT NULL,
    "category_id" VARCHAR(80) NOT NULL,
    "source_id" VARCHAR(80) NOT NULL,
    "title" VARCHAR(400) NOT NULL,
    "slug" VARCHAR(450) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "summary" TEXT,
    "source_pdf_start_page" INTEGER,
    "source_pdf_end_page" INTEGER,
    "content_status" TEXT NOT NULL DEFAULT 'raw_extracted',
    "publish_status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "import_metadata" JSONB,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable lesson_raw_contents
CREATE TABLE "lesson_raw_contents" (
    "id" UUID NOT NULL,
    "lesson_id" VARCHAR(80) NOT NULL,
    "content_format" VARCHAR(80) NOT NULL DEFAULT 'pdf_page_text_v1',
    "editorial_status" VARCHAR(80) NOT NULL DEFAULT 'raw_extracted_not_proofread',
    "pages_json" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_raw_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable lesson_contents
CREATE TABLE "lesson_contents" (
    "id" UUID NOT NULL,
    "lesson_id" VARCHAR(80) NOT NULL,
    "content_json" JSONB NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "edited_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lesson_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable lesson_images
CREATE TABLE "lesson_images" (
    "id" UUID NOT NULL,
    "lesson_id" VARCHAR(80) NOT NULL,
    "storage_key" TEXT NOT NULL,
    "alt_text" TEXT,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable users
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable lesson_revisions
CREATE TABLE "lesson_revisions" (
    "id" UUID NOT NULL,
    "lesson_id" VARCHAR(80) NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "snapshot_json" JSONB NOT NULL,
    "edited_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable audit_logs
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable site_settings
CREATE TABLE "site_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value_json" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_slug_key" ON "branches"("slug");
CREATE UNIQUE INDEX "study_levels_branch_id_slug_key" ON "study_levels"("branch_id", "slug");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");
CREATE INDEX "lessons_publish_status_published_at_idx" ON "lessons"("publish_status", "published_at");
CREATE UNIQUE INDEX "lessons_level_id_category_id_sequence_key" ON "lessons"("level_id", "category_id", "sequence");
CREATE UNIQUE INDEX "lesson_raw_contents_lesson_id_key" ON "lesson_raw_contents"("lesson_id");
CREATE UNIQUE INDEX "lesson_contents_lesson_id_key" ON "lesson_contents"("lesson_id");
CREATE UNIQUE INDEX "lesson_images_storage_key_key" ON "lesson_images"("storage_key");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "lesson_revisions_lesson_id_revision_number_key" ON "lesson_revisions"("lesson_id", "revision_number");
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- AddForeignKey
ALTER TABLE "study_levels" ADD CONSTRAINT "study_levels_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sources" ADD CONSTRAINT "sources_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sources" ADD CONSTRAINT "sources_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "study_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "study_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lesson_raw_contents" ADD CONSTRAINT "lesson_raw_contents_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lesson_images" ADD CONSTRAINT "lesson_images_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_revisions" ADD CONSTRAINT "lesson_revisions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_revisions" ADD CONSTRAINT "lesson_revisions_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
