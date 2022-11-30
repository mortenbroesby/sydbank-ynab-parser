const ora = require("ora");
const path = require("path");
const chalk = require("chalk");
const json2csv = require("json2csv");
const fs = require("fs-extra");
const readDir = require("readdir");
const format = require("date-fns/format");

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

async function sanitizeCSVFile({
  filePath,
  index,
}: {
  filePath: string;
  index: number;
}) {
  let targetFileName = filePath;

  // Only format non-formatted files
  if (!filePath.includes("sydbank_csv_")) {
    targetFileName = `sydbank_csv_${index}_${format(
      new Date(),
      "DD-MM-YYYY_hh.mm.ss"
    )}.csv`;
  }

  await fs.move(
    `${INPUT_CSV_FILEPATH}${filePath}`,
    `${SANITIZED_CSV_FILEPATH}${targetFileName}`
  );
}

async function parseCSVFile(filePath: string, index: number) {
  const fullPath = `${OUTPUT_CSV_FILEPATH}${filePath}`;
  console.log(">>>>>> filePath: ", { filePath, index });
  console.log(">>>>>> fullPath: ", fullPath);
}

async function mainLoop() {
  /**
   * Grab CSV files from input folder. Rename with sanitised file-name. Move to "sanitized" folder.
   */
  const unsanitisedCSVFiles: string[] = await getCSVFilePaths({
    basePath: INPUT_CSV_FILEPATH,
  });

  const sanitizeJobs = unsanitisedCSVFiles.map((filePath, index) =>
    sanitizeCSVFile({ filePath, index })
  );

  await Promise.all(sanitizeJobs);

  /**
   * Parse all CSV files in sanitized folder.
   */
  const sanitisedCSVFiles: string[] = await getCSVFilePaths({
    basePath: SANITIZED_CSV_FILEPATH,
  });

  const parseJobs = sanitisedCSVFiles.map((filePath, index) =>
    parseCSVFile(filePath, index)
  );

  await Promise.all(parseJobs);
}

(async () => {
  try {
    await mainLoop();
  } catch (error) {
    throw error;
  }
})();
