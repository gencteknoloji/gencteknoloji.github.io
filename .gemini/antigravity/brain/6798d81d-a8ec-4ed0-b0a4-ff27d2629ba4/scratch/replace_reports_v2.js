const fs = require('fs');
const path = require('path');

const replacementPath = path.join(__dirname, 'replacement.txt');
const dashboardHomePath = path.resolve("c:/Users/PC/OneDrive/Desktop/GNC-ERP/src/app/dashboard/DashboardHome.tsx");

if (!fs.existsSync(replacementPath)) {
  console.error("replacement.txt not found");
  process.exit(1);
}

if (!fs.existsSync(dashboardHomePath)) {
  console.error("DashboardHome.tsx not found");
  process.exit(1);
}

const replacementContent = fs.readFileSync(replacementPath, 'utf8');
const dashboardHomeContent = fs.readFileSync(dashboardHomePath, 'utf8');

const targetStr = "{activeTab === 'reports' && (";
const startIndex = dashboardHomeContent.indexOf(targetStr);
if (startIndex === -1) {
  console.error("Could not find start index of activeTab === 'reports' && (");
  process.exit(1);
}

const nextTabStr = "{activeTab === 'turkcell' && (";
const nextIndex = dashboardHomeContent.indexOf(nextTabStr);
if (nextIndex === -1) {
  console.error("Could not find next tab index of activeTab === 'turkcell' && (");
  process.exit(1);
}

const blockToSearch = dashboardHomeContent.substring(startIndex, nextIndex);
const lastClosingBrace = blockToSearch.lastIndexOf("            )}");
if (lastClosingBrace === -1) {
  console.error("Could not find closing brace for reports tab in block");
  process.exit(1);
}

const replacementEndIndex = startIndex + lastClosingBrace + "            )}".length;

const newDashboardHomeContent = 
  dashboardHomeContent.substring(0, startIndex) + 
  replacementContent + 
  dashboardHomeContent.substring(replacementEndIndex);

fs.writeFileSync(dashboardHomePath, newDashboardHomeContent, 'utf8');
console.log("Replacement successful via Node.js script v2!");
