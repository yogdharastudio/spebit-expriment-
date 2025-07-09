// Notification utilities for crypto price updates and alerts

export interface NotificationService {
  requestPermission(): Promise<boolean>;
  sendNotification(title: string, body: string, icon?: string): void;
  scheduleNotification(title: string, body: string, delay: number): void;
}

class BrowserNotificationService implements NotificationService {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  sendNotification(title: string, body: string, icon: string = '/favicon.ico'): void {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      body,
      icon,
      badge: '/favicon.ico',
      tag: 'crypto-update',
      requireInteraction: false,
      silent: false
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  scheduleNotification(title: string, body: string, delay: number): void {
    setTimeout(() => {
      this.sendNotification(title, body);
    }, delay);
  }
}

export const notificationService = new BrowserNotificationService();

// Crypto price monitoring
export class CryptoPriceMonitor {
  private lastPrices: Map<string, number> = new Map();
  private priceThreshold = 5; // 5% change threshold

  constructor(private notificationService: NotificationService) {}

  updatePrice(symbol: string, newPrice: number, cryptoName: string): void {
    const lastPrice = this.lastPrices.get(symbol);
    
    if (lastPrice && lastPrice !== newPrice) {
      const percentChange = ((newPrice - lastPrice) / lastPrice) * 100;
      
      if (Math.abs(percentChange) >= this.priceThreshold) {
        const direction = percentChange > 0 ? '📈 UP' : '📉 DOWN';
        const changeText = `${Math.abs(percentChange).toFixed(2)}%`;
        
        this.notificationService.sendNotification(
          `${symbol} Price Alert! ${direction}`,
          `${cryptoName} is ${direction} by ${changeText}. New price: ₹${newPrice.toFixed(2)}`
        );
      }
    }
    
    this.lastPrices.set(symbol, newPrice);
  }

  notifyNewCrypto(cryptoName: string, symbol: string, price: number): void {
    this.notificationService.sendNotification(
      '🚀 New Cryptocurrency Added!',
      `${cryptoName} (${symbol}) is now available for trading at ₹${price.toFixed(2)}`
    );
  }
}

export const priceMonitor = new CryptoPriceMonitor(notificationService);

// Initialize notifications on app start
export const initializeNotifications = async (): Promise<boolean> => {
  const hasPermission = await notificationService.requestPermission();
  
  if (hasPermission) {
    // Welcome notification
    setTimeout(() => {
      notificationService.sendNotification(
        '🎉 Welcome to Spebit!',
        'You\'ll receive notifications for price alerts and new cryptocurrencies.'
      );
    }, 2000);
  }
  
  return hasPermission;
};