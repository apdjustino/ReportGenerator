const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const { format } = require("d3-format");

const [bankCsvPath, actBlueCsvPath] = process.argv.slice(2);

const formatCurrency = val => format("($,.2f")(val);
const sortBy = (key) => {
    return (a, b) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0);
  };


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
