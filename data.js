import fs from "fs";
import parse from 'csv-parse/lib/sync.js';
import moment from "moment";
import { sortBy } from "./utils.js";

export const getData = (bankCsvPath, actBlueCsvPath) => {
    const bankData = fs.readFileSync(bankCsvPath, 'utf-8');
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

    const actBlueData = fs.readFileSync(actBlueCsvPath, 'utf-8');
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

    const earliestRecord = bankRecords.map(r => r.Date).reduce((a, b) => a <= b ? a : b);
    const latestRecord = bankRecords.map(r => r.Date).reduce((a, b) => a >= b ? a : b);
    const month = latestRecord.format("MMMM");
    const year = latestRecord.format("YYYY");
    const startDate = earliestRecord.format("MM/DD/YYYY");
    const endDate = latestRecord.format("MM/DD/YYYY");

    const deposits = bankRecords.filter(r => r.Amount >= 0);

    const expenses = bankRecords.filter(r => r.Amount <= 0).map(expense => ({
        Date: expense.Date,
        Description: expense.Description,
        Amount: expense.Amount,
    }));

    actBlueRecords.forEach(record => {
        expenses.push({
            Date: record.Date,
            Description: "ActBlue Fee",
            Amount: record.Fee * -1
        });
    });

    expenses.sort(sortBy("Date"));
    deposits.sort(sortBy("Date"));

    const totalDeposits = deposits.map(r => r.Amount).reduce((a, b) => a + b);
    const totalExpenses = expenses.map(r => r.Amount).reduce((a, b) => a + b);
    const startingBalance = bankRecords.find(r => r.Date === earliestRecord)["Posted Balance After Transaction"] + Math.abs(bankRecords.find(r => r.Date === earliestRecord)["Amount"]);
    const endingBalance = bankRecords.find(r => r.Date === latestRecord)["Posted Balance After Transaction"];

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
    }

};