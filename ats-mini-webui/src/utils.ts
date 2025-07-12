export const byId = (id: string) => document.getElementById(id);

export const responseToJson = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error status: ${response.status}, body: ${errorText}`);
  }
  return response.json();
}

export const setCellText = (id: string, text: string) => {
  const cell = byId(id);
  if (cell) cell.textContent = text;
}

export const inputValue = <T extends HTMLInputElement | HTMLSelectElement>(id: string): string => (byId(id) as T).value
export const setInputValue = <T extends HTMLInputElement | HTMLSelectElement>(id: string, value: string) => {
  (byId(id) as T).value = value
}

export const checkboxValue = (id: string): boolean => (byId(id) as HTMLInputElement).checked
export const setCheckboxValue = (id: string, checked: boolean) => {
  (byId(id) as HTMLInputElement).checked = checked
}

export const populateSelect = (selectId: string, options: { value: string, label: string }[]) => {
  const select = byId(selectId);
  if (!select) {
    return;
  }

  select.replaceChildren(...options.map(i => {
    const option = document.createElement('option');
    option.value = i.value;
    option.textContent = i.label;
    return option;
  }))
}

export const formatFrequency = (frequencyHz: number, mode: string = "FM", noUnit = false): string => {
  return mode === "FM" ? `${(frequencyHz / 1000 / 1000).toFixed(2)}${!noUnit ? 'MHz' : ''}` : `${(frequencyHz / 1000).toFixed(3)}${!noUnit ? 'kHz' : ''}`
}
