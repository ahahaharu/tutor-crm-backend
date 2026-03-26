import { Test, TestingModule } from '@nestjs/testing';
import { LessonTemplatesService } from './lesson-templates.service';

describe('LessonTemplatesService', () => {
  let service: LessonTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LessonTemplatesService],
    }).compile();

    service = module.get<LessonTemplatesService>(LessonTemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
