export async function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            if (confirm('新しいバージョンが利用可能です。更新しますか？')) {
              window.location.reload();
            }
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

export async function unregisterServiceWorker() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('Service Worker unregistered successfully');
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }
}

export async function checkForUpdates() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('Checked for updates');
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }
}

// Request persistent storage
export async function requestPersistentStorage() {
  if (typeof window === 'undefined') return;

  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`Persistent storage ${isPersisted ? 'granted' : 'denied'}`);
      return isPersisted;
    } catch (error) {
      console.error('Failed to request persistent storage:', error);
      return false;
    }
  }
  return false;
}

// Check if app is installed
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check if running as installed PWA on iOS
  if ((window.navigator as any).standalone) {
    return true;
  }

  return false;
}

// Install prompt
export function setupInstallPrompt() {
  if (typeof window === 'undefined') return;

  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show custom install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`Install prompt outcome: ${outcome}`);
          deferredPrompt = null;
        }
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('App installed successfully');
    deferredPrompt = null;

    // Hide install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  });
}

// Network status
export function setupNetworkStatus() {
  if (typeof window === 'undefined') return;

  const updateOnlineStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    console.log(`Network status: ${status}`);

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('network-status-change', {
      detail: { online: navigator.onLine }
    }));

    // Show/hide offline indicator
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
      offlineIndicator.style.display = navigator.onLine ? 'none' : 'block';
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Check initial status
  updateOnlineStatus();
}

// Background sync
export async function registerBackgroundSync(tag: string) {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}

// Push notifications
export async function subscribeToPushNotifications() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Push notification permission denied');
          return null;
        }

        // Subscribe
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
      }

      console.log('Push subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }
  return null;
}

// Initialize PWA features
export function initializePWA() {
  if (typeof window === 'undefined') return;

  // Register service worker
  registerServiceWorker();

  // Setup install prompt
  setupInstallPrompt();

  // Setup network status monitoring
  setupNetworkStatus();

  // Request persistent storage
  requestPersistentStorage();

  // Log PWA status
  console.log('PWA initialized', {
    installed: isAppInstalled(),
    online: navigator.onLine
  });
}