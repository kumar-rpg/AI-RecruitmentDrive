import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8, padding: 30, color: '#000' },
  // Header
  headerBox: { borderWidth: 1, borderColor: '#000', marginBottom: 6, padding: 6, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', flex: 1 },
  headerSub: { fontSize: 7, color: '#444', marginTop: 2 },
  // Section heading
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, backgroundColor: '#e0e0e0', padding: '3 5', marginBottom: 0 },
  // Grid / table helpers
  row: { flexDirection: 'row' },
  cell: { borderWidth: 1, borderColor: '#000', padding: '2 4', flex: 1 },
  cellNoBorderTop: { borderTopWidth: 0 },
  cellNoBorderLeft: { borderLeftWidth: 0 },
  label: { fontFamily: 'Helvetica-Bold', fontSize: 7, marginBottom: 1 },
  value: { fontSize: 8, minHeight: 10 },
  // Thin top border (continuation rows)
  thinTop: { borderTopWidth: 0.5, borderTopColor: '#aaa' },
  // Full-width bordered block
  block: { borderWidth: 1, borderColor: '#000', padding: '2 4', marginBottom: 0 },
  blockNoBorderTop: { borderWidth: 1, borderColor: '#000', borderTopWidth: 0, padding: '2 4' },
  // Checkbox
  checkRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  checkItem: { flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 2 },
  checkBox: { width: 8, height: 8, borderWidth: 1, borderColor: '#000', marginRight: 3 },
  checkBoxFilled: { width: 8, height: 8, borderWidth: 1, borderColor: '#000', marginRight: 3, backgroundColor: '#000' },
  // Spacer
  mb2: { marginBottom: 2 },
  mb4: { marginBottom: 4 },
  mb6: { marginBottom: 6 },
});

// ---------- Helpers ----------

function val(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

function LabelCell({ label, value, flex, noBorderLeft, noBorderTop }) {
  const style = [S.cell];
  if (noBorderLeft) style.push(S.cellNoBorderLeft);
  if (noBorderTop) style.push(S.cellNoBorderTop);
  if (flex) style.push({ flex });
  return (
    <View style={style}>
      <Text style={S.label}>{label}</Text>
      <Text style={S.value}>{val(value)}</Text>
    </View>
  );
}

function SectionTitle({ children }) {
  return <Text style={[S.sectionTitle, S.mb2]}>{children}</Text>;
}

function TableHeader({ cols }) {
  return (
    <View style={S.row}>
      {cols.map((c, i) => (
        <View key={i} style={[S.cell, i > 0 && S.cellNoBorderLeft, { flex: c.flex || 1 }]}>
          <Text style={[S.label, { fontSize: 7 }]}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

function TableRow({ cols, data, noBorderTop }) {
  return (
    <View style={S.row}>
      {cols.map((c, i) => (
        <View key={i} style={[S.cell, i > 0 && S.cellNoBorderLeft, noBorderTop && S.cellNoBorderTop, { flex: c.flex || 1 }]}>
          <Text style={S.value}>{val(data[c.key])}</Text>
        </View>
      ))}
    </View>
  );
}

function CheckBox({ checked }) {
  return <View style={checked ? S.checkBoxFilled : S.checkBox} />;
}

function CheckItem({ label, checked }) {
  return (
    <View style={S.checkItem}>
      <CheckBox checked={checked} />
      <Text>{label}</Text>
    </View>
  );
}

// ---------- Sections ----------

function Header({ d }) {
  return (
    <View style={S.headerBox}>
      <View style={{ flex: 1 }}>
        <Text style={S.headerTitle}>CORTEX ROBOTICS SDN BHD</Text>
        <Text style={[S.headerSub, { fontFamily: 'Helvetica-Bold', fontSize: 10, marginTop: 2 }]}>EMPLOYMENT APPLICATION FORM</Text>
        <Text style={S.headerSub}>Position Applied: {val(d.position_applied)}     Date: {val(d.submitted_at ? d.submitted_at.slice(0, 10) : '')}</Text>
      </View>
    </View>
  );
}

function PersonalSection({ d }) {
  const licenses = Array.isArray(d.driving_license) ? d.driving_license : [];
  return (
    <View style={S.mb4}>
      <SectionTitle>A. PERSONAL PARTICULARS</SectionTitle>
      <View style={S.row}>
        <LabelCell label="Full Name (as per IC / Passport)" value={d.full_name} flex={3} />
        <LabelCell label="IC / Passport No." value={d.ic_or_passport} flex={2} noBorderLeft />
      </View>
      <View style={S.row}>
        <LabelCell label="Gender" value={d.gender} noBorderTop />
        <LabelCell label="Age" value={d.age} noBorderLeft noBorderTop />
        <LabelCell label="Date of Birth" value={d.date_of_birth} noBorderLeft noBorderTop />
        <LabelCell label="Nationality" value={d.nationality} noBorderLeft noBorderTop />
        <LabelCell label="Race" value={d.race} noBorderLeft noBorderTop />
        <LabelCell label="Religion" value={d.religion} noBorderLeft noBorderTop />
      </View>
      <View style={S.row}>
        <LabelCell label="Phone (Home)" value={d.phone_home} noBorderTop />
        <LabelCell label="Phone (Mobile)" value={d.phone_mobile} noBorderLeft noBorderTop />
        <LabelCell label="Email" value={d.email} flex={2} noBorderLeft noBorderTop />
        <LabelCell label="Marital Status" value={d.marital_status} noBorderLeft noBorderTop />
      </View>
      <View style={[S.cell, S.cellNoBorderTop]}>
        <Text style={S.label}>Residential Address</Text>
        <Text style={S.value}>{val(d.residential_address)}</Text>
      </View>
      <View style={S.row}>
        <LabelCell label="State" value={d.state} noBorderTop />
        <LabelCell label="Country" value={d.country === 'Other' ? d.country_other : d.country} noBorderLeft noBorderTop />
      </View>
      <View style={[S.cell, S.cellNoBorderTop]}>
        <Text style={S.label}>Driving License(s)</Text>
        <View style={S.checkRow}>
          {['A', 'B2', 'B', 'C', 'D', 'DA'].map((lic) => (
            <CheckItem key={lic} label={lic} checked={licenses.includes(lic)} />
          ))}
          {licenses.length === 0 && <Text style={S.value}>None</Text>}
        </View>
      </View>
    </View>
  );
}

function EducationSection({ d }) {
  const edu = d.education || [];
  const levels = ['Primary', 'Secondary', 'University / College', 'Others'];
  const cols = [
    { label: 'Level', key: 'type', flex: 1.2 },
    { label: 'School / Institution', key: 'school', flex: 2 },
    { label: 'Qualification', key: 'qualification', flex: 2 },
    { label: 'Year', key: 'year', flex: 0.8 },
  ];
  return (
    <View style={S.mb4}>
      <SectionTitle>B. EDUCATIONAL BACKGROUND</SectionTitle>
      <TableHeader cols={cols} />
      {levels.map((lvl, i) => {
        const row = edu.find((e) => e.type === lvl) || {};
        return <TableRow key={i} cols={cols} data={{ ...row, type: lvl }} noBorderTop />;
      })}
    </View>
  );
}

function TrainingSection({ d }) {
  const training = d.professional_training || [];
  const cols = [
    { label: 'Course', key: 'course', flex: 2 },
    { label: 'Institution', key: 'institution', flex: 2 },
    { label: 'Qualification', key: 'qualification', flex: 1.5 },
    { label: 'Year', key: 'year', flex: 0.8 },
  ];
  const rows = Array.from({ length: 5 }, (_, i) => training[i] || {});
  return (
    <View style={S.mb4}>
      <SectionTitle>C. PROFESSIONAL TRAINING</SectionTitle>
      <TableHeader cols={cols} />
      {rows.map((row, i) => <TableRow key={i} cols={cols} data={row} noBorderTop />)}
    </View>
  );
}

function LanguageSection({ d }) {
  const lang = d.languages || {};
  const langs = [
    { label: 'English', key: 'english' },
    { label: 'Bahasa Malaysia', key: 'bahasa_malaysia' },
    { label: 'Chinese', key: 'chinese' },
    { label: `Others${lang.others?.name ? ` (${lang.others.name})` : ''}`, key: 'others' },
  ];
  return (
    <View style={S.mb4}>
      <SectionTitle>D. LANGUAGE PROFICIENCY (0 = None, 10 = Excellent)</SectionTitle>
      <View style={S.row}>
        <View style={[S.cell, { flex: 1.5 }]}><Text style={S.label}>Language</Text></View>
        <View style={[S.cell, S.cellNoBorderLeft]}><Text style={S.label}>Speaking</Text></View>
        <View style={[S.cell, S.cellNoBorderLeft]}><Text style={S.label}>Reading</Text></View>
        <View style={[S.cell, S.cellNoBorderLeft]}><Text style={S.label}>Writing</Text></View>
      </View>
      {langs.map((l, i) => {
        const data = lang[l.key] || {};
        return (
          <View key={i} style={S.row}>
            <View style={[S.cell, S.cellNoBorderTop, { flex: 1.5 }]}><Text style={S.value}>{l.label}</Text></View>
            <View style={[S.cell, S.cellNoBorderTop, S.cellNoBorderLeft]}><Text style={S.value}>{val(data.speaking)}</Text></View>
            <View style={[S.cell, S.cellNoBorderTop, S.cellNoBorderLeft]}><Text style={S.value}>{val(data.reading)}</Text></View>
            <View style={[S.cell, S.cellNoBorderTop, S.cellNoBorderLeft]}><Text style={S.value}>{val(data.writing)}</Text></View>
          </View>
        );
      })}
    </View>
  );
}

function FamilySection({ d }) {
  const members = d.family_members || [];
  const cols = [
    { label: 'Name', key: 'name', flex: 2 },
    { label: 'Relationship', key: 'relationship', flex: 1.2 },
    { label: 'Age', key: 'age', flex: 0.6 },
    { label: 'Employer', key: 'employer', flex: 2 },
  ];
  const rows = Array.from({ length: 5 }, (_, i) => members[i] || {});
  return (
    <View style={S.mb4}>
      <SectionTitle>E. FAMILY BACKGROUND</SectionTitle>
      <TableHeader cols={cols} />
      {rows.map((row, i) => <TableRow key={i} cols={cols} data={row} noBorderTop />)}
    </View>
  );
}

function EmploymentBlock({ label, emp }) {
  if (!emp) return null;
  return (
    <View style={S.mb4}>
      <Text style={[S.label, { marginBottom: 2 }]}>{label}</Text>
      <View style={S.row}>
        <LabelCell label="Company" value={emp.company} flex={2} />
        <LabelCell label="Tel" value={emp.tel} noBorderLeft />
        <LabelCell label="Business Type" value={emp.business_type} noBorderLeft />
      </View>
      <View style={S.row}>
        <LabelCell label="Position" value={emp.position} noBorderTop />
        <LabelCell label="Department" value={emp.department} noBorderLeft noBorderTop />
        <LabelCell label="From" value={emp.from_date} noBorderLeft noBorderTop />
        <LabelCell label="To" value={emp.to_date} noBorderLeft noBorderTop />
      </View>
      <View style={S.row}>
        <LabelCell label="Starting Salary (RM)" value={emp.salary_start} noBorderTop />
        <LabelCell label="Current Salary (RM)" value={emp.salary_current} noBorderLeft noBorderTop />
        <LabelCell label="Benefits" value={emp.benefits} flex={2} noBorderLeft noBorderTop />
      </View>
      <View style={[S.cell, S.cellNoBorderTop]}>
        <Text style={S.label}>Reason for Leaving</Text>
        <Text style={S.value}>{val(emp.reason_for_leaving)}</Text>
      </View>
    </View>
  );
}

function EmploymentSection({ d }) {
  const prev = d.previous_employment || [];
  return (
    <View style={S.mb4}>
      <SectionTitle>F. EMPLOYMENT HISTORY</SectionTitle>
      <EmploymentBlock label="Current / Most Recent Employment" emp={d.current_employment} />
      {prev.map((p, i) => <EmploymentBlock key={i} label={`Previous Employment ${i + 1}`} emp={p} />)}
    </View>
  );
}

function GeneralSection({ d }) {
  const sources = d.vacancy_source || [];
  const sourceOptions = [
    { key: 'newspaper', label: 'Newspaper' },
    { key: 'internet', label: 'Internet' },
    { key: 'employee_referral', label: 'Employee Referral' },
    { key: 'recruitment_agency', label: 'Recruitment Agency' },
    { key: 'walk_in', label: 'Walk-in' },
    { key: 'others', label: 'Others' },
  ];
  const cortex = d.cortex_connections || [];
  const cortexCols = [
    { label: 'Name', key: 'name', flex: 2 },
    { label: 'Relationship', key: 'relationship', flex: 1.2 },
    { label: 'Department', key: 'department', flex: 1.5 },
    { label: 'Position', key: 'position', flex: 1.5 },
  ];
  const cortexRows = Array.from({ length: 3 }, (_, i) => cortex[i] || {});
  return (
    <View style={S.mb4}>
      <SectionTitle>G. GENERAL INFORMATION</SectionTitle>
      <View style={S.row}>
        <LabelCell label="Expected Salary (RM)" value={d.expected_salary} />
        <LabelCell label="Notice Period (months)" value={d.notice_period_months} noBorderLeft />
        <LabelCell label="Expected Join Date" value={d.expected_join_date} noBorderLeft />
      </View>
      <View style={[S.cell, S.cellNoBorderTop]}>
        <Text style={S.label}>How did you hear about this vacancy?</Text>
        <View style={S.checkRow}>
          {sourceOptions.map((s) => <CheckItem key={s.key} label={s.label} checked={sources.includes(s.key)} />)}
        </View>
        {sources.includes('employee_referral') && d.vacancy_source_employee_name && (
          <Text style={S.value}>Referred by: {d.vacancy_source_employee_name}</Text>
        )}
        {sources.includes('recruitment_agency') && d.vacancy_source_agency && (
          <Text style={S.value}>Agency: {d.vacancy_source_agency}</Text>
        )}
      </View>
      <View style={S.row}>
        <LabelCell label="Criminal Conviction?" value={d.criminal_conviction ? 'Yes' : 'No'} noBorderTop />
        {d.criminal_conviction && <LabelCell label="Details" value={d.criminal_conviction_details} noBorderLeft noBorderTop flex={3} />}
      </View>
      <View style={S.row}>
        <LabelCell label="Health Condition?" value={d.health_condition === 'yes' ? 'Yes' : 'No'} noBorderTop />
        {d.health_condition === 'yes' && <LabelCell label="Details" value={d.health_condition_details} noBorderLeft noBorderTop flex={3} />}
      </View>
      {d.is_pregnant !== null && d.is_pregnant !== undefined && (
        <View style={S.row}>
          <LabelCell label="Currently Pregnant?" value={d.is_pregnant ? 'Yes' : 'No'} noBorderTop />
          {d.is_pregnant && <LabelCell label="Due Date" value={d.pregnancy_due_date} noBorderLeft noBorderTop />}
        </View>
      )}
      {cortex.length > 0 && (
        <View style={S.mb2}>
          <Text style={[S.label, { marginTop: 4 }]}>Known connections at Cortex Robotics:</Text>
          <TableHeader cols={cortexCols} />
          {cortexRows.map((row, i) => <TableRow key={i} cols={cortexCols} data={row} noBorderTop />)}
        </View>
      )}
    </View>
  );
}

function RefereesSection({ d }) {
  function RefereeBlock({ label, ref: r }) {
    if (!r) return null;
    return (
      <View style={S.mb2}>
        <Text style={[S.label, { marginBottom: 2 }]}>{label}</Text>
        <View style={S.row}>
          <LabelCell label="Name" value={r.name} flex={2} />
          <LabelCell label="Relationship" value={r.relationship} noBorderLeft />
          <LabelCell label="Phone" value={r.phone} noBorderLeft />
        </View>
        <View style={S.row}>
          <LabelCell label="Department" value={r.department} noBorderTop />
          <LabelCell label="Position" value={r.position} noBorderLeft noBorderTop />
          <LabelCell label="Company" value={r.company} flex={2} noBorderLeft noBorderTop />
        </View>
      </View>
    );
  }
  return (
    <View style={S.mb4}>
      <SectionTitle>H. CHARACTER REFEREES</SectionTitle>
      <RefereeBlock label="Referee 1" ref={d.referee_1} />
      <RefereeBlock label="Referee 2" ref={d.referee_2} />
      <View style={S.row}>
        <View style={[S.cell, { flex: 1 }]}>
          <Text style={S.label}>May we contact your present employer?</Text>
          <Text style={S.value}>{d.contact_present_employer ? 'Yes' : 'No'}</Text>
        </View>
        <View style={[S.cell, S.cellNoBorderLeft, { flex: 1 }]}>
          <Text style={S.label}>May we contact your previous employer?</Text>
          <Text style={S.value}>{d.contact_previous_employer ? 'Yes' : 'No'}</Text>
        </View>
      </View>
    </View>
  );
}

function EmergencySection({ d }) {
  const ec = d.emergency_contact || {};
  return (
    <View style={S.mb4}>
      <SectionTitle>I. EMERGENCY CONTACT</SectionTitle>
      <View style={S.row}>
        <LabelCell label="Name" value={ec.name} flex={2} />
        <LabelCell label="Relationship" value={ec.relationship} noBorderLeft />
        <LabelCell label="Phone" value={ec.phone} noBorderLeft />
      </View>
    </View>
  );
}

function DeclarationSection({ d }) {
  return (
    <View style={S.mb4}>
      <SectionTitle>J. DECLARATION</SectionTitle>
      <View style={[S.cell]}>
        <Text style={[S.value, { lineHeight: 1.5, marginBottom: 6 }]}>
          I declare that the information given in this application is true and correct to the best of my knowledge and belief.
          I understand that any false statement or omission of facts on my part will be sufficient reason for rejection of my
          application or for dismissal if I have been employed.
        </Text>
        <View style={S.row}>
          <LabelCell label="Name" value={d.declaration_name || d.full_name} flex={2} />
          <LabelCell label="Date" value={d.declaration_date || (d.submitted_at ? d.submitted_at.slice(0, 10) : '')} noBorderLeft />
        </View>
        <View style={[S.cell, S.cellNoBorderTop, { height: 30 }]}>
          <Text style={S.label}>Signature</Text>
        </View>
      </View>
    </View>
  );
}

// ---------- Main Document ----------

export default function ApplicationPdfDocument({ data: d }) {
  return (
    <Document title={`${d.full_name || 'Applicant'} — Employment Application`} author="Cortex Robotics">
      {/* Page 1: Header + Personal */}
      <Page size="A4" style={S.page}>
        <Header d={d} />
        <PersonalSection d={d} />
      </Page>

      {/* Page 2: Education + Training + Language + Family */}
      <Page size="A4" style={S.page}>
        <EducationSection d={d} />
        <TrainingSection d={d} />
        <LanguageSection d={d} />
        <FamilySection d={d} />
      </Page>

      {/* Page 3: Employment History */}
      <Page size="A4" style={S.page}>
        <EmploymentSection d={d} />
      </Page>

      {/* Page 4: General + Referees + Emergency + Declaration */}
      <Page size="A4" style={S.page}>
        <GeneralSection d={d} />
        <RefereesSection d={d} />
        <EmergencySection d={d} />
        <DeclarationSection d={d} />
      </Page>
    </Document>
  );
}
