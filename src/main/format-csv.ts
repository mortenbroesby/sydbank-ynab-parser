import fs from 'fs-extra';
import { format } from 'date-fns';
import csv from 'csvtojson';
import { createObjectCsvStringifier, createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import csvParser from 'csv-parser';

type YnabFields = 'Date' | 'Payee' | 'Category' | 'Memo' | 'Outflow' | 'Inflow';

type SydbankFields =
  | 'Date'
  | 'Text'
  | 'Amount'
  | 'Balance'
  | 'Reconciled'
  | 'Kontonummer'
  | 'Accountname'
  | 'Maincategory'
  | 'Category'
  | 'Comment';

const SYDBANK_FIELDS = [
  'Date',
  'Text',
  'Amount',
  'Balance',
  'Reconciled',
  'Kontonummer',
  'Accountname',
  'Maincategory',
  'Category',
  'Comment',
];

function parseCSV(jsonObject: any) {
  const output: any = [];

  type SydbankObject = {
    [key in SydbankFields]: any;
  };

  type YnabObject = {
    [key in YnabFields]: string;
  };

  jsonObject.forEach((entryObject: SydbankObject) => {
    const parsedEntry: YnabObject = {
      Date: '',
      Payee: '',
      Category: '',
      Memo: '',
      Outflow: '',
      Inflow: '',
    };

    /**
     * Parse date
     */
    const entryDate = entryObject.Date;
    if (entryDate) {
      parsedEntry.Date = entryDate.replaceAll('.', '/');
    }

    /**
     * Parse inflow/outflow
     */
    const entryAmount = entryObject.Amount;
    if (entryAmount) {
      const parsedAmount = Number(entryAmount.replace(/[^0-9\-]+/g, '')) / 100;

      if (isNegative(parsedAmount)) {
        parsedEntry.Outflow = Math.abs(parsedAmount).toFixed(2);
        parsedEntry.Memo = 'Outflow';
      } else {
        parsedEntry.Inflow = Math.abs(parsedAmount).toFixed(2);
        parsedEntry.Memo = 'Inflow';
      }
    }

    /**
     * Parse category
     */
    const entryMainCategory = entryObject.Maincategory;
    const entryCategory = entryObject.Category;
    if (entryMainCategory && entryCategory) {
      const { mappedCategory, mappedMemo } = getMappedCategory({
        mainCategory: entryMainCategory,
        category: entryCategory,
      });

      parsedEntry.Category = mappedCategory;
      parsedEntry.Memo = mappedMemo;
    }

    /**
     * Parse payee
     */
    const entryPayee = entryObject.Text;
    if (entryPayee) {
      const cleanedPayee = getCleanedPayee(entryPayee);
      const mappedPayee = getMappedPayee(cleanedPayee);

      parsedEntry.Payee = mappedPayee;
    }

    output.push(parsedEntry);
  });

  return output;
}

async function parseCSVFile(filePath: string) {
  const converter = csv({
    delimiter: ';',
    trim: true,
    noheader: false,
  });

  const jsonObject = await converter.fromFile(filePath);
  const parsedObject = parseCSV(jsonObject);

  return parsedObject;
}

function isNegative(input: number) {
  return input < 0;
}

function getCleanedPayee(input: string) {
  const cleaned = input.replace(/^\s+|\s+$|\s+(?=\s)/g, '');

  const removeIdentifiers = cleaned
    .replace('MCDK ', '')
    .replace('DK ', '')
    .replace('NETS*', '')
    .replace('PAY*', '')
    .replace('Klarna*', '')
    .replace('A/S', '')
    .replace('Aps', '')
    .trim();

  const replaceWithQuote = removeIdentifiers.replace('À', "'");
  const removeExcessQuotes = replaceWithQuote
    .replace(/"{2}/g, '"')
    .replace(/^"/, '')
    .replace(/"$/, '')
    .replace(/"/g, "'");

  const titleCased = titleCase(removeExcessQuotes);
  return titleCased;
}

function titleCase(str: string): string {
  if (str.trim() === str.toUpperCase()) {
    return str.toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase());
  } else {
    return str;
  }
}

/**
 * Map Danish input category to English name
 */
function getMappedCategory({
  mainCategory,
  category,
}: {
  mainCategory: string;
  category: string;
}) {
  // const mappedCategory = "?";
  // const mappedMemo = `[${mainCategory}]: ${category}`;

  return { mappedCategory: '', mappedMemo: '' };
}

/**
 * Map Danish payee to readable name
 */
function getMappedPayee(inputPayee: string) {
  const payeeMap = new Map<string, string>([
    ['ZARA', 'Zara'],
    ['APCOA', 'Apcoa'],
    ['NETTO', 'Netto'],
    ['Føtex', 'Føtex'],
    ['Lønoverførsel', 'Salary'],
    ['JYSK', 'JYSK'],
    ['IKEA', 'Ikea'],
    ['Lagkagehuset', 'Lagkagehuset'],
    ['McDonald', 'McDonalds'],
    ['Børneloppen', 'Børneloppen'],
    ['Bauhaus', 'Bauhaus'],
    ['Sliders', 'Sliders'],
    ['DK ARBEJDERNES LANDSBANK', 'ATM'],
    ['F@TEX', 'Føtex'],
    ['VERDO', 'Verdo'],
    ['Flying Tiger', 'Flying Tiger'],
    ['Irma', 'Irma'],
    ['DANICA', 'Danica Pension Ejd. Invest.'],
    ['Sluseholmens Apotek', 'Sluseholmens Apotek'],
    ['NEMLIG.COM', 'nemlig.com'],
    ['SPOTIFY', 'Spotify'],
    ['Wolt', 'Wolt'],
    ['B@RNELOPPEN', 'Børneloppen'],
    ['JUNO', 'Juno'],
    ['HARALD NYBORG', 'Harald Nyborg'],
    ['PROSA', 'PROSA'],
    ['SILVAN', 'Silvan'],
    ['DINOS LEGELAND', 'Dinos Legeland'],
    ['matas', 'Matas'],
    ['VALBY TANDKLINI', 'Valby Tandklinik'],
    ['VALBY TANDPLEJE', 'Valby Tandpleje'],
    ['ZOOLOGISK HAVE', 'Zoologisk Have'],
    ['La Focaccia', 'La Focaccia'],
    ['7-Eleven', '7-Eleven'],
    ['BOG IDE', 'Bog & Idé'],
    ['Zalando', 'Zalando'],
    ['Københavns Kommune', 'Københavns Kommune'],
    ['TRYG', 'Tryg'],
    ['BAHNE', 'Bahne'],
    ['S@STRENE GRENE', 'Søstrene Grene'],
    ['Henri', 'Henri'],
    ['NORMAL', 'NORMAL'],
    ['Muban Thai', 'Muban Thai'],
    ['Uno-X', 'Uno-X'],
    ['Q-Park', 'Q-Park'],
    ['SuperBrugsen', 'SuperBrugsen'],
    ['Spar', 'Spar'],
    ['Fakta', 'Fakta'],
    ['PLEO', 'PLEO'],
    ['1 stk. hævning i andre pengeinst', 'Bank Expenses'],
    ['Rente', 'Bank Expenses'],
    ['CIRCLE K', 'Circle K'],
    ['BILKA', 'Bilka'],
    ['SAXO', 'Saxo'],
    ['Skatteforvaltningen', 'Skatteforvaltningen'],
    ['VESTERBRO KONTORFORSYN', 'Vesterbro Kontorforsyning'],
    ['Amazon Video', 'Amazon Video'],
    ['ARBEJDERNES LANDSBANK', 'Arbejdernes Landsbank'],
    ['EASYJET', 'EasyJet'],
    ['FISKERYTTEREN', 'Fiskerytteren'],
    ['NORDISK FILM', 'Nordisk Film'],
    ['COS DK0560', 'COS'],
    ['Sn.Nord* Vpncom', 'NordVPN'],
  ]);

  // Check for a match without spaces
  for (const key of payeeMap.keys()) {
    if (containsSubstring(inputPayee, key)) {
      return payeeMap.get(key) ?? '';
    }
  }

  return inputPayee;
}

function containsSubstring(input: string, target: string): boolean {
  return input
    .replace(/\s/g, '')
    .toLowerCase()
    .includes(target.replace(/\s/g, '').toLowerCase());
}

function getTargetFilename() {
  const targetFileName = `sydbank_csv_${format(
    new Date(),
    'dd-MM-yyyy_hh.mm.ss',
  )}.csv`;

  return targetFileName;
}

function convertArrayToCSV(data: any[]) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Input data must be a non-empty array of objects.');
  }

  // Extract the headers from the first object in the array
  const headers = [
    { id: 'Date', title: 'Date' },
    { id: 'Payee', title: 'Payee' },
    { id: 'Category', title: 'Category' },
    { id: 'Memo', title: 'Memo' },
    { id: 'Outflow', title: 'Outflow' },
    { id: 'Inflow', title: 'Inflow' },
  ];

  // Extract the titles
  const headerTitles = headers.map((header) => header.title);

  // Create an array to store the CSV data
  const csvData = [];

  // Add the header row to the CSV data
  csvData.push(headerTitles.join(','));

  // Iterate over the array and convert each object to a CSV row
  for (const item of data) {
    const values = headerTitles.map((header) => item[header]);
    csvData.push(values.join(','));
  }

  // Join the rows with newline characters to create the CSV content
  const csvContent = csvData.join('\n');
  return csvContent;
}

export async function formatCSV(filePath: string) {
  const parsed = await parseCSVFile(filePath);
  const converted = convertArrayToCSV(parsed);

  return {
    data: converted,
    fileName: getTargetFilename(),
  };
}
