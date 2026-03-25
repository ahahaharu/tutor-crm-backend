import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  time,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const lessonStatusEnum = pgEnum('lesson_status', [
  'PLANNED',
  'COMPLETED',
  'CANCELED',
  'MISSED',
]);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'PAYMENT',
  'CHARGE',
]);

export const tutors = pgTable('tutors', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  tutorId: uuid('tutor_id')
    .notNull()
    .references(() => tutors.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  contactInfo: varchar('contact_info', { length: 255 }),
});

export const lessonTemplates = pgTable('lesson_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  defaultPrice: integer('default_price').notNull(),
  intervalWeeks: integer('interval_weeks').notNull().default(1),
  firstLessonDate: timestamp('first_lesson_date', { mode: 'date' }).notNull(),
});

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => lessonTemplates.id, {
    onDelete: 'set null',
  }),
  scheduledAt: timestamp('scheduled_at', { mode: 'date' }).notNull(),
  status: lessonStatusEnum('status').notNull().default('PLANNED'),
  priceToCharge: integer('price_to_charge').notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').references(() => lessons.id, {
    onDelete: 'set null',
  }),
  amount: integer('amount').notNull(),
  type: transactionTypeEnum('type').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
