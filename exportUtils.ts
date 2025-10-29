import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { amiriFont } from './AmiriFont';

/**
 * Exports data to an Excel file (.xlsx).
 * @param headers - The table headers.
 * @param rows - The table data rows.
 * @param fileName - The name for the downloaded file (without extension).
 */
export const exportToExcel = (headers: string[], rows: (string | number)[][], fileName: string): void => {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  
  // Sanitize filename and add extension
  XLSX.writeFile(workbook, `${fileName.replace(/ /g, '_')}.xlsx`);
};

/**
 * Exports data to a PDF file with proper Arabic support.
 * @param headers - The table headers.
 * @param rows - The table data rows.
 * @param title - The title of the report to be displayed in the PDF.
 */
export const exportToPdf = (headers: string[], rows: (string | number)[][], title: string): void => {
  const doc = new jsPDF();
  
  // 1. Add the Amiri font file to the virtual file system
  doc.addFileToVFS('Amiri-Regular.ttf', amiriFont);
  // 2. Add the font to jsPDF
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  // 3. Set the font for the entire document
  doc.setFont('Amiri');

  // Draw the title, right-aligned
  doc.text(title, doc.internal.pageSize.getWidth() - 14, 15, { align: 'right' });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 20,
    styles: {
        font: 'Amiri', // Use the Arabic font
        halign: 'right', // Align all cell text to the right
    },
    headStyles: {
        fillColor: [22, 160, 133],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'right', // Align header text to the right
    },
  });

  // Sanitize filename and add extension
  doc.save(`${title.replace(/ /g, '_')}.pdf`);
};