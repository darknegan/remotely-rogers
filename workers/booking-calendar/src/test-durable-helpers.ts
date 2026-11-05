import { BookingCoordinator } from './booking-coordinator';

export class MemoryStorage {
  private map = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.map.get(key) as T | undefined;
  }

  async put(key: string, value: unknown): Promise<void> {
    this.map.set(key, value);
  }
}

export function createMockKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
    getWithMetadata: async (key: string) => ({
      value: store.get(key) ?? null,
      metadata: null,
      cacheStatus: null,
    }),
  } as unknown as KVNamespace;
}

class MockDurableObjectId {
  constructor(public readonly name: string) {}

  toString(): string {
    return this.name;
  }
}

export function createMockBookingCoordinatorNamespace(): DurableObjectNamespace {
  const instances = new Map<string, BookingCoordinator>();

  const getCoordinator = (name: string): BookingCoordinator => {
    if (!instances.has(name)) {
      instances.set(
        name,
        new BookingCoordinator({ storage: new MemoryStorage() } as DurableObjectState, {}),
      );
    }
    return instances.get(name)!;
  };

  return {
    idFromName: (name: string) => new MockDurableObjectId(name) as unknown as DurableObjectId,
    get: (id: DurableObjectId) => {
      const name = id.toString();
      const coordinator = getCoordinator(name);
      return {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const request = input instanceof Request ? input : new Request(input, init);
          return coordinator.fetch(request);
        },
      } as DurableObjectStub;
    },
  } as unknown as DurableObjectNamespace;
}
