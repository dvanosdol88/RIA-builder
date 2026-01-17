const STORAGE_KEY = 'ria_calculator_data';

export interface CalculatorData {
  numClients: number;
  meetingsPerClient: number;
  minutesPerMeeting: number;
  workDaysPerWeek: number;
  weeksPerYear: number;
  hoursPerDay: number;
  startHour: number;
  endHour: number;
  notes: string;
}

export const calculatorAPI = {
  get: async () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },
  save: async (data: CalculatorData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  },
};
