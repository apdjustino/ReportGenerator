import PDFDocument from "pdfkit";
import fs from "fs";
import { formatCurrency } from "./utils.js";
import chalk from "chalk";

export const writeReport = (data) => {

    const {
        actBlueRecords,
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
    } = data;
        

    const doc = new PDFDocument();

    //title and header
    const title = `Adams County Democrats ${month} ${year} Finance Report`
    doc.pipe(fs.createWriteStream(`./reports/${title}.pdf`));

    doc.font('Times-Roman');

    doc.font('Times-Bold').fontSize(14).text(title, {
        underline: true,
        align: "center",
        lineGap: 8
    });
    doc.font('Times-BoldItalic').fontSize(11).text(`Report period ${startDate} through ${endDate}`, {
        align: "center",
        lineGap: 20,
    });

    //balance summaries
    doc.font('Times-Roman').fontSize(12).text(`Starting Balance ${startDate}`, {
        continued: true,
    }).font('Times-Bold').fontSize(12).text(`${formatCurrency(startingBalance)}`, {
        align: "right",
        lineGap: 8,
    }).font('Times-Roman').fontSize(12).text(`Deposits ${startDate} - ${endDate}`, {
        continued: true,
    }).font('Times-Bold').fontSize(12).text(`${formatCurrency(totalDeposits)}`, {
        lineGap: 8,
        align: "right",
    }).font('Times-Roman').fontSize(12).text(`Expenses ${startDate} - ${endDate}`, {
        continued: true
    }).font('Times-Bold').fontSize(12).text(`${formatCurrency(Math.abs(totalExpenses))}`, {
        lineGap: 8,
        align: "right",
    }).font('Times-Bold').fontSize(12).text(`Total Account Balance as of ${endDate}`, {
        continued: true,
    }).text(`${formatCurrency(endingBalance)}`, {
        lineGap: 16,
        align: "right",
    });

    //Expenses

    doc.font('Times-Bold').fontSize(11).text("Expenses/Withdrawals", {
        lineGap: 8,
        underline: true,
    });

    expenses.forEach(expense => {
        doc.font('Times-Roman').fontSize(10).text(`${expense.Date.format("MM/DD")} ${expense.Description}`, {
            indent: 36,
            continued: true,
        }).text(`${formatCurrency(expense.Amount)}`, {
            lineGap: 8,
            align: "right",
        });
    });
    doc.font('Times-Bold').fontSize(12).text(`TOTAL EXPENSES ${startDate} - ${endDate}`, {
        continued: true,
        indent: 72
    }).text(`${formatCurrency(totalExpenses)}`, {
        lineGap: 16,
        align: "right",
    });

    //Deposits

    doc.font('Times-Bold').fontSize(11).text("Deposits", {
        lineGap: 8,
        underline: true,
    });

    deposits.forEach(deposit => {
        doc.font('Times-Roman').fontSize(10).text(`${deposit.Date.format("MM/DD")} ${deposit.Description}`, {
            indent: 36,
            continued: true,
        }).text(`${formatCurrency(deposit.Amount)}`, {
            align: "right",
        }).text(`${deposit.Address}`, {
            indent: 60
        }).text(`Occupation: ${deposit.Occupation}`, {
            indent: 60,
            lineGap: 8
        });
    });

    doc.font('Times-Bold').fontSize(12).text(`TOTAL DEPOSITS ${startDate} - ${endDate}`, {
        continued: true,
        indent: 72
    }).text(`${formatCurrency(totalDeposits)}`, {
        lineGap: 24,
        align: "right",
    });

    // special accounts
    const latinoBalance = deposits.filter(d => d.Latino).map(d => d.Amount).reduce((a, b) => a + b) + specialRecords[0]["Latino Initiative"];
    const hd35Balance = deposits.filter(d => d.HD35).map(d => d.Amount).reduce((a, b) => a + b) + specialRecords[0]["HD 35"];
    doc.font('Times-Roman').fontSize(12).text(`Account Balance as of ${endDate}`, {
        continued: true
    }).font('Times-Bold').text(`${formatCurrency(endingBalance)}`, {
        lineGap: 8,
        align: "right"
    });

    doc.font('Times-Roman').fontSize(12).text(`Less: Young Dems`, {
        continued: true
    }).text(`${formatCurrency(specialRecords[0]["Young Dems"] * -1)}`, {
        lineGap: 8,
        align: "right"
    });

    doc.font('Times-Roman').fontSize(12).text(`Less: Latino Initiative`, {
        continued: true
    }).text(`${formatCurrency(latinoBalance * -1)}`, {
        lineGap: 8,
        align: "right"
    });

    doc.font('Times-Roman').fontSize(12).text(`Less: HD 34`, {
        continued: true
    }).text(`${formatCurrency(specialRecords[0]["HD 34"] * -1)}`, {
        lineGap: 8,
        align: "right"
    });

    doc.font('Times-Roman').fontSize(12).text(`Less: HD 35`, {
        continued: true
    }).text(`${formatCurrency(hd35Balance * -1)}`, {
        lineGap: 8,
        align: "right"
    });

    const operatingBalance = endingBalance - specialRecords[0]["Young Dems"] - specialRecords[0]["Latino Initiative"] - specialRecords[0]["HD 34"] - specialRecords[0]["HD 35"];
    doc.font('Times-Bold').fontSize(12).text("OPERATING ACCOUNT BALANCE", {
        align: "center",
        continued: true
    }).text(`${formatCurrency(operatingBalance)}`, {
        align: "right",
        lineGap: 8
    });

    doc.font('Times-Bold').fontSize(12).text("RAFFLE ACCOUNT BALANCE", {
        align: "center",
        continued: true
    }).text(`${formatCurrency(specialRecords[0].Raffle)}`, {
        align: "right",
        lineGap: 8
    });

    doc.end();
}
