import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TutorsModule } from './tutors/tutors.module';
import { StudentsModule } from './students/students.module';
import { LessonTemplatesModule } from './lesson-templates/lesson-templates.module';
import { LessonsModule } from './lessons/lessons.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DatabaseModule, TutorsModule, StudentsModule, LessonTemplatesModule, LessonsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
