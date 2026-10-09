CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "education_phase" AS ENUM ('vor_dem_studium', 'im_studium');
CREATE TYPE "profile_interest" AS ENUM (
  'studienwahl',
  'bewerbung',
  'finanzierung',
  'stipendien',
  'studienalltag',
  'karriere'
);
CREATE TYPE "orientation_support" AS ENUM ('ja', 'nein', 'keine_angabe');
CREATE TYPE "roadmap_task_status" AS ENUM ('offen', 'in_bearbeitung', 'erledigt');
CREATE TYPE "chat_message_role" AS ENUM ('user', 'assistant');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "display_name" varchar(120),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "users_display_name_not_blank"
    CHECK ("display_name" IS NULL OR char_length(btrim("display_name")) > 0)
);

CREATE TABLE "profiles" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "phase" "education_phase" NOT NULL,
  "study_program" varchar(200),
  "university" varchar(200),
  "semester" integer,
  "interests" "profile_interest"[] DEFAULT ARRAY[]::profile_interest[] NOT NULL,
  "orientation_support" "orientation_support",
  "onboarding_complete" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "profiles_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "profiles_semester_positive"
    CHECK ("semester" IS NULL OR "semester" > 0),
  CONSTRAINT "profiles_semester_only_for_students"
    CHECK ("phase" = 'im_studium' OR "semester" IS NULL)
);

CREATE TABLE "roadmap_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "template_id" varchar(120) NOT NULL,
  "template_version" integer NOT NULL,
  "phase" "education_phase" NOT NULL,
  "title" varchar(240) NOT NULL,
  "description" text NOT NULL,
  "category" varchar(80) NOT NULL,
  "sort_order" integer NOT NULL,
  "status" "roadmap_task_status" DEFAULT 'offen' NOT NULL,
  "due_date" date,
  "links" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "roadmap_tasks_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "roadmap_tasks_template_version_positive"
    CHECK ("template_version" > 0),
  CONSTRAINT "roadmap_tasks_sort_order_nonnegative"
    CHECK ("sort_order" >= 0),
  CONSTRAINT "roadmap_tasks_title_not_blank"
    CHECK (char_length(btrim("title")) > 0),
  CONSTRAINT "roadmap_tasks_description_not_blank"
    CHECK (char_length(btrim("description")) > 0)
);

CREATE UNIQUE INDEX "roadmap_tasks_user_template_uidx"
  ON "roadmap_tasks" ("user_id", "template_id");
CREATE INDEX "roadmap_tasks_user_phase_order_idx"
  ON "roadmap_tasks" ("user_id", "phase", "sort_order");
CREATE INDEX "roadmap_tasks_user_status_idx"
  ON "roadmap_tasks" ("user_id", "status");

CREATE TABLE "task_checklist_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL,
  "template_item_id" varchar(120) NOT NULL,
  "text" text NOT NULL,
  "sort_order" integer NOT NULL,
  "is_completed" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "task_checklist_items_task_id_roadmap_tasks_id_fk"
    FOREIGN KEY ("task_id") REFERENCES "roadmap_tasks"("id") ON DELETE CASCADE,
  CONSTRAINT "task_checklist_items_sort_order_nonnegative"
    CHECK ("sort_order" >= 0),
  CONSTRAINT "task_checklist_items_text_not_blank"
    CHECK (char_length(btrim("text")) > 0)
);

CREATE UNIQUE INDEX "task_checklist_items_task_template_uidx"
  ON "task_checklist_items" ("task_id", "template_item_id");
CREATE INDEX "task_checklist_items_task_idx"
  ON "task_checklist_items" ("task_id");

CREATE TABLE "chat_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" varchar(160) DEFAULT 'Neue Unterhaltung' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "chat_conversations_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "chat_conversations_title_not_blank"
    CHECK (char_length(btrim("title")) > 0)
);

CREATE INDEX "chat_conversations_user_updated_idx"
  ON "chat_conversations" ("user_id", "updated_at");

CREATE TABLE "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "role" "chat_message_role" NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk"
    FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id")
    ON DELETE CASCADE,
  CONSTRAINT "chat_messages_content_not_blank"
    CHECK (char_length(btrim("content")) > 0)
);

CREATE INDEX "chat_messages_conversation_created_idx"
  ON "chat_messages" ("conversation_id", "created_at");
