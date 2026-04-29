---
trigger: always_on
---

Стек технологий:

Framework: NestJS (Node.js)

Language: TypeScript (строгий режим)

Database: PostgreSQL

ORM: Drizzle ORM (используется схема-файл src/db/schema.ts)

Auth: JWT + Passport, стратегия хеширования паролей — bcrypt.

Automation: @nestjs/schedule (Cron Jobs).

Infrastructure: Docker Compose (только для PostgreSQL на текущем этапе).

Архитектурные принципы:

Zero Trust (Изоляция): Все данные принадлежат конкретному tutorId. Доступ к студентам, урокам или транзакциям других репетиторов запрещен (реализовано через checkStudentOwnership и JOIN-ы в сервисах).

Динамический баланс: Баланс студента не хранится числом в БД, а вычисляется на лету через агрегацию транзакций (SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE -amount END)).

Атомарность: Финансовые операции (списания при завершении урока) выполняются внутри транзакций БД (db.transaction).

Текущее состояние модулей:

Auth: Полноценный логин/регистрация. Токены хранят sub (userId) и email.

Students: CRUD + Soft Delete (isArchived). Есть поле defaultPrice — базовая ставка ученика.

Transactions: Типы PAYMENT (плюс) и CHARGE (минус). Связаны с studentId и опционально с lessonId.

Lessons: Статусы PLANNED, COMPLETED, CANCELED, MISSED. Смена статуса на COMPLETED автоматически создает транзакцию списания.

LessonTemplates: Шаблоны для повторяющихся уроков. Включают логику автоматической генерации уроков на 4 недели вперед. Реализован Cron Job (каждый день в 03:00), который догенерирует уроки, если их осталось меньше чем на 14 дней.

Текущая задача:
Мы находимся на ветке feat/smart-templates. Только что внедрили Cron Job и связали defaultPrice студента с автоматическим заполнением цены в уроках и шаблонах. Все ESLint ошибки по енамам и типам исправлены.
