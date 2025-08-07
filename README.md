# 股票警報系統

一個即時監控港股跌幅榜的 PWA 應用，當股票跌幅超過40%時自動發送通知。

## 功能特色

- 📊 即時顯示港股跌幅榜前20名
- 🔄 每30秒自動刷新資料
- 🚨 跌幅超過40%自動發送通知
- 📱 PWA支援，可安裝為桌面應用
- 🕐 只在交易時段（09:00-16:30）提供資料

## 快速開始

### 1. 啟動後端服務

```bash
cd backend
node index.js
```

後端服務會在 http://localhost:7777 啟動。

### 2. 啟動前端應用

```bash
cd frontend
npm start
```

前端應用會在 http://localhost:3000 啟動。

## 專案結構

```
stock-alert/
├── backend/          # Node.js 後端 API
│   ├── index.js      # 主程式（爬蟲 + API）
│   └── package.json
└── frontend/         # React PWA 前端
    ├── src/
    │   ├── App.js    # 主應用組件
    │   └── index.js  # 入口檔案
    └── package.json
```

## 技術架構

### 後端
- Node.js + Express
- Axios (HTTP 請求)
- Cheerio (HTML 解析)
- Day.js (時間處理)

### 前端
- React 19
- Material-UI
- PWA (Service Worker)
- Axios (API 請求)

## 注意事項

- 請確保已授予瀏覽器通知權限
- 後端服務需要網路連線以抓取 etnet 資料
- 通知功能只在交易時段有效 