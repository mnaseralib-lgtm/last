export enum AppView {
  SCANNER = 'scanner',
  REPORTS = 'reports',
}

export enum ReportType {
  NONE = 'none',
  SINGLE_LABOR = 'single_labor',
  DAILY = 'daily',
  PERIOD = 'period',
}

export interface ReportData {
  headers: string[];
  rows: (string | number)[][];
  title: string;
}

export interface EmployeeInfo {
  name: string;
  department: string;
}

export interface AttendanceResponse {
  status: 'success' | 'error';
  message: string;
  employee?: EmployeeInfo;
}