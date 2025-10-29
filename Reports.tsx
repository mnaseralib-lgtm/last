import React, { useState } from 'react';
import { getReportData } from '../services/googleSheetsService.ts';
import { ReportType, ReportData } from '../types.ts';
import { exportToExcel, exportToPdf } from '../utils/exportUtils.ts';
import { ExcelIcon, PdfIcon } from './icons.tsx';

const Reports: React.FC = () => {
    const [reportType, setReportType] = useState<ReportType>(ReportType.NONE);
    const [hrCode, setHrCode] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateReport = async () => {
        if (reportType === ReportType.NONE) {
            setError('يرجى اختيار نوع التقرير أولاً.');
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const params: any = { reportType };
            if (reportType === ReportType.SINGLE_LABOR && hrCode) params.hrCode = hrCode;
            if (reportType === ReportType.DAILY && date) params.date = date;
            if (reportType === ReportType.PERIOD && startDate && endDate) {
                params.startDate = startDate;
                params.endDate = endDate;
            }
            const data = await getReportData(params);
            setReportData(data);
        } catch (err: any) {
            setError(err.message || 'فشل في جلب التقرير.');
        } finally {
            setLoading(false);
        }
    };

    const renderInputs = () => {
        switch (reportType) {
            case ReportType.SINGLE_LABOR:
                return (
                    <input
                        type="text"
                        value={hrCode}
                        onChange={(e) => setHrCode(e.target.value)}
                        placeholder="الرقم الوظيفي"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                );
            case ReportType.DAILY:
                return (
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                );
            case ReportType.PERIOD:
                return (
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-4 bg-white rounded-xl shadow-md space-y-4">
                <h2 className="text-lg font-bold text-gray-700">إنشاء التقارير</h2>
                <div className="space-y-2">
                    <label htmlFor="report-type" className="block text-sm font-medium text-gray-700">نوع التقرير</label>
                    <select
                        id="report-type"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value as ReportType)}
                        className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                        <option value={ReportType.NONE}>-- اختر --</option>
                        <option value={ReportType.SINGLE_LABOR}>تقرير عامل واحد</option>
                        <option value={ReportType.DAILY}>تقرير يومي</option>
                        <option value={ReportType.PERIOD}>تقرير فترة محددة</option>
                    </select>
                </div>
                {renderInputs()}
                <button
                    onClick={handleGenerateReport}
                    disabled={loading || reportType === ReportType.NONE}
                    className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition duration-300"
                >
                    {loading ? 'جاري التحميل...' : 'إنشاء التقرير'}
                </button>
            </div>

            {error && <div className="p-3 text-center rounded-md text-white font-semibold bg-red-500">{error}</div>}

            {reportData && (
                <div className="p-4 bg-white rounded-xl shadow-md space-y-4 animate-fade-in-up">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">{reportData.title}</h3>
                        <div className="flex gap-2">
                            <button onClick={() => exportToExcel(reportData.headers, reportData.rows, reportData.title)} className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition">
                                <ExcelIcon /> Excel
                            </button>
                            <button onClick={() => exportToPdf(reportData.headers, reportData.rows, reportData.title)} className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition">
                                <PdfIcon /> PDF
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {reportData.headers.map(header => <th key={header} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>)}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.rows.map((row, index) => (
                                    <tr key={index}>
                                        {row.map((cell, cellIndex) => <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cell}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
