import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const educationPhaseEnum = pgEnum("education_phase", [
  "vor_dem_studium",
  "im_studium",
]);

export const profileInterestEnum = pgEnum("profile_interest", [
  "studienwahl",
  "bewerbung",
  "finanzierung",
  "stipendien",
  "studienalltag",
  "karriere",
]);

export const orientationSupportEnum = pgEnum("orientation_support", [
  "ja",
  "nein",
  "keine_angabe",
]);

export const roadmapTaskStatusEnum = pgEnum("roadmap_task_status", [
  "offen",
  "in_bearbeitung",
  "erledigt",
]);

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user",
  "assistant",
]);

export interface RoadmapLink {
  label: string;
  url: string;
}

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayName: varchar("display_name", { length: 120 }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '7 days'`),
    ...timestamps,
  },
  (table) => [
    check(
      "users_display_name_not_blank",
      sql`${table.displayName} is null or char_length(btrim(${table.displayName})) > 0`,
    ),
  ],
);

export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    phase: educationPhaseEnum("phase").notNull(),
    studyProgram: varchar("study_program", { length: 200 }),
    university: varchar("university", { length: 200 }),
    semester: integer("semester"),
    interests: profileInterestEnum("interests")
      .array()
      .notNull()
      .default(sql`ARRAY[]::profile_interest[]`),
    orientationSupport: orientationSupportEnum("orientation_support"),
    onboardingComplete: boolean("onboarding_complete").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    check(
      "profiles_semester_positive",
      sql`${table.semester} is null or ${table.semester} > 0`,
    ),
    check(
      "profiles_semester_only_for_students",
      sql`${table.phase} = 'im_studium' or ${table.semester} is null`,
    ),
  ],
);

export const roadmapTasks = pgTable(
  "roadmap_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    templateId: varchar("template_id", { length: 120 }).notNull(),
    templateVersion: integer("template_version").notNull(),
    phase: educationPhaseEnum("phase").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    sortOrder: integer("sort_order").notNull(),
    status: roadmapTaskStatusEnum("status").notNull().default("offen"),
    dueDate: date("due_date", { mode: "string" }),
    links: jsonb("links")
      .$type<RoadmapLink[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("roadmap_tasks_user_template_uidx").on(
      table.userId,
      table.templateId,
    ),
    index("roadmap_tasks_user_phase_order_idx").on(
      table.userId,
      table.phase,
      table.sortOrder,
    ),
    index("roadmap_tasks_user_status_idx").on(table.userId, table.status),
    check(
      "roadmap_tasks_template_version_positive",
      sql`${table.templateVersion} > 0`,
    ),
    check("roadmap_tasks_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
    check(
      "roadmap_tasks_title_not_blank",
      sql`char_length(btrim(${table.title})) > 0`,
    ),
    check(
      "roadmap_tasks_description_not_blank",
      sql`char_length(btrim(${table.description})) > 0`,
    ),
  ],
);

export const taskChecklistItems = pgTable(
  "task_checklist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => roadmapTasks.id, { onDelete: "cascade" }),
    templateItemId: varchar("template_item_id", { length: 120 }).notNull(),
    text: text("text").notNull(),
    sortOrder: integer("sort_order").notNull(),
    isCompleted: boolean("is_completed").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("task_checklist_items_task_template_uidx").on(
      table.taskId,
      table.templateItemId,
    ),
    index("task_checklist_items_task_idx").on(table.taskId),
    check(
      "task_checklist_items_sort_order_nonnegative",
      sql`${table.sortOrder} >= 0`,
    ),
    check(
      "task_checklist_items_text_not_blank",
      sql`char_length(btrim(${table.text})) > 0`,
    ),
  ],
);

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull().default("Neue Unterhaltung"),
    ...timestamps,
  },
  (table) => [
    index("chat_conversations_user_updated_idx").on(
      table.userId,
      table.updatedAt,
    ),
    check(
      "chat_conversations_title_not_blank",
      sql`char_length(btrim(${table.title})) > 0`,
    ),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: chatMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("chat_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    check(
      "chat_messages_content_not_blank",
      sql`char_length(btrim(${table.content})) > 0`,
    ),
  ],
);

export const usageCounters = pgTable(
  "usage_counters",
  {
    scope: varchar("scope", { length: 32 }).notNull(),
    identifierHash: varchar("identifier_hash", { length: 128 }).notNull(),
    bucketStart: timestamp("bucket_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    primaryKey({
      name: "usage_counters_pk",
      columns: [table.scope, table.identifierHash, table.bucketStart],
    }),
    index("usage_counters_bucket_idx").on(table.bucketStart),
    check("usage_counters_count_positive", sql`${table.count} > 0`),
  ],
);

export const aiLeases = pgTable(
  "ai_leases",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("ai_leases_expires_idx").on(table.expiresAt)],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  roadmapTasks: many(roadmapTasks),
  chatConversations: many(chatConversations),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const roadmapTasksRelations = relations(
  roadmapTasks,
  ({ one, many }) => ({
    user: one(users, {
      fields: [roadmapTasks.userId],
      references: [users.id],
    }),
    checklistItems: many(taskChecklistItems),
  }),
);

export const taskChecklistItemsRelations = relations(
  taskChecklistItems,
  ({ one }) => ({
    task: one(roadmapTasks, {
      fields: [taskChecklistItems.taskId],
      references: [roadmapTasks.id],
    }),
  }),
);

export const chatConversationsRelations = relations(
  chatConversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [chatConversations.userId],
      references: [users.id],
    }),
    messages: many(chatMessages),
  }),
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type RoadmapTask = typeof roadmapTasks.$inferSelect;
export type TaskChecklistItem = typeof taskChecklistItems.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type UsageCounter = typeof usageCounters.$inferSelect;
export type AiLease = typeof aiLeases.$inferSelect;
