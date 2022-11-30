// const ora = require("ora");
// const path = require("path");
// const chalk = require("chalk");
// const json2csv = require("json2csv");

const fs = require("fs-extra");
const readDir = require("readdir");

import { format } from "date-fns";
import csv from "csvtojson";

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

  const sanitisedFileContent = fileContent.replaceAll(/�/g, "oe");

  await fs.writeFile(
    `${INPUT_CSV_FILEPATH}${filePath}`,
    sanitisedFileContent,
    "utf8"
  );

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

interface ParsedEntry {
  Date: string;
  Payee: string;
  Category: string;
  Memo: string;
  Outflow: string;
  Inflow: string;
}

const YNAB_FIELDS = ["Date", "Payee", "Category", "Memo", "Outflow", "Inflow"];

async function parseCSVFile(filePath: string) {
  const fullPath = `${SANITIZED_CSV_FILEPATH}${filePath}`;

  function parseCSV(jsonObject) {
    const output = [];

    jsonObject.forEach((entryObject) => {
      const parsedEntry: ParsedEntry = {
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
      const entryDate = entryObject["Dato"];
      if (entryDate) {
        parsedEntry.Date = entryDate.replaceAll(".", "/");
      }

      /**
       * Parse inflow/outflow
       */
      const entryAmount = entryObject["Bel�b"] ?? entryObject["Beloeb"];
      if (entryAmount) {
        const parsedAmount =
          Number(entryAmount.replace(/[^0-9\-]+/g, "")) / 100;

        if (isNegative(parsedAmount)) {
          parsedEntry.Outflow = Math.abs(parsedAmount).toFixed(2);
        } else {
          parsedEntry.Inflow = Math.abs(parsedAmount).toFixed(2);
        }
      }

      /**
       * Parse category
       */
      const entryCategory = entryObject["Kategori"];
      if (entryCategory) {
        parsedEntry.Category = getMappedCategory(entryCategory);
      }

      /**
       * Parse ayee
       */
      const entryPayee = entryObject["Tekst"];
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
  console.log(">>>>>> parsedObject: ", parsedObject);
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
   * 2. Parse CSV's.
   *
   * Parse all CSV files in sanitized folder.
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
  return inputCategory;
}

/**
 * Map Danish payee to readable name
 */
function getMappedPayee(inputPayee: string) {
  return inputPayee;
}
