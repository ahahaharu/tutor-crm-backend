# 🎓 Tutor CRM - Backend API

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
[![CI Tests](https://img.shields.io/github/actions/workflow/status/ahahaharu/tutor-crm-backend/tests.yml?label=tests&style=for-the-badge)](https://github.com/ahahaharu/tutor-crm-backend/actions)

An highly scalable backend for a Tutor Customer Relationship Management (CRM) system. Built to automate lesson scheduling, handle billing and transactions, and manage student-parent communications securely.

## ✨ Key Features

* **🔐 Robust Security:** JWT-based authentication with strict data isolation. Tutors can only access their own students and data. Protected against brute-force attacks via global Rate Limiting.
* **📅 Automated Scheduling:** Advanced lesson templating system that automatically generates future calendar events based on cron-like logic.
* **💰 Automated Billing:** Real-time balance calculation using SQL aggregations. Seamlessly handles manual payments, penalty charges, and lesson-based deductions.
* **📖 OpenAPI Documentation:** Fully annotated and auto-generated Swagger UI, ready for frontend code-generation (Orval / RTK Query).
* **🧪 Unbreakable Quality:** Comprehensive E2E and Integration test suites running in parallel via GitHub Actions.

## 🛠️ Tech Stack

* **Framework:** [NestJS](https://nestjs.com/) (`v11.0.1`)
* **Language:** TypeScript (`v5.7.3`)
* **Runtime:** Node.js (`v20` / `v22+`)
* **Database:** PostgreSQL (Driver `pg v8.20.0`)
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/) (`v0.45.1`)
* **Validation:** `class-validator` (`v0.15.1`) & `class-transformer` (`v0.5.1`)
* **Logging:** Pino (`nestjs-pino v4.6.1`)
* **Security:** `@nestjs/throttler` (`v6.5.0`), `@nestjs/jwt` (`v11.0.2`), `bcrypt` (`v6.0.0`)
* **Testing:** Jest (`v30.0.0`), Supertest (`v7.0.0`)
* **Package Manager:** `pnpm` (`v10`)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
* **Node.js** (v20 or higher)
* **pnpm** (v10)
* **Docker & Docker Compose** (for running the database)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ahahaharu/tutor-crm-backend.git
   cd tutor-crm-backend
   ```
2. **Install dependencies:**
   ```bash
   pnpm install
   ```
3. **Environment Setup:**
   
Create a .env file in the root directory based on the provided template:
   ```bash
   cp .env.example .env
   ```
Make sure to update the database credentials and JWT secret in your .env file.

4. **Start the Database:**
   ```bash
   docker compose up -d
   ```
5. **Run Migrations:**
Apply the Drizzle schema to your PostgreSQL database:
   ```bash
   pnpm run db:push
   # Or open Drizzle Studio to inspect the database:
   pnpm run db:studio

## Running the Application:
   ```bash
   # development mode
   pnpm run start
    
   # watch mode (recommended for dev)
   pnpm run start:dev
    
   # production mode
   pnpm run start:prod
   ```
## 📚 API Documentation (Swagger)
Once the application is running, the OpenAPI documentation is accessible at:

👉 http://localhost:3000/api/docs

This Swagger UI provides full schema definitions, endpoint descriptions, required DTOs, and a playground to test requests.

## 🧪 Testing
The project maintains a strict testing culture, separating E2E and Integration tests to ensure maximum reliability and CI/CD parallelization. Note: Tests spin up an isolated Docker database instance automatically.

  ```bash
   # Run integration tests (Database logic, ORM, isolated DB)
   pnpm run test:int
   
   # Run End-to-End tests (Controllers, Guards, App flow, isolated DB)
   pnpm run test:e2e
    
   # Run standard unit tests
   pnpm run test
   ```
## 📁 Project Structure
```plaintext
src/
├── auth/               # JWT Authentication and Registration
├── students/           # Student profiles and avatars
├── parents/            # Parent entity management
├── contacts/           # Polymorphic contacts (Phone, Telegram, etc.)
├── lessons/            # Individual lesson events and billing triggers
├── lesson-templates/   # Automated scheduling rules
├── transactions/       # Payments, charges, and balance calculation
├── database/           # Drizzle ORM setup and connection pooling
├── db/                 # Database schemas and migrations
└── main.ts             # Application entry point
```
## 🛡️ License
This project is licensed under the [MIT License](LICENSE).
