import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  time,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  id: uuid('id').defaultRandom().primaryKey(),
  tutorId: uuid('tutor_id')
    .references(() => tutors.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const parents = pgTable('parents', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id')
    .references(() => students.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactTypeEnum = pgEnum('contact_type', [
  'PHONE',
  'TELEGRAM',
  'VIBER',
  'WHATSAPP',
  'VK',
  'DISCORD',
  'CUSTOM',
]);

export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => students.id, {
    onDelete: 'cascade',
  }),
  parentId: uuid('parent_id').references(() => parents.id, {
    onDelete: 'cascade',
  }),

  type: contactTypeEnum('type').notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  customLabel: varchar('custom_label', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
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

export const tutorsRelations = relations(tutors, ({ many }) => ({
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  tutor: one(tutors, {
    fields: [students.tutorId],
    references: [tutors.id],
  }),
  parents: many(parents),
  contacts: many(contacts),
  lessonTemplates: many(lessonTemplates),
  lessons: many(lessons),
  transactions: many(transactions),
}));

export const parentsRelations = relations(parents, ({ one, many }) => ({
  student: one(students, {
    fields: [parents.studentId],
    references: [students.id],
  }),
  contacts: many(contacts),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  student: one(students, {
    fields: [contacts.studentId],
    references: [students.id],
  }),
  parent: one(parents, {
    fields: [contacts.parentId],
    references: [parents.id],
  }),
}));

export const lessonTemplatesRelations = relations(
  lessonTemplates,
  ({ one, many }) => ({
    student: one(students, {
      fields: [lessonTemplates.studentId],
      references: [students.id],
    }),
    lessons: many(lessons),
  }),
);

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  student: one(students, {
    fields: [lessons.studentId],
    references: [students.id],
  }),
  template: one(lessonTemplates, {
    fields: [lessons.templateId],
    references: [lessonTemplates.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  student: one(students, {
    fields: [transactions.studentId],
    references: [students.id],
  }),
  lesson: one(lessons, {
    fields: [transactions.lessonId],
    references: [lessons.id],
  }),
}));
