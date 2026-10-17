const fs = require('fs');
const path = require('path');

const resolvedPath = path.resolve("c:/Users/PC/OneDrive/Desktop/GNC-ERP/src/app/dashboard/DashboardHome.tsx");
let content = fs.readFileSync(resolvedPath, 'utf8');

// Normalize line endings to LF for matching
content = content.replace(/\r\n/g, '\n');

const target1 = `      await dbService.saveDailyClosing({
        id: editingClosing.id,
        date: pDate,
        cash_revenue: cashRev,
        card_revenue: cardRev,
        kontor_sales: kSales,
        fatura_payments: fPayments,
        today_expenses: pastExpenses,
        expected_cash: expCash,
        physical_cash: physCash,
        physical_card: physCard,
        cash_diff: cashDiff,
        card_diff: cardDiff
      });`;

const replacement1 = `      await dbService.saveDailyClosing({
        id: editingClosing.id,
        date: pDate,
        cash_revenue: cashRev,
        card_revenue: cardRev,
        kontor_sales: kSales,
        fatura_payments: fPayments,
        today_expenses: pastExpenses,
        expected_cash: expCash,
        physical_cash: physCash,
        physical_card: physCard,
        physical_eft: 0,
        cash_diff: cashDiff,
        card_diff: cardDiff,
        eft_diff: 0,
        eft_revenue: 0
      });`;

if (!content.includes(target1)) {
  console.error("Target1 not found!");
  process.exit(1);
}

content = content.replace(target1, replacement1);
fs.writeFileSync(resolvedPath, content, 'utf8');
console.log("Daily closing edit fields updated successfully!");
