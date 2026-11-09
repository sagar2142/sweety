export type Slot = 'morning_fasting' | 'after_breakfast' | 'after_lunch' | 'after_dinner';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Reading {
  id: number;
  /** 'YYYY-MM-DD' */
  date: string;
  slot: Slot;
  /** mg/dl */
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingInput {
  date: string;
  slot: Slot;
  value: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedReadings {
  data: Reading[];
  pagination: Pagination;
}

export interface ReportSummary {
  from: string;
  to: string;
  count: number;
  highest: number | null;
  lowest: number | null;
  average: number | null;
}

export interface DailyReport extends ReportSummary {
  readings: Reading[];
}
