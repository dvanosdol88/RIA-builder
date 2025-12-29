const STORAGE_KEY = 'ria_calculator_data';

export const calculatorAPI = {
  get: async () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },
  save: async (data: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  }
};
