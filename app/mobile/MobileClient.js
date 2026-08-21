'use client';

import { useState, useMemo, useCallback } from 'react';
import MobileAuth from './MobileAuth';
import MobileDashboard from './MobileDashboard';

export default function MobileClient({ applicants: initialApplicants }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [applicants, setApplicants] = useState(initialApplicants);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleApplicantChange = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Re-fetch applicants when data changes with cache busting
      const response = await fetch(`/api/mobile/applicants?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setApplicants(data);
      }
    } catch (error) {
      console.error('Failed to refresh applicants:', error);
    } finally {
      // Keep refreshing indicator visible for at least 200ms for visual feedback
      setTimeout(() => setIsRefreshing(false), 200);
    }
  }, []);

  const statuses = useMemo(() => {
    const counts = {
      New: 0,
      Reviewing: 0,
      Shortlisted: 0,
      Interview: 0,
      Offered: 0,
      Hired: 0,
      Rejected: 0,
      Declined: 0,
      KIV: 0,
    };

    applicants.forEach((a) => {
      if (counts.hasOwnProperty(a.status)) {
        counts[a.status]++;
      }
    });

    return counts;
  }, [applicants]);

  const handlePasscodeSubmit = (isValid) => {
    if (isValid) {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <MobileAuth onSubmit={handlePasscodeSubmit} />;
  }

  return (
    <MobileDashboard
      applicants={applicants}
      statuses={statuses}
      onLogout={handleLogout}
      onApplicantChange={handleApplicantChange}
      isRefreshing={isRefreshing}
    />
  );
}
