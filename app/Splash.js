'use client';

// Shown over the form on arrival so applicants know what to gather before they
// start — the uploads are the step most likely to strand someone mid-form.
export default function Splash({ onStart, positions = [] }) {
  const availablePositions = positions.filter((p) => p.is_active);
  const closedPositions = positions.filter((p) => !p.is_active);
  const hasPositions = availablePositions.length > 0 || closedPositions.length > 0;

  return (
    <div className="splash-overlay">
      <div className="splash-card">
        <h1>CORTEX ROBOTICS</h1>
        <div className="sub">Internship / Recruitment Drive</div>

        <p className="splash-intro">
          Thank you for taking the time to apply for a position at Cortex Robotics.
        </p>
        <p className="splash-lead">
          Please have the following in hand before you begin — you will be asked to
          upload them as part of your application. Please note the minimum CGPA requirements: Support Roles require CGPA &gt; 3.0, and Engineering Roles require CGPA &gt; 3.2.
        </p>

        {hasPositions && (
          <div className="splash-positions">
            {availablePositions.length > 0 && (
              <div className="splash-available">
                <strong>Available Positions:</strong>
                <ul style={{ margin: '6px 0 0 0' }}>
                  {availablePositions.map((p) => (
                    <li key={p.id}>{p.title}</li>
                  ))}
                </ul>
              </div>
            )}
            {closedPositions.length > 0 && (
              <div className="splash-notice">
                <strong>Currently Closed:</strong>
                <ul style={{ margin: '6px 0 0 0' }}>
                  {closedPositions.map((p) => (
                    <li key={p.id}>{p.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="splash-req">
          <h2>Applying as an Intern, or Graduating</h2>
          <p className="splash-req-note">Have these ready:</p>
          <ol>
            <li>Your resume</li>
            <li>
              Your results transcript, covering everything from the commencement of
              your program
            </li>
            <li>
              Interns only — the start date and end date of your internship
            </li>
          </ol>

          <div className="splash-callout">
            <strong>Internship Duration & CGPA Requirements</strong>
            <ul>
              <li>Support roles — 3 months, CGPA &gt; 3.0 (i.e. Finance, Procurement, etc)</li>
              <li>Engineering roles — 6 months, CGPA &gt; 3.2 (i.e. Software Engineering, Mechanical Engineering, etc)</li>
            </ul>
            <p>Please set your Start and End Date in the application to match.</p>
          </div>
        </div>

        <div className="splash-req">
          <h2>Already Working</h2>
          <ul>
            <li>Your resume</li>
            <li>3 months salary slip</li>
          </ul>
        </div>

        <p className="splash-note">
          All documents must be PDF files, and only one file can be uploaded per
          document.
        </p>

        <button className="primary" type="button" onClick={onStart}>
          Start My Application
        </button>
      </div>
    </div>
  );
}
