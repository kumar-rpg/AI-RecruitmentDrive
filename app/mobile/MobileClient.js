'use client';

import { useState, useMemo } from 'react';
import MobileAuth from './MobileAuth';
import MobileDashboard from './MobileDashboard';

const PASSCODE = '123456';

export default function MobileClient({ applicants }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const handlePasscodeSubmit = (passcode) => {
    if (passcode === PASSCODE) {
      setIsAuthenticated(true);
    }
  };

  if (!isAuthenticated) {
    return <MobileAuth onSubmit={handlePasscodeSubmit} />;
  }

  return <MobileDashboard applicants={applicants} statuses={statuses} />;
}
