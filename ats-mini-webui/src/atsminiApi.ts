import type {Config, ConfigOptions, Memory, MemoryOptions, Status, StatusOptions} from "./types.ts";

const responseToJson = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error status: ${response.status}, body: ${errorText}`);
  }
  return response.json();
}

const requestToJsonInit = (element: Partial<Status> | Memory | Memory[] | Config): RequestInit => ({
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(element)
})

const jsonFetch = (url: string, options?: RequestInit) => fetch(url, options)
  .then(responseToJson)
  .catch(error => {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  });

export const statusApi = (): Promise<Status> => jsonFetch('/api/status')

export const saveStatusApi = (status: Partial<Status>): Promise<Status> => jsonFetch('/api/status', requestToJsonInit(status))

export const statusOptionsApi = (): Promise<StatusOptions> => jsonFetch('/api/statusOptions')

export const memoriesApi = (): Promise<Memory[]> => jsonFetch('/api/memory')

export const clearMemoryApi = (id: number): Promise<Memory[]> => jsonFetch(`/api/memory/${id}`, {method: 'DELETE'})

export const tuneMemoryApi = (id: number): Promise<Memory[]> => jsonFetch(`/api/memory/${id}/tune`, {method: 'POST'})

export const storeMemoryApi = (id: number): Promise<Memory[]> => jsonFetch(`/api/memory/${id}/storeCurrent`, {method: 'POST'})

export const saveMemoryApi = (memory: Memory): Promise<Memory[]> => jsonFetch(`/api/memory/${memory.id}`, requestToJsonInit(memory))

export const saveMemoriesApi = (memories: Memory[]): Promise<Memory[]> => jsonFetch(`/api/memory`, requestToJsonInit(memories))

export const memoriesOptionsApi = (): Promise<MemoryOptions> => jsonFetch('/api/memoryOptions')

export const configApi = (): Promise<Config> => jsonFetch('/api/config')

export const saveConfigApi = (config: Config): Promise<Config> => jsonFetch('/api/config', requestToJsonInit(config))

export const configOptionsApi = (): Promise<ConfigOptions> => jsonFetch('/api/configOptions')
