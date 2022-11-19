import fs from "fs";
import parse from 'csv-parse/lib/sync.js';
import chalk from "chalk";
import { sortBy } from "./utils.js";
import { parse as parseDate, format } from "date-fns";
import _ from "lodash";


export const getData = (bankCsvPath, actBlueCsvPath, specialCsvPath) => {
    let bankData = null;
    const specialAccounts = {
        latino: 0,
        hd29: 0,
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
                        return parseDate(value, 'M/dd/yy', new Date())
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
                        return parseDate(value, 'MM/dd/yy H:mm', new Date())
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

        // Adds list of expenses for bank records
        
        const deposits = bankRecords.filter(r => r.Amount >= 0).map(deposit => {        
          return {
            rawDate: deposit['Date'],
            Date: format(deposit.Date, 'MM/dd'),
            Description: `${deposit.Description} - ${deposit.Type}`,
            Amount: deposit.Amount,
            Address: deposit.Address,
            Occupation: deposit.Occupation,
            Latino: deposit.Description.toLowerCase().includes("latino"),
            HD29: deposit.Description.toLowerCase().includes("hd29")
        }
        });
    
        const bankExpenses = bankRecords.filter(r => r.Amount <= 0).map(expense => ({
            rawDate: expense.Date,
            Date: format(expense.Date, 'MM/dd'),
            Description: expense.Description,
            Amount: expense.Amount,
            Latino: expense.Description.toLowerCase().includes("latino"),
            HD29: expense.Description.toLowerCase().includes("hd29")
        }));
    
        // This block of code groups act blue fees by date. This makes it much easier to input these fees into TRACER
        const fees = []

        const groupedFees = _.groupBy(actBlueRecords.map(x => ({rawDate: x.Date, "Date": format(x.Date, 'MM/dd'), "Fee": x.Fee})), "Date")
        Object.keys(groupedFees).forEach((date) => {        
          const record = groupedFees[date];
          const expenseObject = { rawDate: record[0].rawDate, "Date": date, "Description": "Act Blue Fee" }
          const amount = record.reduce((pv, cv) => {
            return pv + cv.Fee
          }, 0)

          expenseObject["Amount"] = amount * -1;
          fees.push(expenseObject);
        });
        
        actBlueRecords.forEach(record => {
            const isLatino = record["Fundraising Page"].includes("latinoinitiative");
            const isHd29 = record["Fundraising Page"].includes("hd29") || record["Fundraising Page"].includes("westminsterdemstshirts");
                        

            deposits.push({
                rawDate: record.Date,
                Date: format(record.Date, 'MM/dd'),
                Description: `${record["Donor First Name"]} ${record["Donor Last Name"]} - ActBlue ${isLatino ? "(Latino Initiative)" : isHd29 ? "(HD29)" : ""}`,
                Amount: record.Amount,
                Address: `${record["Donor Addr1"]} ${record["Donor City"]}, ${record["Donor State"]} ${record["Donor ZIP"]}`,
                Occupation: record["Donor Occupation"],
                Latino: isLatino,
                HD29: isHd29
            });
            
        });

        const expenses = [...bankExpenses, ...fees]
    
        expenses.sort(sortBy("Date"));
        deposits.sort(sortBy("Date"));
        
        // create a combined array of deposits and expenses to find the earliest and latest records
        const allRecords = [...deposits, ...expenses]                
        const earliestRecord = allRecords.map(r => r.rawDate).reduce((a, b) => a <= b ? a : b);        
        const latestRecord = allRecords.map(r => r.rawDate).reduce((a, b) => a >= b ? a : b);
        const month =format(latestRecord, 'MMMM')
        const year = format(latestRecord, 'yyyy')
        const startDate = format(earliestRecord, 'MM/dd/yyyy') 
        const endDate = format(latestRecord, 'MM/dd/yyyy')
    
        const totalDeposits = deposits.map(r => r.Amount).reduce((a, b) => a + b);
        const totalExpenses = expenses.map(r => r.Amount).reduce((a, b) => a + b);
        
        const earliestBankRecord = bankRecords.map(r => r.Date).reduce((a, b) => a <= b ? a : b);
        const startingBalance = bankRecords.find(r => r.Date === earliestBankRecord)["Posted Balance After Transaction"] + Math.abs(bankRecords.find(r => r.Date === earliestBankRecord)["Amount"]);
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