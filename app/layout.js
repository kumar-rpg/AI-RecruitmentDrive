import './globals.css';

export const metadata = {
  title: 'CORTEX ROBOTICS — Recruitment Drive',
  description: 'Internship and job application intake for CORTEX ROBOTICS.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
