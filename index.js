import { getData } from "./data.js";
import { writeReport } from "./writer.js";

const [bankCsvPath, actBlueCsvPath] = process.argv.slice(2);

const data = getData(bankCsvPath, actBlueCsvPath);
writeReport(data);
