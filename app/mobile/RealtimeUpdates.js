'use client';

import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function RealtimeUpdates({ onApplicantChange }) {
  useEffect(() => {
    const supabase = supabaseBrowser();

    // Subscribe to all changes in the applicants table
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
          // Trigger refresh when any applicant changes
          onApplicantChange();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [onApplicantChange]);

  return null;
}
