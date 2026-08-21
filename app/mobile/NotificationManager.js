'use client';

import { useEffect, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function NotificationManager({ applicants }) {
  const applicantCountRef = useRef(applicants.length);

  useEffect(() => {
    // Register service worker for notifications
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        // Service worker registration failed, but app can still work
      });
    }
  }, []);

  useEffect(() => {
    const currentCount = applicants.length;
    const previousCount = applicantCountRef.current;

    // If there are new applicants, show notification
    if (currentCount > previousCount) {
      const newApplicantCount = currentCount - previousCount;
      showNotification(newApplicantCount);
      applicantCountRef.current = currentCount;
    }
  }, [applicants.length]);

  function showNotification(newCount) {
    if ('Notification' in window) {
      // Request permission if not already granted
      if (Notification.permission === 'granted') {
        sendNotification(newCount);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            sendNotification(newCount);
          }
        });
      }
    }
  }

  function sendNotification(newCount) {
    const title = 'New Application' + (newCount > 1 ? 's' : '');
    const body = `${newCount} new applicant${newCount > 1 ? 's' : ''} received`;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        notification: {
          title,
          options: {
            body,
            icon: '/cortex-icon.png',
            badge: '/cortex-badge.png',
            tag: 'applicant-notification',
            requireInteraction: true,
          },
        },
      });
    } else if ('Notification' in window) {
      new Notification(title, {
        body,
        icon: '/cortex-icon.png',
        tag: 'applicant-notification',
        requireInteraction: true,
      });
    }
  }

  return null;
}
