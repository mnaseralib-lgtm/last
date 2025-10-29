import { AttendanceResponse, ReportData, ReportType } from '../types';

// The user's latest provided URL.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwRtPYKLPkl58atPByBKtMx6aNy4-yklZypgs3c7vOl-hQknJ8G-itvemHp5cHpnhJl/exec';

interface ReportParams {
    reportType: ReportType;
    hrCode?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
}

/**
 * Posts an attendance record.
 */
export const postAttendance = async (hrCode: string, action: string): Promise<AttendanceResponse> => {
    const formData = new FormData();
    formData.append('action', 'postAttendance');
    formData.append('hrCode', hrCode);
    // Correct parameter name for the backend script.
    formData.append('recordAction', action);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network error: ${response.status} - ${response.statusText}. Response: ${errorText}`);
        }

        const result: AttendanceResponse = await response.json();
        
        if (result.status === 'error') {
            throw new Error(result.message || 'An unknown error occurred on the server.');
        }

        return result;
    } catch (error) {
        console.error('Failed to post attendance:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred during the request.');
    }
};

/**
 * Fetches report data using POST to prevent caching issues.
 */
export const getReportData = async (params: ReportParams): Promise<ReportData> => {
    const formData = new FormData();
    // Correct action name for the backend script.
    formData.append('action', 'getReportData'); 
    formData.append('reportType', params.reportType);

    if (params.hrCode) formData.append('hrCode', params.hrCode);
    if (params.date) formData.append('date', params.date);
    if (params.startDate) formData.append('startDate', params.startDate);
    if (params.endDate) formData.append('endDate', params.endDate);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network error: ${response.status} - ${response.statusText}. Response: ${errorText}`);
        }
        
        const result: ReportData | { status: 'error', message: string } = await response.json();

        // Check for server-side error message in the response
        if (result && 'status' in result && result.status === 'error') {
             throw new Error(result.message || 'An unknown error occurred on the server.');
        }

        return result as ReportData;
    } catch (error) {
        console.error('Failed to get report data:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred while fetching the report.');
    }
};