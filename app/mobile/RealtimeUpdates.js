'use client';

import { useEffect, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function RealtimeUpdates({ onApplicantChange }) {
  const pollIntervalRef = useRef(null);
  const lastCountRef = useRef(0);

  useEffect(() => {
    const supabase = supabaseBrowser();

    // Subscribe to Realtime changes (primary method)
    const subscription = supabase
      .channel('applicants-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'applicants',
        },
        (payload) => {
          // Trigger refresh immediately on any change
          onApplicantChange();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Realtime is connected, reduce polling frequency
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          // Still poll every 30 seconds as fallback
          pollIntervalRef.current = setInterval(pollForUpdates, 30000);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // If Realtime fails, poll more frequently (every 5 seconds)
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = setInterval(pollForUpdates, 5000);
        }
      });

    // Polling fallback function
    async function pollForUpdates() {
      try {
        const response = await fetch('/api/mobile/applicants');
        if (response.ok) {
          const data = await response.json();
          const currentCount = data.length;
          if (currentCount !== lastCountRef.current) {
            lastCountRef.current = currentCount;
            onApplicantChange();
          }
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }

    // Initial poll on mount
    pollForUpdates();

    return () => {
      subscription.unsubscribe();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [onApplicantChange]);

  return null;
}
