import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DiseasesService } from './diseases.service';
import { Disease } from './schemas/disease.schema';
import { PetSpecies } from '../../common/enums/species.enum';
import { RiskLevel } from '../../common/enums/risk-level.enum';

describe('DiseasesService - Symptom Checker Business Rules', () => {
  let service: DiseasesService;

  const mockDiseases = [
    {
      name: 'Canine Parvovirus',
      affectedSpecies: [PetSpecies.DOG],
      symptoms: ['vomiting', 'severe diarrhea', 'lethargy', 'loss of appetite', 'fever'],
      riskLevel: RiskLevel.HIGH,
    },
    {
      name: 'Kennel Cough',
      affectedSpecies: [PetSpecies.DOG],
      symptoms: ['coughing', 'sneezing', 'runny nose', 'loss of appetite', 'lethargy'],
      riskLevel: RiskLevel.MEDIUM,
    },
  ];

  const mockDiseaseModel = {
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDiseases),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiseasesService,
        {
          provide: getModelToken(Disease.name),
          useValue: mockDiseaseModel,
        },
      ],
    }).compile();

    service = module.get<DiseasesService>(DiseasesService);
  });

  it('should calculate match confidence percentage correctly: (matched / total) * 100', async () => {
    const result = await service.checkSymptoms({
      species: PetSpecies.DOG,
      symptoms: ['vomiting', 'lethargy', 'loss of appetite'],
    });

    const parvo = result.matches.find((m) => m.disease === 'Canine Parvovirus');
    expect(parvo).toBeDefined();
    expect(parvo?.matchConfidence).toBe(60);

    const cough = result.matches.find((m) => m.disease === 'Kennel Cough');
    expect(cough).toBeDefined();
    expect(cough?.matchConfidence).toBe(40);
  });

  it('should sort results in descending order of match confidence', async () => {
    const result = await service.checkSymptoms({
      species: PetSpecies.DOG,
      symptoms: ['vomiting', 'lethargy', 'loss of appetite'],
    });

    expect(result.matches[0].disease).toBe('Canine Parvovirus');
    expect(result.matches[1].disease).toBe('Kennel Cough');
  });

  it('should provide prompt veterinary triage guidance for HIGH risk conditions', async () => {
    const result = await service.checkSymptoms({
      species: PetSpecies.DOG,
      symptoms: ['vomiting'],
    });

    const highRiskMatch = result.matches.find((m) => m.riskLevel === RiskLevel.HIGH);
    expect(highRiskMatch?.triageGuidance).toBe('Arrange a veterinary examination promptly.');
  });
});
