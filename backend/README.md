# Stock Alert 後端

## 啟動方式

```bash
cd backend
node index.js
```

伺服器啟動後，API 會在 http://localhost:3001/api/stocks 提供最新股票資料。

- 每 30 秒自動爬取 etnet 跌幅榜資料。
- 只在香港時間 09:00-16:30 提供資料。 