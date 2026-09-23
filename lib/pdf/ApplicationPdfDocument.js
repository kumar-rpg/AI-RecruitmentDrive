import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 8,
    paddingTop: 28, paddingBottom: 28, paddingLeft: 28, paddingRight: 28, color: '#000',
  },
  // Header
  headerBox: {
    borderWidth: 1, borderColor: '#000', marginBottom: 8,
    paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8,
  },
  headerCo:   { fontFamily: 'Helvetica-Bold', fontSize: 13 },
  headerForm: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginTop: 3 },
  headerMeta: { fontSize: 7.5, marginTop: 3 },
  // Section heading — View wrapper gives full-width background
  sectionBar: {
    backgroundColor: '#d8d8d8',
    paddingTop: 3, paddingBottom: 3, paddingLeft: 5, paddingRight: 5,
  },
  sectionBarText: { fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
  // Row (flex row container)
  row: { flexDirection: 'row' },
  // Cell inside a row — flex: 1 is valid here (fills remaining width)
  cell: {
    borderWidth: 1, borderColor: '#000',
    paddingTop: 2, paddingBottom: 3, paddingLeft: 4, paddingRight: 4,
    flex: 1,
  },
  noLeft: { borderLeftWidth: 0 },
  noTop:  { borderTopWidth: 0 },
  // Full-width cell NOT in a row — no flex so it doesn't expand vertically
  wide: {
    borderWidth: 1, borderColor: '#000',
    paddingTop: 2, paddingBottom: 3, paddingLeft: 4, paddingRight: 4,
  },
  wideNoTop: { borderTopWidth: 0 },
  // Text inside cells
  lbl: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, marginBottom: 1 },
  val: { fontSize: 8 },
  // Checkbox row
  cbRow:  { flexDirection: 'row', flexWrap: 'wrap', marginTop: 3 },
  cbItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 3 },
  cbBox:  { width: 8, height: 8, borderWidth: 1, borderColor: '#000', marginRight: 3 },
  cbOn:   { width: 8, height: 8, borderWidth: 1, borderColor: '#000', marginRight: 3, backgroundColor: '#000' },
  // Spacing
  section: { marginBottom: 5 },
  subHead: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, marginTop: 5, marginBottom: 2 },
});

// ── Utilities ────────────────────────────────────────────────────────────────

function v(x) {
  if (x === null || x === undefined || x === '') return ' ';
  if (typeof x === 'boolean') return x ? 'Yes' : 'No';
  return String(x);
}

function SectionTitle({ children }) {
  return (
    <View style={S.sectionBar}>
      <Text style={S.sectionBarText}>{children}</Text>
    </View>
  );
}

// Keeps section title + first content row on the same page (no orphaned headings)
function SectionStart({ title, children }) {
  return (
    <View wrap={false}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </View>
  );
}

// Cell for use inside a <View style={S.row}>
function Cell({ label, value, flex, noLeft, noTop }) {
  const style = [S.cell];
  if (noLeft) style.push(S.noLeft);
  if (noTop)  style.push(S.noTop);
  if (flex)   style.push({ flex });
  return (
    <View style={style}>
      {label ? <Text style={S.lbl}>{label}</Text> : null}
      <Text style={S.val}>{v(value)}</Text>
    </View>
  );
}

// Full-width cell NOT inside a row — no flex
function WideCell({ label, noTop, children, minHeight }) {
  const style = [S.wide];
  if (noTop) style.push(S.wideNoTop);
  if (minHeight) style.push({ minHeight });
  return (
    <View style={style}>
      {label ? <Text style={S.lbl}>{label}</Text> : null}
      {children}
    </View>
  );
}

// Table header row
function THead({ cols }) {
  return (
    <View style={S.row}>
      {cols.map((c, i) => (
        <View key={i} style={[S.cell, i > 0 && S.noLeft, { flex: c.flex || 1 }]}>
          <Text style={S.lbl}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

// Table data row
function TRow({ cols, data, noTop }) {
  return (
    <View style={S.row}>
      {cols.map((c, i) => (
        <Cell key={i} value={data[c.key]} flex={c.flex || 1} noLeft={i > 0} noTop={noTop} />
      ))}
    </View>
  );
}

function CheckItem({ label, checked }) {
  return (
    <View style={S.cbItem}>
      <View style={checked ? S.cbOn : S.cbBox} />
      <Text>{label}</Text>
    </View>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

function Header({ d }) {
  return (
    <View style={S.headerBox}>
      <Text style={S.headerCo}>CORTEX ROBOTICS SDN BHD</Text>
      <Text style={S.headerForm}>EMPLOYMENT APPLICATION FORM</Text>
      <Text style={S.headerMeta}>
        {'Position Applied: '}{v(d.position_applied)}{'     Date: '}{v(d.submitted_at ? d.submitted_at.slice(0, 10) : '')}
      </Text>
    </View>
  );
}

function PersonalSection({ d }) {
  const licenses = Array.isArray(d.driving_license) ? d.driving_license : [];
  return (
    <View style={S.section}>
      <SectionStart title="A.  PERSONAL PARTICULARS">
        <View style={S.row}>
          <Cell label="Full Name (as per IC / Passport)" value={d.full_name} flex={3} />
          <Cell label="IC / Passport No." value={d.ic_or_passport} flex={2} noLeft />
        </View>
      </SectionStart>
      <View style={S.row}>
        <Cell label="Gender"      value={d.gender}      noTop />
        <Cell label="Age"         value={d.age}         noLeft noTop />
        <Cell label="Date of Birth" value={d.date_of_birth} noLeft noTop />
        <Cell label="Nationality" value={d.nationality} noLeft noTop />
        <Cell label="Race"        value={d.race}        noLeft noTop />
        <Cell label="Religion"    value={d.religion}    noLeft noTop />
      </View>
      <View style={S.row}>
        <Cell label="Phone (Home)"   value={d.phone_home}   noTop />
        <Cell label="Phone (Mobile)" value={d.phone_mobile} noLeft noTop />
        <Cell label="Email"          value={d.email}        flex={2} noLeft noTop />
        <Cell label="Marital Status" value={d.marital_status} noLeft noTop />
      </View>
      <WideCell label="Residential Address" noTop>
        <Text style={S.val}>{v(d.residential_address)}</Text>
      </WideCell>
      <View style={S.row}>
        <Cell label="State"   value={d.state}   noTop />
        <Cell label="Country" value={d.country === 'Other' ? d.country_other : d.country} noLeft noTop />
      </View>
      <WideCell label="Driving License(s)" noTop>
        <View style={S.cbRow}>
          {['A', 'B2', 'B', 'C', 'D', 'DA'].map((lic) => (
            <CheckItem key={lic} label={lic} checked={licenses.includes(lic)} />
          ))}
        </View>
      </WideCell>
    </View>
  );
}

function EducationSection({ d }) {
  const edu = d.education || [];
  const levels = ['Primary', 'Secondary', 'University / College', 'Others'];
  const cols = [
    { label: 'Level',                key: 'type',          flex: 1.3 },
    { label: 'School / Institution', key: 'school',        flex: 2.2 },
    { label: 'Qualification',        key: 'qualification', flex: 2 },
    { label: 'Year',                 key: 'year',          flex: 0.7 },
  ];
  return (
    <View style={S.section}>
      <SectionStart title="B.  EDUCATIONAL BACKGROUND">
        <THead cols={cols} />
      </SectionStart>
      {levels.map((lvl, i) => {
        const row = edu.find((e) => e.type === lvl) || {};
        return <TRow key={i} cols={cols} data={{ ...row, type: lvl }} noTop />;
      })}
    </View>
  );
}

function TrainingSection({ d }) {
  const training = d.professional_training || [];
  const cols = [
    { label: 'Course',        key: 'course',        flex: 2 },
    { label: 'Institution',   key: 'institution',   flex: 2 },
    { label: 'Qualification', key: 'qualification', flex: 1.5 },
    { label: 'Year',          key: 'year',          flex: 0.7 },
  ];
  const rows = Array.from({ length: 5 }, (_, i) => training[i] || {});
  return (
    <View style={S.section}>
      <SectionStart title="C.  PROFESSIONAL TRAINING">
        <THead cols={cols} />
      </SectionStart>
      {rows.map((row, i) => <TRow key={i} cols={cols} data={row} noTop />)}
    </View>
  );
}

function LanguageSection({ d }) {
  const lang = d.languages || {};
  const langs = [
    { label: 'English',                                                       key: 'english' },
    { label: 'Bahasa Malaysia',                                               key: 'bahasa_malaysia' },
    { label: 'Chinese',                                                       key: 'chinese' },
    { label: lang.others?.name ? `Others (${lang.others.name})` : 'Others',  key: 'others' },
  ];
  return (
    <View style={S.section}>
      <SectionStart title="D.  LANGUAGE PROFICIENCY  (0 = None, 10 = Excellent)">
        <View style={S.row}>
          <View style={[S.cell, { flex: 1.5 }]}><Text style={S.lbl}>Language</Text></View>
          <View style={[S.cell, S.noLeft]}><Text style={S.lbl}>Speaking</Text></View>
          <View style={[S.cell, S.noLeft]}><Text style={S.lbl}>Reading</Text></View>
          <View style={[S.cell, S.noLeft]}><Text style={S.lbl}>Writing</Text></View>
        </View>
      </SectionStart>
      {langs.map((l, i) => {
        const data = lang[l.key] || {};
        return (
          <View key={i} style={S.row}>
            <Cell value={l.label} flex={1.5} noTop />
            <Cell value={data.speaking} noLeft noTop />
            <Cell value={data.reading}  noLeft noTop />
            <Cell value={data.writing}  noLeft noTop />
          </View>
        );
      })}
    </View>
  );
}

function FamilySection({ d }) {
  const members = d.family_members || [];
  const cols = [
    { label: 'Name',             key: 'name',         flex: 2 },
    { label: 'Relationship',     key: 'relationship', flex: 1.2 },
    { label: 'Age',              key: 'age',          flex: 0.6 },
    { label: 'Employer / School',key: 'employer',     flex: 2 },
  ];
  const rows = Array.from({ length: 5 }, (_, i) => members[i] || {});
  return (
    <View style={S.section}>
      <SectionStart title="E.  FAMILY BACKGROUND">
        <THead cols={cols} />
      </SectionStart>
      {rows.map((row, i) => <TRow key={i} cols={cols} data={row} noTop />)}
    </View>
  );
}

function JobBlock({ label, emp }) {
  if (!emp || !Object.values(emp).some(Boolean)) return null;
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={S.subHead}>{label}</Text>
      <View style={S.row}>
        <Cell label="Company"       value={emp.company}       flex={2} />
        <Cell label="Tel"           value={emp.tel}           noLeft />
        <Cell label="Business Type" value={emp.business_type} noLeft />
      </View>
      <View style={S.row}>
        <Cell label="Position"   value={emp.position}   noTop />
        <Cell label="Department" value={emp.department} noLeft noTop />
        <Cell label="From"       value={emp.from_date}  noLeft noTop />
        <Cell label="To"         value={emp.to_date}    noLeft noTop />
      </View>
      <View style={S.row}>
        <Cell label="Starting Salary (RM)" value={emp.salary_start}   noTop />
        <Cell label="Current Salary (RM)"  value={emp.salary_current} noLeft noTop />
        <Cell label="Benefits"             value={emp.benefits} flex={2} noLeft noTop />
      </View>
      <WideCell label="Reason for Leaving" noTop>
        <Text style={S.val}>{v(emp.reason_for_leaving)}</Text>
      </WideCell>
    </View>
  );
}

function EmploymentSection({ d }) {
  const prev = d.previous_employment || [];
  const hasCurrent = d.current_employment && Object.values(d.current_employment).some(Boolean);
  const hasPrev    = prev.some((p) => Object.values(p).some(Boolean));
  if (!hasCurrent && !hasPrev) return null;
  return (
    <View style={S.section}>
      <SectionStart title="F.  EMPLOYMENT HISTORY">
        <JobBlock label="Current / Most Recent Employer" emp={d.current_employment} />
      </SectionStart>
      {prev.map((p, i) => <JobBlock key={i} label={`Previous Employer ${i + 1}`} emp={p} />)}
    </View>
  );
}

function GeneralSection({ d }) {
  const sources = d.vacancy_source || [];
  const sourceOpts = [
    { key: 'newspaper',          label: 'Newspaper' },
    { key: 'internet',           label: 'Internet / Job Portal' },
    { key: 'employee_referral',  label: 'Employee Referral' },
    { key: 'recruitment_agency', label: 'Recruitment Agency' },
    { key: 'walk_in',            label: 'Walk-in' },
    { key: 'others',             label: 'Others' },
  ];
  const cortex    = d.cortex_connections || [];
  const hasCortex = cortex.some((c) => Object.values(c).some(Boolean));
  return (
    <View style={S.section}>
      <SectionStart title="G.  GENERAL INFORMATION">
        <View style={S.row}>
          <Cell label="Expected Monthly Salary (RM)" value={d.expected_salary} />
          <Cell label="Notice Period (months)"        value={d.notice_period_months} noLeft />
          <Cell label="Expected Join Date"            value={d.expected_join_date}   noLeft />
        </View>
      </SectionStart>
      <WideCell label="How did you hear about this vacancy?" noTop>
        <View style={S.cbRow}>
          {sourceOpts.map((s) => <CheckItem key={s.key} label={s.label} checked={sources.includes(s.key)} />)}
        </View>
        {sources.includes('employee_referral') && d.vacancy_source_employee_name
          ? <Text style={[S.val, { marginTop: 2 }]}>Referred by: {d.vacancy_source_employee_name}</Text>
          : null}
        {sources.includes('recruitment_agency') && d.vacancy_source_agency
          ? <Text style={[S.val, { marginTop: 2 }]}>Agency: {d.vacancy_source_agency}</Text>
          : null}
      </WideCell>
      <View style={S.row}>
        <WideCell label="Have you ever been convicted of any criminal offence?" noTop>
          <Text style={S.val}>
            {d.criminal_conviction ? 'Yes' : 'No'}
            {d.criminal_conviction && d.criminal_conviction_details ? `  —  ${d.criminal_conviction_details}` : ''}
          </Text>
        </WideCell>
      </View>
      <View style={S.row}>
        <WideCell label="Do you have any health condition that may affect your work performance?" noTop>
          <Text style={S.val}>
            {d.health_condition === 'yes' ? 'Yes' : 'No'}
            {d.health_condition === 'yes' && d.health_condition_details ? `  —  ${d.health_condition_details}` : ''}
          </Text>
        </WideCell>
      </View>
      {d.is_pregnant !== null && d.is_pregnant !== undefined && (
        <View style={S.row}>
          <WideCell label="Currently Pregnant? (Female applicants)" noTop>
            <Text style={S.val}>
              {d.is_pregnant === true ? 'Yes' : d.is_pregnant === false ? 'No' : 'N/A'}
              {d.is_pregnant === true && d.pregnancy_due_date ? `  —  Due: ${d.pregnancy_due_date}` : ''}
            </Text>
          </WideCell>
        </View>
      )}
      {hasCortex && (
        <WideCell label="Known connections at Cortex Robotics" noTop>
          {cortex.filter((c) => Object.values(c).some(Boolean)).map((c, i) => (
            <Text key={i} style={[S.val, { marginBottom: 1 }]}>
              {[c.name, c.relationship, c.department, c.position].filter(Boolean).join('  |  ')}
            </Text>
          ))}
        </WideCell>
      )}
    </View>
  );
}

function RefBlock({ label, r }) {
  if (!r || !Object.values(r).some(Boolean)) return null;
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={S.subHead}>{label}</Text>
      <View style={S.row}>
        <Cell label="Name"         value={r.name}         flex={2} />
        <Cell label="Relationship" value={r.relationship} noLeft />
        <Cell label="Phone"        value={r.phone}        noLeft />
      </View>
      <View style={S.row}>
        <Cell label="Department" value={r.department} noTop />
        <Cell label="Position"   value={r.position}   noLeft noTop />
        <Cell label="Company"    value={r.company} flex={2} noLeft noTop />
      </View>
    </View>
  );
}

function RefereesSection({ d }) {
  return (
    <View style={S.section}>
      <SectionStart title="H.  CHARACTER REFEREES">
        <RefBlock label="Referee 1" r={d.referee_1} />
      </SectionStart>
      <RefBlock label="Referee 2" r={d.referee_2} />
      <View style={S.row}>
        <Cell label="May we contact your present employer?"  value={d.contact_present_employer  ? 'Yes' : 'No'} />
        <Cell label="May we contact your previous employer?" value={d.contact_previous_employer ? 'Yes' : 'No'} noLeft />
      </View>
    </View>
  );
}

function EmergencySection({ d }) {
  const ec = d.emergency_contact || {};
  return (
    <View style={S.section}>
      <SectionStart title="I.  EMERGENCY CONTACT">
        <View style={S.row}>
          <Cell label="Name"         value={ec.name}         flex={2} />
          <Cell label="Relationship" value={ec.relationship} noLeft />
          <Cell label="Phone"        value={ec.phone}        noLeft />
        </View>
      </SectionStart>
    </View>
  );
}

function DeclarationSection({ d }) {
  return (
    <View style={S.section}>
      <SectionStart title="J.  DECLARATION">
        <WideCell>
          <Text style={[S.val, { lineHeight: 1.6, marginBottom: 8 }]}>
            I declare that the information given in this application is true and correct to the best of
            my knowledge and belief. I understand that any false statement or omission of facts on my
            part will be sufficient reason for rejection of my application or for dismissal if I have
            been employed.
          </Text>
          <View style={S.row}>
            <Cell label="Name" value={d.declaration_name || d.full_name} flex={2} />
            <Cell label="Date" value={d.declaration_date || (d.submitted_at ? d.submitted_at.slice(0, 10) : '')} noLeft />
          </View>
          <View style={[S.wide, S.wideNoTop, { height: 30 }]}>
            <Text style={S.lbl}>Signature</Text>
          </View>
        </WideCell>
      </SectionStart>
    </View>
  );
}

// ── Document ─────────────────────────────────────────────────────────────────

export default function ApplicationPdfDocument({ data: d }) {
  return (
    <Document
      title={`${d.full_name || 'Applicant'} — Employment Application`}
      author="Cortex Robotics"
    >
      <Page size="A4" style={S.page}>
        <Header d={d} />
        <PersonalSection    d={d} />
        <EducationSection   d={d} />
        <TrainingSection    d={d} />
        <LanguageSection    d={d} />
        <FamilySection      d={d} />
        <EmploymentSection  d={d} />
        <GeneralSection     d={d} />
        <RefereesSection    d={d} />
        <EmergencySection   d={d} />
        <DeclarationSection d={d} />
      </Page>
    </Document>
  );
}
