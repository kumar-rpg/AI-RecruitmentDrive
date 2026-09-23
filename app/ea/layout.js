import SessionGuard from './SessionGuard';

export default function EaLayout({ children }) {
  return (
    <>
      <SessionGuard />
      {children}
    </>
  );
}
