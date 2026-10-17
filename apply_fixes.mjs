import fs from 'fs';
import path from 'path';

// Fix database.ts
let dbTypes = fs.readFileSync('src/types/database.ts', 'utf8');
dbTypes = dbTypes.replace(/category\?: string;\r?\n\}/g, 'category?: string;\n  payment_method?: string;\n}');
dbTypes = dbTypes.replace(/category: string;\r?\n\}/g, 'category: string;\n  payment_method: string;\n}');
fs.writeFileSync('src/types/database.ts', dbTypes, 'utf8');

// Fix db.ts
let dbTs = fs.readFileSync('src/services/db.ts', 'utf8');
dbTs = dbTs.replace(/category: expense\.category \|\| 'Genel Gider'/g, "category: expense.category || 'Genel Gider',\n      payment_method: expense.payment_method || 'Nakit'");
dbTs = dbTs.replace(/\(id, date, description, amount, notes, category\)/g, "(id, date, description, amount, notes, category, payment_method)");
dbTs = dbTs.replace(/\[newExpense\.id, newExpense\.date, newExpense\.description, newExpense\.amount, newExpense\.notes, newExpense\.category\]/g, "[newExpense.id, newExpense.date, newExpense.description, newExpense.amount, newExpense.notes, newExpense.category, newExpense.payment_method]");
dbTs = dbTs.replace(/category = \?\s+WHERE id = \?/g, "category = ?, payment_method = ?\n       WHERE id = ?");
dbTs = dbTs.replace(/expense\.category \|\| 'Genel Gider', id\]/g, "expense.category || 'Genel Gider', expense.payment_method || 'Nakit', id]");
fs.writeFileSync('src/services/db.ts', dbTs, 'utf8');

// Fix DashboardHome.tsx
let dashboard = fs.readFileSync('src/app/dashboard/DashboardHome.tsx', 'utf8');
dashboard = dashboard.replace(/category: 'Genel Gider' \}\)/g, "category: 'Genel Gider', payment_method: 'Nakit' })");

const oldHtml = `<div>
                              <label className="text-[10px] text-secondary block mb-1 font-sans">Kategori*</label>
                              <select 
                                required
                                className="custom-input text-xs h-9 w-full text-white bg-neutral-900 border-white/10"
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                              >
                                <option value="Genel Gider">Genel Gider</option>
                                <option value="Kargo">Kargo</option>
                                <option value="Emanet">Emanet</option>
                                <option value="Teknik Servis">Teknik Servis</option>
                                <option value="Şirket Giderleri">Şirket Giderleri (Kasa Harici)</option>
                              </select>
                            </div>`;

const newHtml = `<div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-secondary block mb-1 font-sans">Kategori*</label>
                                <select 
                                  required
                                  className="custom-input text-xs h-9 w-full text-white bg-neutral-900 border-white/10"
                                  value={newExpense.category}
                                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                >
                                  <option value="Genel Gider">Genel Gider</option>
                                  <option value="Kargo">Kargo</option>
                                  <option value="Emanet">Emanet</option>
                                  <option value="Teknik Servis">Teknik Servis</option>
                                  <option value="Şirket Giderleri">Şirket Giderleri (Kasa Harici)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-secondary block mb-1 font-sans">Ödeme Yöntemi*</label>
                                <select 
                                  required
                                  className="custom-input text-xs h-9 w-full text-white bg-neutral-900 border-white/10"
                                  value={newExpense.payment_method}
                                  onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                                >
                                  <option value="Nakit">Nakit</option>
                                  <option value="Kredi Kartı">Kredi Kartı</option>
                                  <option value="Havale/EFT">Havale/EFT</option>
                                </select>
                              </div>
                            </div>`;
dashboard = dashboard.replace(oldHtml, newHtml);

const oldSpan = `{expense.category || 'Genel Gider'}
                                        </span>
                                      </div>`;

const newSpan = `{expense.category || 'Genel Gider'}
                                        </span>
                                        {expense.payment_method && expense.payment_method !== 'Nakit' && (
                                          <span className="text-[7px] px-1 py-0.2 rounded font-bold font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/10">
                                            {expense.payment_method}
                                          </span>
                                        )}
                                      </div>`;
dashboard = dashboard.replace(oldSpan, newSpan);

const oldCalc = `const todayExpenses = expensesList
                    .filter(exp => exp.date === todayStr && exp.category !== 'Şirket Giderleri' && exp.category !== 'Kasa Çıkışı / Diğer')
                    .reduce((sum, exp) => sum + (toNum(exp.amount) || 0), 0);`;

const newCalc = `const todayExpenses = expensesList
                    .filter(exp => exp.date === todayStr && exp.category !== 'Şirket Giderleri' && exp.category !== 'Kasa Çıkışı / Diğer' && (!exp.payment_method || exp.payment_method === 'Nakit'))
                    .reduce((sum, exp) => sum + (toNum(exp.amount) || 0), 0);`;
dashboard = dashboard.replace(oldCalc, newCalc);

fs.writeFileSync('src/app/dashboard/DashboardHome.tsx', dashboard, 'utf8');

// Global Date Fixes
const allFiles = ['src/services/db.ts', 'src/app/dashboard/DashboardHome.tsx'];
for(let f of allFiles) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Convert new Date().toLocaleDateString('sv-SE') -> formatDateISO()
    // Convert anything.toLocaleDateString('sv-SE') -> formatDateISO(anything)
    
    // Add import statement at the top if it doesn't exist
    if (!content.includes('formatDateISO')) {
        let imports = "import { formatDateISO } from '@/lib/utils/date';\n";
        content = imports + content;
    }

    content = content.replace(/new Date\(\)\.toLocaleDateString\(['"]sv-SE['"]\)/g, "formatDateISO()");
    content = content.replace(/(\w+)\.toLocaleDateString\(['"]sv-SE['"]\)/g, "formatDateISO($1)");
    
    fs.writeFileSync(f, content, 'utf8');
}

console.log("Fixes applied successfully.");
