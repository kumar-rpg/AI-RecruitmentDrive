'use client';

import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function SessionGuard() {
  useEffect(() => {
    function handleUnload() {
      // Clear the local session immediately (localStorage cleared synchronously
      // inside signOut even though the HTTP token-revocation is async).
      supabaseBrowser().auth.signOut();
    }
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return null;
}
