import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [notifiedStocks, setNotifiedStocks] = useState(new Set());

  // 檢查通知權限
  useEffect(() => {
    if ('Notification' in window) {
      console.log('通知權限狀態:', Notification.permission);
      if (Notification.permission === 'default') {
        console.log('請求通知權限...');
        Notification.requestPermission().then(permission => {
          console.log('通知權限結果:', permission);
        });
      }
    } else {
      console.log('此瀏覽器不支援通知功能');
    }
  }, []);

  // 發送通知
  const sendNotification = (stock) => {
    console.log('嘗試發送通知:', stock);
    if ('Notification' in window && Notification.permission === 'granted') {
      const today = dayjs().format('YYYY-MM-DD');
      const notificationKey = `${stock.code}-${today}`;
      
      console.log('通知金鑰:', notificationKey);
      console.log('已通知股票:', Array.from(notifiedStocks));
      
      if (!notifiedStocks.has(notificationKey)) {
        console.log('發送新通知:', stock.name, stock.percent);
        new Notification('股票警報', {
          body: `${stock.name} (${stock.code}) 跌幅達 ${stock.percent}`,
          icon: '/logo192.png',
          tag: notificationKey, // 防止重複通知
          requireInteraction: true // 需要用戶互動才消失
        });
        
        setNotifiedStocks(prev => new Set([...prev, notificationKey]));
        console.log('通知已發送');
      } else {
        console.log('今日已通知過此股票');
      }
    } else {
      console.log('無法發送通知 - 權限:', Notification.permission);
    }
  };

  // 檢查是否需要通知
  const checkForAlerts = (stocksData) => {
    stocksData.forEach(stock => {
      const percentValue = parseFloat(stock.percent.replace('%', ''));
      if (percentValue < -40) {
        sendNotification(stock);
      }
    });
  };

  // 獲取股票資料
  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:7777/api/stocks');
      const { stocks: stocksData, lastUpdate: updateTime } = response.data;
      
      setStocks(stocksData);
      setLastUpdate(updateTime);
      setError(null);
      
      // 檢查警報
      checkForAlerts(stocksData);
      
    } catch (err) {
      setError('無法獲取股票資料');
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  // 定時刷新
  useEffect(() => {
    let timer;
    
    const scheduleNextFetch = () => {
      const now = Date.now();
      const next = 30000 - (now % 30000); // 距離下個30秒整點
      timer = setTimeout(() => {
        fetchStocks();
        scheduleNextFetch();
      }, next);
    };

    fetchStocks();
    scheduleNextFetch();

    return () => clearTimeout(timer);
  }, []);

  // 解析變動率數值
  const parsePercent = (percentStr) => {
    return parseFloat(percentStr.replace('%', ''));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        股票警報系統
      </Typography>
      
      {/* 測試通知按鈕 */}
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          color="secondary"
          onClick={() => {
            console.log('手動測試通知');
            sendNotification({
              code: 'TEST001',
              name: '測試股票',
              percent: '-41.176%'
            });
          }}
          sx={{ mr: 2 }}
        >
          測試通知
        </Button>
        <Button 
          variant="outlined"
          onClick={() => {
            if ('Notification' in window) {
              Notification.requestPermission().then(permission => {
                console.log('通知權限結果:', permission);
                alert(`通知權限: ${permission}`);
              });
            }
          }}
        >
          檢查通知權限
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {lastUpdate && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          最後更新: {dayjs(lastUpdate).format('YYYY-MM-DD HH:mm:ss')}
        </Typography>
      )}

      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>代號</TableCell>
                <TableCell>名稱</TableCell>
                <TableCell>按盤價</TableCell>
                <TableCell>變動</TableCell>
                <TableCell>變動率</TableCell>
                <TableCell>最高價</TableCell>
                <TableCell>最低價</TableCell>
                <TableCell>成交金額</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : stocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    非交易時段或無資料
                  </TableCell>
                </TableRow>
              ) : (
                stocks.map((stock, index) => {
                  const percentValue = parsePercent(stock.percent);
                  const isAlert = percentValue < -40;
                  
                  return (
                    <TableRow 
                      key={index}
                      sx={{
                        backgroundColor: isAlert ? '#ffebee' : 'inherit',
                        '&:hover': {
                          backgroundColor: isAlert ? '#ffcdd2' : '#f5f5f5'
                        }
                      }}
                    >
                      <TableCell>{stock.code}</TableCell>
                      <TableCell>{stock.name}</TableCell>
                      <TableCell>{stock.price}</TableCell>
                      <TableCell sx={{ color: 'red' }}>{stock.change}</TableCell>
                      <TableCell sx={{ color: 'red', fontWeight: isAlert ? 'bold' : 'normal' }}>
                        {stock.percent}
                      </TableCell>
                      <TableCell>{stock.high}</TableCell>
                      <TableCell>{stock.low}</TableCell>
                      <TableCell>{stock.amount}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default App;
