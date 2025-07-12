export const formatFrequency = (frequency: number, mode: string = "AM"): string => {
  return mode === "FM" ? `${(frequency / 100).toFixed(2)}MHz` : `${frequency.toFixed(2)}kHz`
}

export const responsetoJson = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error status: ${response.status}, body: ${errorText}`);
  }
  return response.json();
}
