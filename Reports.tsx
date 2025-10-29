import React, { useState } from 'react';
import { getReportData } from '../services/googleSheetsService';
import { ReportType } from '../types';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import { ExcelIcon, PdfIcon } from './icons';

// This type now represents any report coming from the server,
// including the pre-processed daily report.
interface ServerReportData {
    title: string;
    headers: string[];
    rows: (string | number)[][];
}

const Reports: React.FC = () => {
    const [reportType, setReportType] = useState<ReportType>(ReportType.NONE);
    const [hrCode, setHrCode] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState<ServerReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateReport = async () => {
        if (reportType === ReportType.NONE) {
            setError('الرجاء اختيار نوع التقرير.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setReportData(null);

        try {
            const params = {
                reportType,
                hrCode,
                date,
                startDate,
                endDate,
            };
            
            // Fetch the pre-processed data from the server
            const data: ServerReportData = await getReportData(params);

            // Basic validation to ensure we received a valid report structure
            if (data && data.title && Array.isArray(data.headers) && Array.isArray(data.rows)) {
                setReportData(data);
            } else {
                 console.error("Malformed report data from server:", data);
                 setError("فشل في تحليل بيانات التقرير من الخادم. يرجى مراجعة Google Script.");
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء جلب البيانات.";
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderInputs = () => {
        switch (reportType) {
            case ReportType.SINGLE_LABOR:
                return (
                    <>
                        <div className="flex-1 min-w-[150px]">
                            <label htmlFor="hrCode" className="block text-sm font-medium text-gray-700 mb-1">رمز الموظف</label>
                            <input type="text" id="hrCode" value={hrCode} onChange={(e) => setHrCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </>
                );
            case ReportType.DAILY:
                return (
                    <div className="flex-1">
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                        <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                );
            case ReportType.PERIOD:
                return (
                    <>
                        <div className="flex-1 min-w-[150px]">
                            <label htmlFor="startDatePeriod" className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                            <input type="date" id="startDatePeriod" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label htmlFor="endDatePeriod" className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                            <input type="date" id="endDatePeriod" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-700">التقارير</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">نوع التقرير</label>
                        <select id="reportType" value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                            <option value={ReportType.NONE}>اختر تقرير...</option>
                            <option value={ReportType.SINGLE_LABOR}>تقرير موظف واحد</option>
                            <option value={ReportType.DAILY}>تقرير يومي مجمع</option>
                            <option value={ReportType.PERIOD}>تقرير فترة</option>
                        </select>
                    </div>
                    {renderInputs()}
                </div>
                 <button onClick={handleGenerateReport} disabled={isLoading || reportType === ReportType.NONE} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition duration-300">
                    {isLoading ? 'جاري التحميل...' : 'إنشاء التقرير'}
                </button>
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {reportData && (
                <div className="mt-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{reportData.title}</h3>
                        <div className="flex items-center gap-2">
                             <button onClick={() => exportToExcel(reportData.headers, reportData.rows, reportData.title)} className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition" aria-label="Export to Excel"><ExcelIcon /></button>
                             <button onClick={() => exportToPdf(reportData.headers, reportData.rows, reportData.title)} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition" aria-label="Export to PDF"><PdfIcon /></button>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-lg shadow border">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    {reportData.headers.map((header, i) => (
                                        <th key={i} scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.rows.length > 0 ? (
                                    reportData.rows.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono text-right">{cell}</td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={reportData.headers.length} className="text-center text-gray-500 py-4">لا توجد بيانات لعرضها.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;