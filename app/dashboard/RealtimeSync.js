'use client';

import { useEffect, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function RealtimeSync({ onDataChange }) {
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    const supabase = supabaseBrowser();

    // Subscribe to Realtime changes on applicants table
    const subscription = supabase
      .channel('dashboard-sync')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'applicants',
        },
        (payload) => {
          // Trigger refresh immediately on any applicant change
          onDataChange();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Realtime is connected, poll every 30 seconds as backup
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = setInterval(onDataChange, 30000);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // If Realtime fails, poll every 5 seconds
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = setInterval(onDataChange, 5000);
        }
      });

    return () => {
      subscription.unsubscribe();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [onDataChange]);

  return null;
}
