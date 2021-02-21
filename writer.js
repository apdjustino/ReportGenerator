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
        lineGap: 8,
        align: "right",
    });
});

doc.font('Times-Bold').fontSize(12).text(`TOTAL DEPOSITS ${startDate} - ${endDate}`, {
    continued: true,
    indent: 72
}).text(`${formatCurrency(totalDeposits)}`, {
    lineGap: 16,
    align: "right",
});

// Act Blue

doc.font('Times-Bold').fontSize(11).text("ActBlue Contributions", {
    lineGap: 8,
    underline: true,
});

actBlueRecords.forEach(record => {
    doc.font('Times-Roman').fontSize(10).text(`${record.Date.format("MM/DD")} From ${record["Donor First Name"]} ${record["Donor Last Name"]}`, {
        indent: 36,
        continued: true,
    }).text(`${formatCurrency(record.Amount)}`, {
        lineGap: 8,
        align: "right",
    });
})

doc.end();
}
