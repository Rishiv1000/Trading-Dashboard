import React, { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT";

const fetchPriceData = async () => {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

const calculateMovingAverage = (data, period) => {
  if (data.length < period) return null;

  const recentPrices = data.slice(-period);
  let total = 0;
  for (let price of recentPrices) {
    total += price;
  }

  return total / period;
};



export default function App() {
  const [price, setPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [shortMA, setShortMA] = useState(null);
  const [longMA, setLongMA] = useState(null);
  const [signal, setSignal] = useState("Calculating...");
  const [tradeHistory, setTradeHistory] = useState([]);

  const processPriceData = (newPrice) => {
    setPrice(newPrice);
    setPriceHistory((prev) => [...prev, newPrice].slice(-20));

    const shortMA = calculateMovingAverage(priceHistory, 5);
    const longMA = calculateMovingAverage(priceHistory, 20);

    setShortMA(shortMA);
    setLongMA(longMA);

    if (shortMA && longMA) {
      if (shortMA > longMA) {
        setSignal("Buy 🚀");
        addTrade("Buy", newPrice);
      } else if (shortMA < longMA ) {
        setSignal("Sell 🔻");
        addTrade("Sell", newPrice);
      }
    } else {
      setSignal("Calculating...");
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const newPrice = await fetchPriceData();
      if (newPrice) {
        processPriceData(newPrice);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [priceHistory]);

  const addTrade = (type, price) => {
    const newTrade = {
      type,
      price: price.toFixed(2),
      time: new Date().toLocaleTimeString(),
    };
    setTradeHistory((prev) => [newTrade, ...prev].slice(0, 5));
  };

  return (
    <div className="dashboard">
      <h1>📈 BTC/USDT Trading Dashboard</h1>

      <div className="info">
        <p>Current Price: <strong>{price ? price.toFixed(2) : "Calculating..."}</strong></p>
        <p>Short MA (5): <strong>{shortMA !== null ? shortMA.toFixed(2) : "Calculating..."}</strong></p>
        <p>Long MA (20): <strong>{longMA !== null ? longMA.toFixed(2) : "Calculating..."}</strong></p>

        <h2 className={signal === "Buy 🚀" ? "buy" : signal === "Sell 🔻" ? "sell" : ""}>
          {signal}
        </h2>
      </div>

      <div className="trade-history">
        <h3>🔔 Trade History</h3>
        {tradeHistory.length === 0 && <p>No trades yet.</p>}
        <ul>
          {tradeHistory.map((trade, index) => (
            <li key={index} className={trade.type === "Buy" ? "buy" : "sell"}>
              {trade.type} @ ${trade.price} - {trade.time}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
