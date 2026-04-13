import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

/**
 * Helper to convert urlB64ToUint8Array
 */
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushNotificationManager() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const subscribeToPush = async () => {
            try {
                // Check if Notifications are supported
                if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

                // Request permission
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                // Get service worker registration
                const registration = await navigator.serviceWorker.ready;

                // Get VAPID public key from backend
                const { data } = await api.get('/api/push/vapidPublicKey');
                const applicationServerKey = urlB64ToUint8Array(data.publicKey);

                // Subscribe to push manager
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey,
                });

                // Send subscription to backend
                await api.post('/api/push/subscription', subscription);
                console.log('✅ Push notifications registered');
            } catch (error) {
                console.error('Failed to subscribe to push notifications:', error);
            }
        };

        subscribeToPush();
    }, [user]);

    return null;
}
