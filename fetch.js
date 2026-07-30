const url = 'https://lsttulczgrzksenqzhkw.supabase.co/rest/v1/sales?select=id,date,total_amount&order=id.desc&limit=10';
const key = 'sb_publishable_nRjkdcRthTCjz7YEyg6_Cg_4IvONKw1';
fetch(url, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } })
  .then(r => r.json())
  .then(console.log);
