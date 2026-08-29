import { pgTable, text, varchar, timestamp, integer, uuid, boolean, date } from 'drizzle-orm/pg-core';

// 1. users: Data akun Google user
export const users = pgTable('users', {
  id: text('id').primaryKey(), // google sub ID atau uuid
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  picture: text('picture'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;

// 2. sessions: Session login berbasis cookie aman
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
});

export type Session = typeof sessions.$inferSelect;

// 3. reading_sessions (Migrasi dari tabel progress lama & rekaman khatam)
export const readingSessions = pgTable('reading_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  khatamPlanId: uuid('khatam_plan_id').references(() => khatamPlans.id, { onDelete: 'cascade' }),
  startSurah: integer('start_surah').notNull(),
  startAyah: integer('start_ayah').notNull(),
  startPage: integer('start_page'),
  startJuz: integer('start_juz'),
  endSurah: integer('end_surah').notNull(),
  endAyah: integer('end_ayah').notNull(),
  endPage: integer('end_page'),
  endJuz: integer('end_juz'),
  totalAyahRead: integer('total_ayah_read').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. last_read: Pointer cepat posisi bacaan terakhir
export const lastRead = pgTable('last_read', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  surahNumber: integer('surah_number').notNull(),
  ayahNumber: integer('ayah_number').notNull(),
  juzNumber: integer('juz_number'),
  pageNumber: integer('page_number'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. bookmarks: Penanda ayat favorit dengan label/tag
export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  surahNumber: integer('surah_number').notNull(),
  ayahNumber: integer('ayah_number').notNull(),
  collectionName: varchar('collection_name', { length: 100 }).default('Favorit'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. khatam_plans: Rencana target khatam Al-Qur'an
export const khatamPlans = pgTable('khatam_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  targetDate: date('target_date').notNull(),
  isCompleted: boolean('is_completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
