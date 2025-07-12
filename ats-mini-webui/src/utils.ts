export const responseToJson = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error status: ${response.status}, body: ${errorText}`);
  }
  return response.json();
}

export const setCellText = (id: string, text: string) => {
  const cell = document.getElementById(id);
  if (cell) cell.textContent = text;
}

export const inputValue = <T extends HTMLInputElement | HTMLSelectElement>(id: string): string => (document.getElementById(id) as T).value
export const setInputValue = <T extends HTMLInputElement | HTMLSelectElement>(id: string, value: string) => {
  (document.getElementById(id) as T).value = value
}

export const checkboxValue = (id: string): boolean => (document.getElementById(id) as HTMLInputElement).checked
export const setCheckboxValue = (id: string, checked: boolean) => {
  (document.getElementById(id) as HTMLInputElement).checked = checked
}

export const populateSelect = (selectId: string, options: { value: string, label: string }[]) => {
  const select = document.getElementById(selectId);
  if (!select) {
    return;
  }

  options.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value.toString();
    option.textContent = item.label;
    select.appendChild(option);
  })
}

export const formatFrequency = (frequency: number, mode: string = "AM"): string => {
  return mode === "FM" ? `${(frequency / 100).toFixed(2)}MHz` : `${frequency.toFixed(2)}kHz`
}
