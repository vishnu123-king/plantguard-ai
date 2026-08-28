import { FarmContext, CreateFarmInput } from '../shared/types/farm.types';

export class FarmRepository {
  private farms: Map<string, FarmContext>;

  constructor() {
    this.farms = new Map();
    this.seedDefaultFarms();
  }

  private seedDefaultFarms() {
    const defaultFarm: FarmContext = {
      id: 'farm_001',
      name: 'Coimbatore Agro Research Field A',
      location: {
        latitude: 11.0168,
        longitude: 76.9558,
        accuracyM: 6.4
      },
      cropType: 'Tomato',
      cropVariety: 'Pusa Ruby',
      plantingDate: '2026-07-15',
      growthStage: 'flowering',
      waterSource: 'borewell',
      waterCondition: 'sufficient',
      notes: 'South parcel with drip irrigation',
      createdAt: '2026-07-15T06:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z'
    };

    const defaultFarm2: FarmContext = {
      id: 'farm_002',
      name: 'Nashik Vineyard Block 4',
      location: {
        latitude: 20.0059,
        longitude: 73.7898,
        accuracyM: 4.8
      },
      cropType: 'Grape',
      cropVariety: 'Thompson Seedless',
      plantingDate: '2026-03-10',
      growthStage: 'fruiting',
      waterSource: 'drip_irrigation',
      waterCondition: 'moderate',
      notes: 'Active black rot monitoring parcel',
      createdAt: '2026-03-10T08:00:00.000Z',
      updatedAt: '2026-08-10T12:00:00.000Z'
    };

    this.farms.set(defaultFarm.id, defaultFarm);
    this.farms.set(defaultFarm2.id, defaultFarm2);
  }

  async createFarm(input: CreateFarmInput): Promise<FarmContext> {
    const id = `farm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const farm: FarmContext = {
      id,
      name: input.name || `${input.cropType} Plot (${input.latitude.toFixed(2)}, ${input.longitude.toFixed(2)})`,
      location: {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyM: input.accuracyM ?? undefined
      },
      cropType: input.cropType,
      cropVariety: input.cropVariety || 'unknown',
      plantingDate: input.plantingDate,
      growthStage: input.growthStage,
      waterSource: input.waterSource,
      waterCondition: input.waterCondition,
      notes: input.notes,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.farms.set(id, farm);
    return farm;
  }

  async getFarmById(id: string): Promise<FarmContext | null> {
    return this.farms.get(id) || null;
  }

  async listFarms(): Promise<FarmContext[]> {
    return Array.from(this.farms.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async deleteFarm(id: string): Promise<boolean> {
    return this.farms.delete(id);
  }
}

export const farmRepository = new FarmRepository();
