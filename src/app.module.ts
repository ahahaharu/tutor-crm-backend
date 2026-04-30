import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TutorsModule } from './tutors/tutors.module';
import { StudentsModule } from './students/students.module';
import { LessonTemplatesModule } from './lesson-templates/lesson-templates.module';
import { LessonsModule } from './lessons/lessons.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ParentsModule } from './parents/parents.module';
import { ContactsModule } from './contacts/contacts.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
        autoLogging: false,
      },
    }),
    DatabaseModule,
    TutorsModule,
    DatabaseModule,
    TutorsModule,
    StudentsModule,
    LessonTemplatesModule,
    LessonsModule,
    TransactionsModule,
    AuthModule,
    ParentsModule,
    ContactsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
