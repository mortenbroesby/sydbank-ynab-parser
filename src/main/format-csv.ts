import fs from 'fs';
import csvParser from 'csv-parser';

export function formatCSV(filePath: string): string {
  const csvData = fs.readFileSync(filePath, 'utf-8');
  return csvData;
}
