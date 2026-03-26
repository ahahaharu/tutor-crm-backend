import { Test, TestingModule } from '@nestjs/testing';
import { LessonTemplatesController } from './lesson-templates.controller';
import { LessonTemplatesService } from './lesson-templates.service';

describe('LessonTemplatesController', () => {
  let controller: LessonTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonTemplatesController],
      providers: [LessonTemplatesService],
    }).compile();

    controller = module.get<LessonTemplatesController>(LessonTemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
