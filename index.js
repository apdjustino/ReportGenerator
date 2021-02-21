import minimist from "minimist";
import { getData } from "./data.js";
import { writeReport } from "./writer.js";
import chalk from "chalk";

const argv = minimist(process.argv.slice(2));

const { a, b, h } = argv;

if (!!h) {
    console.log(chalk.blue("-a: Path to ActBlue CsvFile. This should be the file exported from ActBlue \n"));
    console.log(chalk.blue("-b: Path to Bank CsvFile. This should be exported from the Bank website \n"));
    console.log(chalk.blue("-h: displays this help message"));
} else {
    const bankCsvPath = b;
    const actBlueCsvPath = a;

    if (a === undefined || b === undefined) {
        console.log(chalk.red("Error: Bank and ActBlue CsvFile paths cannot be empty. Make sure that the paths are not empty"));
    } else {
        const data = getData(bankCsvPath, actBlueCsvPath);
        if (data !== undefined) {
            writeReport(data);
        }
        
    }
}


