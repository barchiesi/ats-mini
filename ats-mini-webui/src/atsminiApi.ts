import type {Config, ConfigOptions, Memory, Status} from "./types.ts";

const responseToJson = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error status: ${response.status}, body: ${errorText}`);
  }
  return response.json();
}

const jsonFetch = (url: string, options?: RequestInit) => fetch(url, options)
  .then(responseToJson)
  .catch(error => {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  });

export const statusApi = (): Promise<Status> => jsonFetch('/api/status')

export const memoriesApi = (): Promise<Memory[]> => jsonFetch('/api/memory')

export const configApi = (): Promise<Config> => jsonFetch('/api/config')

export const saveConfigApi = (config: Config): Promise<Config> => jsonFetch('/api/config', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(config)
})

export const configOptionsApi = (): Promise<ConfigOptions> => jsonFetch('/api/configOptions')
