import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportSheet {
  name: string;
  data: any[];
  columns: ExportColumn[];
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Export data to Excel with single sheet
   * @param data Array of data objects
   * @param columns Column definitions with headers and keys
   * @param filename Filename without extension
   * @param sheetName Name of the Excel sheet
   */
  exportToExcel(data: any[], columns: ExportColumn[], filename: string, sheetName: string = 'Sheet1'): void {
    // Create worksheet data with headers
    const worksheetData: any[][] = [];

    // Add headers
    const headers = columns.map(col => col.header);
    worksheetData.push(headers);

    // Add data rows
    data.forEach(row => {
      const rowData = columns.map(col => {
        const value = this.getNestedValue(row, col.key);
        return value !== null && value !== undefined ? value : '';
      });
      worksheetData.push(rowData);
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const columnWidths = columns.map(col => ({ wch: col.width || 15 }));
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Set RTL for Arabic content
    if (!workbook.Workbook) workbook.Workbook = {};
    if (!workbook.Workbook.Views) workbook.Workbook.Views = [];
    workbook.Workbook.Views[0] = { RTL: true };

    // Generate Excel file and download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, filename);
  }

  /**
   * Export data to Excel with multiple sheets
   * @param sheets Array of sheet definitions
   * @param filename Filename without extension
   */
  exportToExcelMultiSheet(sheets: ExportSheet[], filename: string): void {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(sheet => {
      // Create worksheet data with headers
      const worksheetData: any[][] = [];

      // Add headers
      const headers = sheet.columns.map(col => col.header);
      worksheetData.push(headers);

      // Add data rows
      sheet.data.forEach(row => {
        const rowData = sheet.columns.map(col => {
          const value = this.getNestedValue(row, col.key);
          return value !== null && value !== undefined ? value : '';
        });
        worksheetData.push(rowData);
      });

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = sheet.columns.map(col => ({ wch: col.width || 15 }));
      worksheet['!cols'] = columnWidths;

      // Append sheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    // Set RTL for Arabic content
    if (!workbook.Workbook) workbook.Workbook = {};
    if (!workbook.Workbook.Views) workbook.Workbook.Views = [];
    workbook.Workbook.Views[0] = { RTL: true };

    // Generate Excel file and download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, filename);
  }

  /**
   * Generate filename with date range
   * @param base Base filename (e.g., 'trips_export')
   * @param startDate Optional start date
   * @param endDate Optional end date
   * @returns Formatted filename
   */
  generateFilenameWithDates(base: string, startDate?: string, endDate?: string): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (startDate && endDate) {
      return `${base}_${startDate}_to_${endDate}`;
    } else if (startDate) {
      return `${base}_from_${startDate}`;
    } else if (endDate) {
      return `${base}_until_${endDate}`;
    } else {
      return `${base}_${today}`;
    }
  }

  /**
   * Save Excel buffer as file
   * @param buffer Excel file buffer
   * @param filename Filename without extension
   */
  private saveAsExcelFile(buffer: any, filename: string): void {
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = `${filename}.xlsx`;
    link.click();

    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(link.href);
    }, 100);
  }

  /**
   * Get nested value from object using dot notation
   * @param obj Object to extract value from
   * @param path Path to value (e.g., 'user.name')
   * @returns Value at path or undefined
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Format date as YYYY/MM/DD
   * @param day Day
   * @param month Month
   * @param year Year
   * @returns Formatted date string
   */
  formatDate(day: number, month: number, year: number): string {
    const paddedDay = String(day).padStart(2, '0');
    const paddedMonth = String(month).padStart(2, '0');
    return `${year}/${paddedMonth}/${paddedDay}`;
  }

  /**
   * Format boolean as Arabic yes/no
   * @param value Boolean value
   * @returns 'نعم' or 'لا'
   */
  formatBoolean(value: boolean): string {
    return value ? 'نعم' : 'لا';
  }
}
