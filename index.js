import minimist from "minimist";
import { getData } from "./data.js";
import { writeReport } from "./writer.js";
import chalk from "chalk";

const argv = minimist(process.argv.slice(2));

const { a, b, h, s } = argv;

if (!!h) {
    console.log(chalk.blue("-a: Path to ActBlue CsvFile. This should be the file exported from ActBlue \n"));
    console.log(chalk.blue("-b: Path to Bank CsvFile. This should be exported from the Bank website \n"));
    console.log(chalk.blue("-s: Path to special account file. This csv contains balances of special accounts"));
    console.log(chalk.blue("-h: displays this help message"));
} else {
    const bankCsvPath = b;
    const actBlueCsvPath = a;
    const specialCsvPath = s;

    if (a === undefined || b === undefined || s === undefined) {
        console.log(chalk.red("Error: Bank, ActBlue, and Special account csv paths cannot be empty. Make sure that the paths are not empty"));
        console.log(chalk.red("Use the -h flag to see a list of required flags"));
    } else {
        const data = getData(bankCsvPath, actBlueCsvPath, specialCsvPath);
        if (data !== undefined) {
            writeReport(data);
        }
        
    }
}


