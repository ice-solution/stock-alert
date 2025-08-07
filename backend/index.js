const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const cors = require('cors');
dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();
const PORT = 7777;

// 設定 CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

let cachedStocks = [];
let lastUpdate = null;

// 時間判斷 function
function isMarketOpen() {
  const now = dayjs().tz('Asia/Hong_Kong');
  const open = now.hour() > 9 || (now.hour() === 9 && now.minute() >= 0);
  const close = now.hour() < 16 || (now.hour() === 16 && now.minute() <= 30);
  return open && close;
}

// 爬蟲 function
async function fetchStocks() {
  if (!isMarketOpen()) {
    cachedStocks = [];
    lastUpdate = null;
    return;
  }
  try {
    const { data } = await axios.get('https://www.etnet.com.hk/www/tc/stocks/realtime/top20.php?subtype=down&view=default');
    const $ = cheerio.load(data);
    const rows = [];
    
    // 使用正確的選擇器來找到股票資料表格
    $('table.figureTable tr').each((i, el) => {
      const tds = $(el).find('td');
      if (tds.length >= 10) { // 確保有足夠的欄位
        const code = $(tds[1]).text().trim();
        const name = $(tds[2]).text().trim();
        const price = $(tds[4]).text().trim();
        const change = $(tds[5]).text().trim();
        const percent = $(tds[6]).text().trim();
        const high = $(tds[7]).text().trim();
        const low = $(tds[8]).text().trim();
        const amount = $(tds[9]).text().trim();
        
        // 只添加有效的股票資料（有代號的）
        if (code && code.length > 0 && code !== '代號') {
          rows.push({
            code,
            name,
            price,
            change,
            percent,
            high,
            low,
            amount,
          });
        }
      }
    });
    
    // 添加測試股票（跌幅超過40%）
    rows.unshift({
      code: "TEST001",
      name: "測試股票",
      price: "0.100",
      change: "-0.070",
      percent: "-41.176%",
      high: "0.170",
      low: "0.100",
      amount: "1.00萬"
    });
    
    cachedStocks = rows;
    lastUpdate = dayjs().tz('Asia/Hong_Kong').format();
    console.log(`成功抓取 ${rows.length} 筆股票資料`);
  } catch (e) {
    console.error('爬蟲錯誤:', e.message);
  }
}

// 每30秒自動爬取
setInterval(fetchStocks, 30000);
fetchStocks(); // 啟動時先抓一次

// API 路由
app.get('/api/stocks', (req, res) => {
  res.json({
    lastUpdate,
    stocks: cachedStocks,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 