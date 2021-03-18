import fs from "fs";
import parse from 'csv-parse/lib/sync.js';
import moment from "moment";
import chalk from "chalk";
import { sortBy } from "./utils.js";

export const getData = (bankCsvPath, actBlueCsvPath, specialCsvPath) => {
    let bankData = null;
    const specialAccounts = {
        latino: 0,
        hd35: 0,
        young: 0,
        hd34: 0
    };
    try {
        bankData = fs.readFileSync(bankCsvPath, 'utf-8');
    } catch (error) {
        console.log(chalk.red("Error: There was an error reading the bank csv file. Check the file path for the bank csv file."));
        return;
    }

    let actBlueData = null;
    try {
        actBlueData = fs.readFileSync(actBlueCsvPath, 'utf-8');
    } catch (error) {
        console.log(chalk.red("Error: There was an error reading the act blue csv file. Check the file path for the act blue csv file."));
        return;
    }

    let specialData = null;
    try {
        specialData = fs.readFileSync(specialCsvPath, 'utf-8');
    } catch (error) {
        console.log(chalk.red("Error: There was an error reading the special account csv file. Check the file path."));
        return;
    }

    try {
        const bankRecords = parse(bankData, {
            columns: true,
            cast: (value, context) => {
                switch (context.column) {
                    case "Amount":
                        return parseFloat(value);
                    case "Date":
                        return moment(value, "M/D/YY");
                    case "Posted Balance After Transaction":
                        return parseFloat(value);
                    default: 
                        return value;
                }    
            }
        });
        
        const actBlueRecords = parse(actBlueData, {
            columns: true,
            cast: (value, context) => {
                switch (context.column) {
                    case "Amount":
                        return parseFloat(value);
                    case "Date":
                        return moment(value);
                    case "Fee":
                        return parseFloat(value);
                    default:
                        return value;
                }
            }
        });
    
        const specialRecords = parse(specialData, {
            columns: true,
            cast: (value, context) => {
                if (!context.header) {
                    return parseFloat(value);
                } else {
                    return value;
                }
                
            }
        });
    
        const deposits = bankRecords.filter(r => r.Amount >= 0).map(deposit => ({
            Date: deposit.Date,
            Description: `${deposit.Description} - ${deposit.Type}`,
            Amount: deposit.Amount,
            Address: deposit.Address,
            Occupation: deposit.Occupation,
            Latino: deposit.Description.toLowerCase().includes("latino"),
            HD35: deposit.Description.toLowerCase().includes("hd35")
        }));
    
        const expenses = bankRecords.filter(r => r.Amount <= 0).map(expense => ({
            Date: expense.Date,
            Description: expense.Description,
            Amount: expense.Amount,
        }));
    
        actBlueRecords.forEach(record => {
            const isLatino = record["Fundraising Page"].includes("latinoinitiative");
            const isHd35 = record["Fundraising Page"].includes("hd35");
            expenses.push({
                Date: record.Date,
                Description: "ActBlue Fee",
                Amount: record.Fee * -1
            });

            deposits.push({
                Date: record.Date,
                Description: `${record["Donor First Name"]} ${record["Donor Last Name"]} - ActBlue ${isLatino ? "(Latino Initiative)" : isHd35 ? "(HD35)" : ""}`,
                Amount: record.Amount,
                Address: `${record["Donor Addr1"]} ${record["Donor City"]}, ${record["Donor State"]} ${record["Donor ZIP"]}`,
                Occupation: record["Donor Occupation"],
                Latino: isLatino,
                HD35: isHd35
            });
            
        });
    
        expenses.sort(sortBy("Date"));
        deposits.sort(sortBy("Date"));

        const earliestRecord = bankRecords.map(r => r.Date).reduce((a, b) => a <= b ? a : b);
        const latestRecord = deposits.map(r => r.Date).reduce((a, b) => a >= b ? a : b);
        const month = latestRecord.format("MMMM");
        const year = latestRecord.format("YYYY");
        const startDate = earliestRecord.format("MM/DD/YYYY");
        const endDate = latestRecord.format("MM/DD/YYYY");
    
        const totalDeposits = deposits.map(r => r.Amount).reduce((a, b) => a + b);
        const totalExpenses = expenses.map(r => r.Amount).reduce((a, b) => a + b);
        const startingBalance = bankRecords.find(r => r.Date === earliestRecord)["Posted Balance After Transaction"] + Math.abs(bankRecords.find(r => r.Date === earliestRecord)["Amount"]);
        const endingBalance = startingBalance + totalDeposits + totalExpenses;
    
        return {
            actBlueRecords,
            bankRecords,
            earliestRecord,
            latestRecord,
            month,
            year,
            startDate,
            endDate,
            deposits,
            expenses,
            totalDeposits,
            totalExpenses,
            startingBalance,
            endingBalance,
            specialRecords,
        }
    } catch (error) {
        console.log(error);
        console.log(chalk.red("Error: There was an error processing the data. Check your input files for the correct fields."))
        console.log(chalk.red("Bank files require the following case-sensitive fields: Amount, Description, Date (M/DD/YY), Posted Balance After Transaction"));
        console.log(chalk.red("ActBlue files require the following fields: Amount, Fee, Donor First Name, Donor Last Name"));
        return;
    }
    

};