'use client';

// Shown over the form on arrival so applicants know what to gather before they
// start — the uploads are the step most likely to strand someone mid-form.
export default function Splash({ onStart }) {
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
          upload them as part of your application.
        </p>

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
            <strong>Internship Duration</strong>
            <ul>
              <li>Support roles — 3 months</li>
              <li>Engineering roles — exactly 6 months, no more, no less</li>
            </ul>
            <p>Please set your Start and End Date in the application to match.</p>
          </div>
        </div>

        <div className="splash-req">
          <h2>Already Working</h2>
          <ul>
            <li>Your resume</li>
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
