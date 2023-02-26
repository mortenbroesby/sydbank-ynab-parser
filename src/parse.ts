// const ora = require("ora");
// const path = require("path");
// const chalk = require("chalk");
// const json2csv = require("json2csv");

const fs = require("fs-extra");
const readDir = require("readdir");

import { format } from "date-fns";
import csv from "csvtojson";
import { createObjectCsvWriter } from "csv-writer";

const INPUT_CSV_FILEPATH = "./csv/input/";
const SANITIZED_CSV_FILEPATH = "./csv/sanitized/";
const OUTPUT_CSV_FILEPATH = "./csv/output/";

function getCSVFilePaths({
  basePath,
}: {
  basePath: string;
}): Promise<string[]> {
  return new Promise((resolve) => {
    readDir.read(basePath, ["**.csv"], (error, filesArray) => {
      if (error) {
        throw error;
      }

      resolve(filesArray);
    });
  });
}

async function sanitizeCSVFile(filePath: string) {
  let targetFileName = filePath;

  /**
   * Cleanup all nordic characters
   */
  const fileContent = await fs.readFile(
    `${INPUT_CSV_FILEPATH}${filePath}`,
    "utf8"
  );

  await fs.writeFile(`${INPUT_CSV_FILEPATH}${filePath}`, fileContent, "utf8");

  // Only format non-formatted files
  if (!filePath.includes("sydbank_csv_")) {
    targetFileName = `sydbank_csv_${format(
      new Date(),
      "dd-MM-yyyy_hh.mm.ss"
    )}.csv`;
  }

  await fs.move(
    `${INPUT_CSV_FILEPATH}${filePath}`,
    `${SANITIZED_CSV_FILEPATH}${targetFileName}`
  );
}

interface YNABEntry {
  Date: string;
  Payee: string;
  Category: string;
  Memo: string;
  Outflow: string;
  Inflow: string;
}

type YnabFields = "Date" | "Payee" | "Category" | "Memo" | "Outflow" | "Inflow";

const YNAB_FIELDS = ["Date", "Payee", "Category", "Memo", "Outflow", "Inflow"];

type SydbankFields =
  | "Date"
  | "Text"
  | "Amount"
  | "Balance"
  | "Reconciled"
  | "Kontonummer"
  | "Accountname"
  | "Maincategory"
  | "Category"
  | "Comment";

const SYDBANK_FIELDS = [
  "Date",
  "Text",
  "Amount",
  "Balance",
  "Reconciled",
  "Kontonummer",
  "Accountname",
  "Maincategory",
  "Category",
  "Comment",
];

async function parseCSVFile(filePath: string) {
  const fullPath = `${SANITIZED_CSV_FILEPATH}${filePath}`;

  function parseCSV(jsonObject) {
    const output = [];

    type SydbankObject = {
      [key in SydbankFields]: any;
    };

    type YnabObject = {
      [key in YnabFields]: string;
    };

    jsonObject.forEach((entryObject: SydbankObject) => {
      const parsedEntry: YnabObject = {
        Date: "",
        Payee: "",
        Category: "",
        Memo: "",
        Outflow: "",
        Inflow: "",
      };

      /**
       * Parse date
       */
      const entryDate = entryObject.Date;
      if (entryDate) {
        parsedEntry.Date = entryDate.replaceAll(".", "/");
      }

      // /**
      //  * Parse inflow/outflow
      //  */
      const entryAmount = entryObject.Amount;
      if (entryAmount) {
        const parsedAmount =
          Number(entryAmount.replace(/[^0-9\-]+/g, "")) / 100;

        if (isNegative(parsedAmount)) {
          parsedEntry.Outflow = Math.abs(parsedAmount).toFixed(2);
          parsedEntry.Memo = "Outflow";
        } else {
          parsedEntry.Inflow = Math.abs(parsedAmount).toFixed(2);
          parsedEntry.Memo = "Inflow";
        }
      }

      /**
       * Parse category
       */
      const entryCategory = entryObject.Category;
      if (entryCategory) {
        parsedEntry.Category = getMappedCategory(entryCategory);
      }

      /**
       * Parse payee
       */
      const entryPayee = entryObject.Text;
      if (entryPayee) {
        parsedEntry.Payee = getMappedPayee(entryPayee).replace(
          /^\s+|\s+$|\s+(?=\s)/g,
          ""
        );
      }

      output.push(parsedEntry);
    });

    return output;
  }

  const converter = csv({
    delimiter: ";",
    trim: true,
    noheader: false,
  });

  const jsonObject = await converter.fromFile(fullPath);
  const parsedObject = parseCSV(jsonObject);

  const csvHeaders = [
    { id: "Date", title: "Date" },
    { id: "Payee", title: "Payee" },
    { id: "Category", title: "Category" },
    { id: "Memo", title: "Memo" },
    { id: "Outflow", title: "Outflow" },
    { id: "Inflow", title: "Inflow" },
  ];

  const csvWriter = createObjectCsvWriter({
    path: `${OUTPUT_CSV_FILEPATH}${filePath}`,
    header: csvHeaders,
  });

  csvWriter
    .writeRecords(parsedObject)
    .then(() => console.log("The CSV file was written successfully"))
    .catch((error) => console.log(`Error writing CSV file: ${error}`));
}

async function mainLoop() {
  /**
   * 1. Sanitise CSV's.
   *
   * Grab CSV files from input folder. Rename with sanitised file-name. Move to "sanitized" folder.
   */
  const unsanitisedCSVFiles: string[] = await getCSVFilePaths({
    basePath: INPUT_CSV_FILEPATH,
  });

  const sanitizeJobs = unsanitisedCSVFiles.map((filePath) =>
    sanitizeCSVFile(filePath)
  );

  await Promise.all(sanitizeJobs);

  /**
   * 2. Parse and write CSV's.
   *
   * Parse all CSV files in sanitized folder, write to output folder.
   */
  const sanitisedCSVFiles: string[] = await getCSVFilePaths({
    basePath: SANITIZED_CSV_FILEPATH,
  });

  const parseJobs = sanitisedCSVFiles.map((filePath) => parseCSVFile(filePath));

  await Promise.all(parseJobs);
}

(async () => {
  try {
    await mainLoop();
  } catch (error) {
    throw error;
  }
})();

function isNegative(input: number) {
  return input < 0;
}

/**
 * Map Danish input category to English name
 */
function getMappedCategory(inputCategory: string) {
  return "?";
}

/**
 * Map Danish payee to readable name
 */
function getMappedPayee(inputPayee: string) {
  const payeeMap = new Map<string, string>([
    ["ZARA", "Zara"],
    ["APCOA", "Apcoa"],
    ["NETTO", "Netto"],
    ["Føtex", "Føtex"],
    ["Lønoverførsel", "Salary"],
    ["JYSK", "JYSK"],
    ["IKEA", "Ikea"],
    ["Lagkagehuset", "Lagkagehuset"],
    ["McDonald", "McDonalds"],
    ["Børneloppen", "Børneloppen"],
    ["Bauhaus", "Bauhaus"],
    ["Sliders", "Sliders"],
    ["DK ARBEJDERNES LANDSBANK", "ATM"],
    ["F@TEX", "Føtex"],
    ["VERDO", "Verdo"],
    ["Flying Tiger", "Flying Tiger"],
    ["Irma", "Irma"],
    ["DANICA", "Danica Pension Ejd. Invest."],
    ["Sluseholmens Apotek", "Sluseholmens Apotek"],
    ["NEMLIG.COM", "nemlig.com"],
    ["SPOTIFY", "Spotify"],
    ["Wolt", "Wolt"],
    ["B@RNELOPPEN", "Børneloppen"],
    ["JUNO", "Juno"],
    ["HARALD NYBORG", "Harald Nyborg"],
    ["PROSA", "PROSA"],
    ["SILVAN", "SILVAN"],
    ["DINOS LEGELAND", "Dinos Legeland"],
    ["matas", "MATAS"],
    ["VALBY TANDKLINI", "Valby Tandklinik"],
    ["ZOOLOGISK HAVE", "Zoologisk Have"],
    ["La Focaccia", "La Focaccia"],
  ]);

  // Check for a match without spaces
  for (const key of payeeMap.keys()) {
    if (containsSubstring(inputPayee, key)) {
      return payeeMap.get(key) ?? "";
    }
  }

  return inputPayee;
}

function containsSubstring(input: string, target: string): boolean {
  return input
    .replace(/\s/g, "")
    .toLowerCase()
    .includes(target.replace(/\s/g, "").toLowerCase());
}
