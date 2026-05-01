const STORAGE_KEY = "aq-attendance-demo-v2";
const SESSION_KEY = "aq-attendance-demo-session-v2";
const ADMIN_SESSION_KEY = "aq-attendance-demo-admin-v1";
const DEFAULT_ADMIN_PIN = "admin";
const CALENDAR_YEAR_RANGE = 5;
const AVERAGE_DRAFT_START = "2026-05-04";
const AVERAGE_DRAFT_WEEKS = 4;
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const STATUS_OPTIONS = [
  { value: "present", label: "Present", countsAsAttendance: true, noteLabel: "" },
  { value: "late", label: "Late", countsAsAttendance: true, noteLabel: "" },
  { value: "absent", label: "Absent", countsAsAttendance: false, noteLabel: "Absence note" },
  { value: "leave", label: "Leave", countsAsAttendance: false, noteLabel: "Leave note" }
];
const STATUS_LOOKUP = Object.fromEntries(STATUS_OPTIONS.map((option) => [option.value, option]));
const AVERAGE_DRAFT_DATES = buildAverageDraftDates();

const STUDENT_NAMES = [
  "Nusrat Jahan Ripa",
  "Sophia Sestuso Veran",
  "David Haitham Al-Shadfan",
  "Athul Antony",
  "Muhammad Usman Malik",
  "Sabulao John Benedict",
  "Joshua Samuel",
  "Faiz Abdul Razak",
  "Gian Melchor Albaran Gella",
  "Soofia Sheik Sakhabuth",
  "Stephanie Lauren Avenion Laylo",
  "Sasindu Amash Abeysinghe",
  "Aschton James Macatangay",
  "Showkat Ahmed",
  "Kylie Noelle B. Andal",
  "Bencel Ermitanio Sajulga",
  "Leonarda Allan Rosales",
  "Benidict Sajulga",
  "Miguel Melendez Cendreda",
  "Angelo Jan Villarama Cruz",
  "Ayeen Limoodehi",
  "Mohammed Zazi"
];

const seedData = {
  settings: {
    adminPin: DEFAULT_ADMIN_PIN
  },
  tutors: [
    {
      id: "eee",
      pin: "password",
      name: "Akbar Qamar",
      title: "Tutor · Units 4020, 4001 and 4015",
      classIds: ["unit-4020", "unit-4001", "unit-4015"]
    }
  ],
  classes: [
    {
      id: "unit-4020",
      name: "Unit 4020",
      room: "Tuesday register",
      schedule: "Tuesday",
      tutorId: "eee",
      students: createStudents("4020")
    },
    {
      id: "unit-4001",
      name: "Unit 4001",
      room: "Wednesday register",
      schedule: "Wednesday",
      tutorId: "eee",
      students: createStudents("4001")
    },
    {
      id: "unit-4015",
      name: "Unit 4015",
      room: "Thursday register",
      schedule: "Thursday",
      tutorId: "eee",
      students: createStudents("4015")
    }
  ],
  attendance: {},
  activity: [],
  lastSavedAt: null
};

const state = {
  data: loadData(),
  currentTutorId: loadSessionTutorId(),
  isAdminUnlocked: loadSessionAdminUnlocked(),
  selectedClassId: null,
  selectedAdminClassId: null,
  selectedDateKey: getInitialSelectedDateKey(),
  visibleMonthKey: getMonthKey(getInitialSelectedDateKey()),
  showAverages: true
};

const loginPanel = document.getElementById("loginPanel");
const appPanel = document.getElementById("appPanel");
const adminPanel = document.getElementById("adminPanel");
const loginForm = document.getElementById("loginForm");
const adminAccessForm = document.getElementById("adminAccessForm");
const loginMessage = document.getElementById("loginMessage");
const adminAccessMessage = document.getElementById("adminAccessMessage");
const accountGrid = document.getElementById("accountGrid");
const classList = document.getElementById("classList");
const attendanceTable = document.getElementById("attendanceTable");
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const calendarPrevButton = document.getElementById("calendarPrevButton");
const calendarNextButton = document.getElementById("calendarNextButton");
const attendanceDateInput = document.getElementById("attendanceDateInput");
const showAverageToggle = document.getElementById("showAverageToggle");
const selectedClassTitle = document.getElementById("selectedClassTitle");
const selectedClassMeta = document.getElementById("selectedClassMeta");
const activityLog = document.getElementById("activityLog");
const toast = document.getElementById("toast");

const metricClasses = document.getElementById("metricClasses");
const metricMarked = document.getElementById("metricMarked");
const metricAverage = document.getElementById("metricAverage");
const metricStored = document.getElementById("metricStored");
const heroSummary = document.getElementById("heroSummary");
const welcomeHeading = document.getElementById("welcomeHeading");
const lastSavedLabel = document.getElementById("lastSavedLabel");
const todayLabel = document.getElementById("todayLabel");

const adminHeading = document.getElementById("adminHeading");
const adminSummary = document.getElementById("adminSummary");
const adminMetricTutors = document.getElementById("adminMetricTutors");
const adminMetricUnits = document.getElementById("adminMetricUnits");
const adminMetricStudents = document.getElementById("adminMetricStudents");
const adminMetricUnassigned = document.getElementById("adminMetricUnassigned");
const adminTutorList = document.getElementById("adminTutorList");
const adminUnitList = document.getElementById("adminUnitList");
const adminStudentList = document.getElementById("adminStudentList");
const adminStudentUnitSelect = document.getElementById("adminStudentUnitSelect");
const createUnitTutorId = document.getElementById("createUnitTutorId");
const createTutorForm = document.getElementById("createTutorForm");
const createUnitForm = document.getElementById("createUnitForm");
const createStudentForm = document.getElementById("createStudentForm");
const adminPasswordForm = document.getElementById("adminPasswordForm");
const createTutorMessage = document.getElementById("createTutorMessage");
const createUnitMessage = document.getElementById("createUnitMessage");
const createStudentMessage = document.getElementById("createStudentMessage");
const adminPasswordMessage = document.getElementById("adminPasswordMessage");

const tutorImportInput = document.getElementById("importInput");
const adminImportInput = document.getElementById("adminImportInput");

document.getElementById("exportCsvButton").addEventListener("click", exportCsvBackup);
document.getElementById("exportButton").addEventListener("click", exportData);
tutorImportInput.addEventListener("change", importData);
document.getElementById("resetButton").addEventListener("click", resetData);
document.getElementById("logoutButton").addEventListener("click", logout);
document.getElementById("adminExportCsvButton").addEventListener("click", exportCsvBackup);
document.getElementById("adminExportButton").addEventListener("click", exportData);
adminImportInput.addEventListener("change", importData);
document.getElementById("adminResetButton").addEventListener("click", resetData);
document.getElementById("adminLogoutButton").addEventListener("click", logoutAdmin);
loginForm.addEventListener("submit", handleLogin);
adminAccessForm.addEventListener("submit", handleAdminUnlock);
attendanceDateInput.addEventListener("input", handleDateSelection);
showAverageToggle.addEventListener("change", handleAverageToggle);
calendarPrevButton.addEventListener("click", () => changeVisibleMonth(-1));
calendarNextButton.addEventListener("click", () => changeVisibleMonth(1));
createTutorForm.addEventListener("submit", handleCreateTutor);
createUnitForm.addEventListener("submit", handleCreateUnit);
createStudentForm.addEventListener("submit", handleCreateStudent);
adminPasswordForm.addEventListener("submit", handleAdminPasswordUpdate);
adminStudentUnitSelect.addEventListener("change", handleAdminUnitSelection);

renderAccountGrid();
renderApp();

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = structuredClone(seedData);
      syncDataRelationships(seeded);
      return seeded;
    }

    const parsed = JSON.parse(raw);
    return hydrateData(parsed);
  } catch (error) {
    console.error("Failed to load stored demo data", error);
    const seeded = structuredClone(seedData);
    syncDataRelationships(seeded);
    return seeded;
  }
}

function hydrateData(parsed) {
  const data = {
    settings: normalizeSettings(parsed?.settings),
    tutors: normalizeTutors(parsed?.tutors),
    classes: normalizeClasses(parsed?.classes),
    attendance: normalizeAttendance(parsed?.attendance),
    activity: Array.isArray(parsed?.activity) ? parsed.activity.slice(0, 12) : [],
    lastSavedAt: parsed?.lastSavedAt || null
  };

  syncDataRelationships(data);
  return data;
}

function normalizeSettings(settings) {
  return {
    adminPin: typeof settings?.adminPin === "string" && settings.adminPin.trim() ? settings.adminPin : DEFAULT_ADMIN_PIN
  };
}

function normalizeTutors(tutors) {
  const source = Array.isArray(tutors) ? tutors : seedData.tutors;
  return source.map((tutor, index) => ({
    id: slugifyId(tutor?.id || `tutor-${index + 1}`),
    pin: String(tutor?.pin || "password"),
    name: String(tutor?.name || `Tutor ${index + 1}`),
    title: String(tutor?.title || "Tutor"),
    classIds: []
  }));
}

function normalizeClasses(classes) {
  const source = Array.isArray(classes) ? classes : seedData.classes;
  return source.map((course, courseIndex) => ({
    id: slugifyId(course?.id || `unit-${courseIndex + 1}`),
    name: String(course?.name || `Unit ${courseIndex + 1}`),
    room: String(course?.room || "Room not set"),
    schedule: normalizeSchedule(course?.schedule),
    tutorId: course?.tutorId ? slugifyId(course.tutorId) : "",
    students: normalizeStudents(course?.students, course?.name || `Unit ${courseIndex + 1}`)
  }));
}

function normalizeStudents(students, courseName) {
  const source = Array.isArray(students) ? students : [];
  return source.map((student, studentIndex) => ({
    id: String(student?.id || `${slugifyId(courseName || "unit")}-${String(studentIndex + 1).padStart(2, "0")}`),
    name: String(student?.name || `Student ${studentIndex + 1}`),
    course: String(student?.course || courseName || "Unit")
  }));
}

function normalizeAttendance(attendance) {
  if (!attendance || typeof attendance !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(attendance).map(([classId, sessionsByDay]) => [
      classId,
      Object.fromEntries(
        Object.entries(sessionsByDay || {}).map(([dayKey, session]) => [
          dayKey,
          {
            notes: typeof session?.notes === "string" ? session.notes : "",
            updatedAt: session?.updatedAt || null,
            records: Object.fromEntries(
              Object.entries(session?.records || {}).map(([studentId, record]) => [
                studentId,
                {
                  status: normalizeStatus(record?.status),
                  updatedAt: record?.updatedAt || null,
                  note: typeof record?.note === "string" ? record.note : ""
                }
              ])
            )
          }
        ])
      )
    ])
  );
}

function normalizeStatus(status) {
  return STATUS_LOOKUP[status] ? status : "";
}

function createStudents(unitCode) {
  return STUDENT_NAMES.map((name, index) => ({
    id: `${unitCode}-${String(index + 1).padStart(2, "0")}`,
    name,
    course: `Unit ${unitCode}`
  }));
}

function saveData(reason) {
  syncDataRelationships(state.data);
  state.data.lastSavedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  lastSavedLabel.textContent = `Last local save: ${formatDateTime(state.data.lastSavedAt)}`;
  if (reason) {
    showToast(reason);
  }
}

function loadSessionTutorId() {
  return sessionStorage.getItem(SESSION_KEY);
}

function loadSessionAdminUnlocked() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function setSessionTutorId(tutorId) {
  if (tutorId) {
    sessionStorage.setItem(SESSION_KEY, tutorId);
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function setSessionAdminUnlocked(isUnlocked) {
  if (isUnlocked) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

function getTutorById(tutorId) {
  return state.data.tutors.find((tutor) => tutor.id === tutorId) || null;
}

function getClassesForTutorId(tutorId) {
  return state.data.classes.filter((course) => course.tutorId === tutorId);
}

function getAssignedClasses() {
  const tutor = getTutorById(state.currentTutorId);
  if (!tutor) {
    return [];
  }

  return getClassesForTutorId(tutor.id);
}

function getSelectedClass() {
  const classes = getAssignedClasses();
  return classes.find((course) => course.id === state.selectedClassId) || classes[0] || null;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClassSession(classId, dayKey = state.selectedDateKey) {
  const attendance = state.data.attendance[classId] || {};
  const session = attendance[dayKey] || { records: {}, notes: "", updatedAt: null };
  return { dayKey, session };
}

function ensureClassSession(classId, dayKey = state.selectedDateKey) {
  const { session } = getClassSession(classId, dayKey);
  if (!state.data.attendance[classId]) {
    state.data.attendance[classId] = {};
  }
  if (!state.data.attendance[classId][dayKey]) {
    state.data.attendance[classId][dayKey] = session;
  }
  return state.data.attendance[classId][dayKey];
}

function handleLogin(event) {
  event.preventDefault();
  const loginId = document.getElementById("loginId").value.trim().toLowerCase();
  const loginPin = document.getElementById("loginPin").value.trim();
  const tutor = state.data.tutors.find((item) => item.id === loginId && item.pin === loginPin);

  if (!tutor) {
    loginMessage.textContent = "That tutor ID and passcode combination does not match the demo accounts.";
    return;
  }

  loginMessage.textContent = "";
  state.isAdminUnlocked = false;
  setSessionAdminUnlocked(false);
  state.currentTutorId = tutor.id;
  setSessionTutorId(tutor.id);
  state.selectedClassId = getClassesForTutorId(tutor.id)[0]?.id || null;
  addActivity(`${tutor.name} opened the demo workspace.`);
  renderApp();
  showToast(`Signed in as ${tutor.name}`);
}

function handleAdminUnlock(event) {
  event.preventDefault();
  const submittedPin = document.getElementById("adminAccessPin").value.trim();
  if (submittedPin !== state.data.settings.adminPin) {
    adminAccessMessage.textContent = "That admin password is not correct for the local configuration workspace.";
    return;
  }

  adminAccessMessage.textContent = "";
  adminAccessForm.reset();
  state.currentTutorId = null;
  state.selectedClassId = null;
  setSessionTutorId(null);
  state.isAdminUnlocked = true;
  state.selectedAdminClassId = state.data.classes[0]?.id || null;
  setSessionAdminUnlocked(true);
  renderApp();
  showToast("Admin workspace unlocked");
}

function loginAsDemo(tutorId) {
  const tutor = getTutorById(tutorId);
  if (!tutor) {
    return;
  }

  document.getElementById("loginId").value = tutor.id;
  document.getElementById("loginPin").value = tutor.pin;
  state.isAdminUnlocked = false;
  setSessionAdminUnlocked(false);
  state.currentTutorId = tutor.id;
  setSessionTutorId(tutor.id);
  state.selectedClassId = getClassesForTutorId(tutor.id)[0]?.id || null;
  addActivity(`${tutor.name} opened the demo workspace via preview access.`);
  renderApp();
  showToast(`Loaded ${tutor.name}'s tutor view`);
}

function logout() {
  const tutor = getTutorById(state.currentTutorId);
  if (tutor) {
    addActivity(`${tutor.name} logged out.`);
  }
  state.currentTutorId = null;
  state.selectedClassId = null;
  setSessionTutorId(null);
  renderApp();
}

function logoutAdmin() {
  state.isAdminUnlocked = false;
  state.selectedAdminClassId = null;
  setSessionAdminUnlocked(false);
  renderApp();
}

function renderApp() {
  syncDataRelationships(state.data);
  renderAccountGrid();

  if (state.isAdminUnlocked) {
    loginPanel.classList.add("hidden");
    appPanel.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    renderAdminPanel();
    return;
  }

  const tutor = getTutorById(state.currentTutorId);
  if (!tutor) {
    loginPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
    adminPanel.classList.add("hidden");
    loginMessage.textContent = "";
    return;
  }

  loginPanel.classList.add("hidden");
  appPanel.classList.remove("hidden");
  adminPanel.classList.add("hidden");

  const assignedClasses = getAssignedClasses();
  if (!state.selectedClassId || !assignedClasses.some((course) => course.id === state.selectedClassId)) {
    state.selectedClassId = assignedClasses[0]?.id || null;
  }

  const selectedClass = getSelectedClass();
  welcomeHeading.textContent = `${tutor.name} · ${tutor.title}`;
  heroSummary.textContent = `${tutor.name} is viewing ${assignedClasses.length} tutor-scoped class${assignedClasses.length === 1 ? "" : "es"}. Data persists only on this browser profile until the backend release is connected.`;
  todayLabel.textContent = `Selected date: ${formatHumanDate(state.selectedDateKey)}`;
  attendanceDateInput.value = state.selectedDateKey;
  attendanceDateInput.min = getCalendarMinDateKey();
  attendanceDateInput.max = getCalendarMaxDateKey();
  showAverageToggle.checked = state.showAverages;

  renderMetrics(assignedClasses, selectedClass);
  renderClassTabs(assignedClasses);
  renderCalendar(selectedClass);
  renderClassDetail(selectedClass);
  renderActivity();
  lastSavedLabel.textContent = state.data.lastSavedAt ? `Last local save: ${formatDateTime(state.data.lastSavedAt)}` : "No local edits yet.";
}

function renderMetrics(assignedClasses, selectedClass) {
  metricClasses.textContent = String(assignedClasses.length);
  metricMarked.textContent = String(getMarkedCountForTutor(assignedClasses));
  metricAverage.textContent = selectedClass ? formatAverage(getClassAverage(selectedClass)) : "0%";
  metricStored.textContent = String(getStoredRecordCount());
}

function renderClassTabs(assignedClasses) {
  if (!assignedClasses.length) {
    classList.innerHTML = '<p class="subtle">No units are assigned to this tutor yet.</p>';
    return;
  }

  classList.innerHTML = "";
  assignedClasses.forEach((course) => {
    const { session } = getClassSession(course.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "class-tab";
    button.setAttribute("aria-selected", String(course.id === state.selectedClassId));
    button.innerHTML = `
      <strong>${course.name}</strong>
      <div>${course.room}</div>
      <small>${course.schedule} · ${Object.keys(session.records).length}/${course.students.length} marked on ${formatShortDate(state.selectedDateKey)}</small>
    `;
    button.addEventListener("click", () => {
      state.selectedClassId = course.id;
      renderApp();
    });
    classList.appendChild(button);
  });
}

function renderClassDetail(course) {
  if (!course) {
    selectedClassTitle.textContent = "No class assigned";
    selectedClassMeta.innerHTML = "";
    attendanceTable.innerHTML = '<p class="subtle">Assign at least one class to a tutor to render the register.</p>';
    return;
  }

  const { session } = getClassSession(course.id);
  selectedClassTitle.textContent = course.name;
  selectedClassMeta.innerHTML = `
    <span class="meta-chip">${course.room}</span>
    <span class="meta-chip">${course.schedule}</span>
    <span class="meta-chip">${formatHumanDate(state.selectedDateKey)}</span>
    <span class="meta-chip">${Object.keys(session.records).length}/${course.students.length} marked</span>
    <span class="meta-chip">Average ${formatAverage(getClassAverage(course))}</span>
  `;

  const legend = `
    <div class="attendance-legend">
      <span class="legend-chip legend-chip--present">Present</span>
      <span class="legend-chip legend-chip--late">Late</span>
      <span class="legend-chip legend-chip--absent">Absent</span>
      <span class="legend-chip legend-chip--leave">Leave</span>
    </div>
  `;

  const rows = course.students.map((student) => renderStudentRow(course.id, student, session.records[student.id])).join("");
  attendanceTable.innerHTML = `${legend}${rows}`;

  attendanceTable.querySelectorAll(".status-button").forEach((button) => {
    button.addEventListener("click", () => {
      updateAttendance(course.id, button.dataset.studentId, button.dataset.status);
    });
  });

  attendanceTable.querySelectorAll(".student-note-input").forEach((field) => {
    field.addEventListener("input", () => {
      updateStudentNote(course.id, field.dataset.studentId, field.value);
    });
  });
}

function renderStudentRow(classId, student, record) {
  const status = STATUS_LOOKUP[record?.status]?.label || "Unmarked";
  const stamp = record?.updatedAt ? formatTimeOnly(record.updatedAt) : "Awaiting mark";
  const averageMarkup = state.showAverages ? `<span class="student-row__average">4-week average ${formatAverage(getStudentAverage(getSelectedClass(), student.id))}</span>` : "";
  const statusButtons = STATUS_OPTIONS
    .map((option) => {
      const activeClass = record?.status === option.value ? "is-active" : "";
      return `<button type="button" class="status-button ${activeClass}" data-class-id="${classId}" data-student-id="${student.id}" data-status="${option.value}">${option.label}</button>`;
    })
    .join("");
  const noteEnabled = record?.status === "absent" || record?.status === "leave";
  const noteLabel = noteEnabled ? STATUS_LOOKUP[record.status].noteLabel : "Note";

  return `
    <div class="student-row">
      <div class="student-row__identity">
        <strong>${student.name}</strong>
        <span class="student-row__course">${student.course}</span>
        ${averageMarkup}
      </div>
      <div class="student-row__status">
        <strong>${status}</strong><br>
        <span>${stamp}</span>
      </div>
      <div class="student-row__actions">${statusButtons}</div>
      <label class="student-row__note">
        <span>${noteLabel}</span>
        <textarea class="student-note-input" data-student-id="${student.id}" rows="3" placeholder="Add context for absence or leave" ${noteEnabled ? "" : "disabled"}>${escapeHtml(record?.note || "")}</textarea>
      </label>
    </div>
  `;
}

function updateAttendance(classId, studentId, status) {
  const course = state.data.classes.find((item) => item.id === classId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student) {
    return;
  }

  const session = ensureClassSession(classId);
  const existingRecord = session.records[studentId] || { note: "" };
  session.records[studentId] = {
    status,
    updatedAt: new Date().toISOString(),
    note: status === "absent" || status === "leave" ? existingRecord.note || "" : ""
  };
  session.updatedAt = new Date().toISOString();
  addActivity(`${student.name} marked ${status} in ${course.name} for ${formatShortDate(state.selectedDateKey)}.`);
  saveData(`${student.name} marked ${status}`);
  renderApp();
}

function updateStudentNote(classId, studentId, note) {
  const course = state.data.classes.find((item) => item.id === classId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student) {
    return;
  }

  const session = ensureClassSession(classId);
  const existingRecord = session.records[studentId];
  if (!existingRecord || (existingRecord.status !== "absent" && existingRecord.status !== "leave")) {
    return;
  }

  session.records[studentId] = {
    ...existingRecord,
    note,
    updatedAt: new Date().toISOString()
  };
  session.updatedAt = new Date().toISOString();
  saveData();
}

function handleDateSelection(event) {
  const nextDate = clampDateKey(event.target.value || getTodayKey());
  state.selectedDateKey = nextDate;
  state.visibleMonthKey = getMonthKey(nextDate);
  renderApp();
}

function handleAverageToggle(event) {
  state.showAverages = event.target.checked;
  renderApp();
}

function changeVisibleMonth(offset) {
  state.visibleMonthKey = shiftMonthKey(state.visibleMonthKey, offset);
  renderApp();
}

function renderCalendar(course) {
  const monthKey = state.visibleMonthKey;
  const calendarCells = buildCalendarCells(monthKey);
  calendarMonthLabel.textContent = formatMonthLabel(monthKey);
  calendarPrevButton.disabled = monthKey <= getCalendarMinMonthKey();
  calendarNextButton.disabled = monthKey >= getCalendarMaxMonthKey();

  calendarGrid.innerHTML = calendarCells
    .map((cell) => {
      if (!cell.dayKey) {
        return '<div class="calendar-day is-empty" aria-hidden="true"></div>';
      }

      const isSelected = cell.dayKey === state.selectedDateKey;
      const isScheduled = course ? isCourseScheduledOnDate(course, cell.dayKey) : false;
      const classes = ["calendar-day"];
      if (isSelected) {
        classes.push("is-selected");
      }
      if (isScheduled) {
        classes.push("is-scheduled");
      }
      if (cell.isOutOfRange) {
        classes.push("is-out-of-range");
      }

      return `
        <button type="button" class="${classes.join(" ")}" data-calendar-date="${cell.dayKey}" ${cell.isOutOfRange ? "disabled" : ""}>
          <span class="calendar-day__number">${getDayOfMonth(cell.dayKey)}</span>
          <span class="calendar-day__label">${formatWeekday(cell.dayKey)}</span>
        </button>
      `;
    })
    .join("");

  calendarGrid.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDateKey = button.dataset.calendarDate;
      state.visibleMonthKey = getMonthKey(state.selectedDateKey);
      renderApp();
    });
  });
}

function getStudentAverage(course, studentId) {
  if (!course) {
    return null;
  }

  const scheduledDates = getScheduledCalendarDates(course);
  let attended = 0;
  let marked = 0;

  scheduledDates.forEach((dayKey) => {
    const record = state.data.attendance[course.id]?.[dayKey]?.records?.[studentId];
    if (!record?.status || record.status === "leave") {
      return;
    }

    marked += 1;
    if (STATUS_LOOKUP[record.status]?.countsAsAttendance) {
      attended += 1;
    }
  });

  if (!marked) {
    return null;
  }

  return attended / marked;
}

function getClassAverage(course) {
  if (!course) {
    return null;
  }

  const averages = course.students
    .map((student) => getStudentAverage(course, student.id))
    .filter((value) => typeof value === "number");

  if (!averages.length) {
    return null;
  }

  return averages.reduce((sum, value) => sum + value, 0) / averages.length;
}

function addActivity(message) {
  state.data.activity.unshift({
    message,
    timestamp: new Date().toISOString()
  });
  state.data.activity = state.data.activity.slice(0, 10);
  saveData();
}

function renderActivity() {
  if (!state.data.activity.length) {
    activityLog.innerHTML = "<li>No tutor actions logged yet.</li>";
    return;
  }

  activityLog.innerHTML = state.data.activity
    .map((item) => `<li><strong>${formatTimeOnly(item.timestamp)}</strong><br>${item.message}</li>`)
    .join("");
}

function renderAccountGrid() {
  if (!state.data.tutors.length) {
    accountGrid.innerHTML = '<div class="admin-empty">No tutor accounts exist yet. Use the admin studio to create the first local login.</div>';
    return;
  }

  accountGrid.innerHTML = state.data.tutors
    .map(
      (tutor) => `
        <article class="account-card">
          <header>
            <div>
              <strong>${tutor.name}</strong>
              <small>${tutor.title}</small>
            </div>
            <span class="pill">${getClassesForTutorId(tutor.id).length} class${getClassesForTutorId(tutor.id).length === 1 ? "" : "es"}</span>
          </header>
          <div>Tutor ID: ${tutor.id}</div>
          <div>Passcode: ${tutor.pin}</div>
          <button type="button" class="button button--ghost" data-demo-login="${tutor.id}">Open preview</button>
        </article>
      `
    )
    .join("");

  accountGrid.querySelectorAll("[data-demo-login]").forEach((button) => {
    button.addEventListener("click", () => loginAsDemo(button.dataset.demoLogin));
  });
}

function renderAdminPanel() {
  if (!state.selectedAdminClassId || !state.data.classes.some((course) => course.id === state.selectedAdminClassId)) {
    state.selectedAdminClassId = state.data.classes[0]?.id || null;
  }

  adminHeading.textContent = "Local attendance configuration";
  adminSummary.textContent = `The admin workspace currently holds ${state.data.tutors.length} tutor account${state.data.tutors.length === 1 ? "" : "s"}, ${state.data.classes.length} unit${state.data.classes.length === 1 ? "" : "s"}, and ${getTotalStudentCount()} student roster entries in this browser.`;
  adminMetricTutors.textContent = String(state.data.tutors.length);
  adminMetricUnits.textContent = String(state.data.classes.length);
  adminMetricStudents.textContent = String(getTotalStudentCount());
  adminMetricUnassigned.textContent = String(state.data.classes.filter((course) => !course.tutorId).length);

  createUnitTutorId.innerHTML = buildTutorOptions("");
  adminStudentUnitSelect.innerHTML = buildUnitOptions(state.selectedAdminClassId);
  adminStudentUnitSelect.value = state.selectedAdminClassId || "";

  renderTutorAdminList();
  renderUnitAdminList();
  renderStudentAdminList();
}

function renderTutorAdminList() {
  if (!state.data.tutors.length) {
    adminTutorList.innerHTML = '<div class="admin-empty">No tutors configured yet. Use the form above to create the first login.</div>';
    return;
  }

  adminTutorList.innerHTML = state.data.tutors
    .map((tutor) => {
      const assignedCount = getClassesForTutorId(tutor.id).length;
      return `
        <article class="admin-item" data-admin-tutor-id="${tutor.id}">
          <div class="admin-item__header">
            <div>
              <strong>${escapeHtml(tutor.name)}</strong>
              <div class="admin-item__meta">
                <span>${assignedCount} unit${assignedCount === 1 ? "" : "s"}</span>
                <span>ID ${escapeHtml(tutor.id)}</span>
              </div>
            </div>
            <span class="pill">Tutor</span>
          </div>

          <div class="admin-item__grid">
            <label>
              Tutor name
              <input data-field="name" value="${escapeAttribute(tutor.name)}">
            </label>
            <label>
              Title
              <input data-field="title" value="${escapeAttribute(tutor.title)}">
            </label>
            <label>
              Tutor password
              <input data-field="pin" value="${escapeAttribute(tutor.pin)}">
            </label>
            <label>
              Tutor ID
              <div class="admin-item__readonly">${escapeHtml(tutor.id)}</div>
            </label>
          </div>

          <div class="admin-item__actions">
            <button type="button" class="button button--primary" data-action="save-tutor">Save tutor</button>
            <button type="button" class="button button--danger" data-action="delete-tutor">Remove tutor</button>
          </div>
        </article>
      `;
    })
    .join("");

  adminTutorList.querySelectorAll('[data-action="save-tutor"]').forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-admin-tutor-id]");
      saveTutor(card.dataset.adminTutorId, card);
    });
  });

  adminTutorList.querySelectorAll('[data-action="delete-tutor"]').forEach((button) => {
    button.addEventListener("click", () => {
      deleteTutor(button.closest("[data-admin-tutor-id]").dataset.adminTutorId);
    });
  });
}

function renderUnitAdminList() {
  if (!state.data.classes.length) {
    adminUnitList.innerHTML = '<div class="admin-empty">No units exist yet. Create one above, then assign students into its roster.</div>';
    return;
  }

  adminUnitList.innerHTML = state.data.classes
    .map((course) => `
      <article class="admin-item" data-admin-unit-id="${course.id}">
        <div class="admin-item__header">
          <div>
            <strong>${escapeHtml(course.name)}</strong>
            <div class="admin-item__meta">
              <span>${course.students.length} student${course.students.length === 1 ? "" : "s"}</span>
              <span>${escapeHtml(course.schedule)}</span>
              <span>ID ${escapeHtml(course.id)}</span>
            </div>
          </div>
          <span class="pill">Unit</span>
        </div>

        <div class="admin-item__grid">
          <label>
            Unit name
            <input data-field="name" value="${escapeAttribute(course.name)}">
          </label>
          <label>
            Room or description
            <input data-field="room" value="${escapeAttribute(course.room)}">
          </label>
          <label>
            Scheduled day
            <select data-field="schedule">${buildScheduleOptions(course.schedule)}</select>
          </label>
          <label>
            Assigned tutor
            <select data-field="tutorId">${buildTutorOptions(course.tutorId)}</select>
          </label>
          <label>
            Unit code
            <div class="admin-item__readonly">${escapeHtml(course.id)}</div>
          </label>
        </div>

        <div class="admin-item__actions">
          <button type="button" class="button button--primary" data-action="save-unit">Save unit</button>
          <button type="button" class="button button--ghost" data-action="focus-roster">Manage roster</button>
          <button type="button" class="button button--danger" data-action="delete-unit">Remove unit</button>
        </div>
      </article>
    `)
    .join("");

  adminUnitList.querySelectorAll('[data-action="save-unit"]').forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-admin-unit-id]");
      saveUnit(card.dataset.adminUnitId, card);
    });
  });

  adminUnitList.querySelectorAll('[data-action="focus-roster"]').forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedAdminClassId = button.closest("[data-admin-unit-id]").dataset.adminUnitId;
      renderApp();
    });
  });

  adminUnitList.querySelectorAll('[data-action="delete-unit"]').forEach((button) => {
    button.addEventListener("click", () => {
      deleteUnit(button.closest("[data-admin-unit-id]").dataset.adminUnitId);
    });
  });
}

function renderStudentAdminList() {
  const course = state.data.classes.find((item) => item.id === state.selectedAdminClassId) || null;
  if (!course) {
    adminStudentList.innerHTML = '<div class="admin-empty">Create a unit before adding students to a roster.</div>';
    return;
  }

  if (!course.students.length) {
    adminStudentList.innerHTML = `<div class="admin-empty">${escapeHtml(course.name)} does not have any students yet. Add the first one above.</div>`;
    return;
  }

  adminStudentList.innerHTML = course.students
    .map((student) => `
      <article class="admin-item" data-admin-student-id="${student.id}">
        <div class="admin-item__header">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <div class="admin-item__meta">
              <span>${escapeHtml(student.id)}</span>
              <span>${escapeHtml(course.name)}</span>
            </div>
          </div>
          <span class="pill">Student</span>
        </div>

        <div class="admin-item__grid admin-item__student">
          <label>
            Student name
            <input data-field="name" value="${escapeAttribute(student.name)}">
          </label>
          <div class="admin-item__actions">
            <button type="button" class="button button--primary" data-action="save-student">Save</button>
            <button type="button" class="button button--danger" data-action="delete-student">Remove</button>
          </div>
        </div>
      </article>
    `)
    .join("");

  adminStudentList.querySelectorAll('[data-action="save-student"]').forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-admin-student-id]");
      saveStudent(course.id, card.dataset.adminStudentId, card);
    });
  });

  adminStudentList.querySelectorAll('[data-action="delete-student"]').forEach((button) => {
    button.addEventListener("click", () => {
      deleteStudent(course.id, button.closest("[data-admin-student-id]").dataset.adminStudentId);
    });
  });
}

function handleCreateTutor(event) {
  event.preventDefault();
  const name = document.getElementById("createTutorName").value.trim();
  const id = slugifyId(document.getElementById("createTutorId").value.trim());
  const pin = document.getElementById("createTutorPin").value.trim();
  const title = document.getElementById("createTutorTitle").value.trim() || `Tutor · ${name}`;

  if (!name || !id || !pin) {
    createTutorMessage.textContent = "Tutor name, ID, and password are required.";
    return;
  }

  if (state.data.tutors.some((tutor) => tutor.id === id)) {
    createTutorMessage.textContent = "That tutor ID is already in use.";
    return;
  }

  state.data.tutors.push({ id, pin, name, title, classIds: [] });
  createTutorForm.reset();
  createTutorMessage.textContent = "";
  saveData(`Tutor ${name} created`);
  renderApp();
}

function handleCreateUnit(event) {
  event.preventDefault();
  const name = document.getElementById("createUnitName").value.trim();
  const id = slugifyId(document.getElementById("createUnitId").value.trim());
  const room = document.getElementById("createUnitRoom").value.trim();
  const schedule = normalizeSchedule(document.getElementById("createUnitSchedule").value);
  const tutorId = document.getElementById("createUnitTutorId").value;

  if (!name || !id || !room) {
    createUnitMessage.textContent = "Unit name, code, and room/description are required.";
    return;
  }

  if (state.data.classes.some((course) => course.id === id)) {
    createUnitMessage.textContent = "That unit code already exists.";
    return;
  }

  state.data.classes.push({
    id,
    name,
    room,
    schedule,
    tutorId,
    students: []
  });
  state.selectedAdminClassId = id;
  createUnitForm.reset();
  document.getElementById("createUnitSchedule").value = "Monday";
  createUnitMessage.textContent = "";
  saveData(`Unit ${name} created`);
  renderApp();
}

function handleCreateStudent(event) {
  event.preventDefault();
  const course = state.data.classes.find((item) => item.id === adminStudentUnitSelect.value) || null;
  const name = document.getElementById("createStudentName").value.trim();

  if (!course) {
    createStudentMessage.textContent = "Select a unit before adding a student.";
    return;
  }
  if (!name) {
    createStudentMessage.textContent = "Student name is required.";
    return;
  }

  course.students.push({
    id: buildNextStudentId(course),
    name,
    course: course.name
  });
  createStudentForm.reset();
  createStudentMessage.textContent = "";
  saveData(`Student ${name} added to ${course.name}`);
  renderApp();
}

function handleAdminPasswordUpdate(event) {
  event.preventDefault();
  const currentPin = document.getElementById("adminCurrentPin").value.trim();
  const nextPin = document.getElementById("adminNewPin").value.trim();
  const confirmPin = document.getElementById("adminConfirmPin").value.trim();

  if (currentPin !== state.data.settings.adminPin) {
    adminPasswordMessage.textContent = "Current admin password is incorrect.";
    return;
  }
  if (!nextPin) {
    adminPasswordMessage.textContent = "New admin password cannot be empty.";
    return;
  }
  if (nextPin !== confirmPin) {
    adminPasswordMessage.textContent = "New password confirmation does not match.";
    return;
  }

  state.data.settings.adminPin = nextPin;
  adminPasswordForm.reset();
  adminPasswordMessage.textContent = "";
  saveData("Admin password updated");
  renderApp();
}

function handleAdminUnitSelection(event) {
  state.selectedAdminClassId = event.target.value || null;
  renderApp();
}

function saveTutor(tutorId, card) {
  const tutor = getTutorById(tutorId);
  if (!tutor || !card) {
    return;
  }

  const name = card.querySelector('[data-field="name"]').value.trim();
  const title = card.querySelector('[data-field="title"]').value.trim() || `Tutor · ${name}`;
  const pin = card.querySelector('[data-field="pin"]').value.trim();

  if (!name || !pin) {
    showToast("Tutor name and password are required");
    return;
  }

  tutor.name = name;
  tutor.title = title;
  tutor.pin = pin;
  saveData(`Tutor ${name} updated`);
  renderApp();
}

function deleteTutor(tutorId) {
  const tutor = getTutorById(tutorId);
  if (!tutor) {
    return;
  }

  const confirmed = window.confirm(`Remove ${tutor.name}? Any assigned units will remain but become unassigned.`);
  if (!confirmed) {
    return;
  }

  state.data.classes.forEach((course) => {
    if (course.tutorId === tutorId) {
      course.tutorId = "";
    }
  });
  state.data.tutors = state.data.tutors.filter((item) => item.id !== tutorId);
  saveData(`Tutor ${tutor.name} removed`);
  renderApp();
}

function saveUnit(unitId, card) {
  const course = state.data.classes.find((item) => item.id === unitId);
  if (!course || !card) {
    return;
  }

  const name = card.querySelector('[data-field="name"]').value.trim();
  const room = card.querySelector('[data-field="room"]').value.trim();
  const schedule = normalizeSchedule(card.querySelector('[data-field="schedule"]').value);
  const tutorId = card.querySelector('[data-field="tutorId"]').value;

  if (!name || !room) {
    showToast("Unit name and room are required");
    return;
  }

  course.name = name;
  course.room = room;
  course.schedule = schedule;
  course.tutorId = tutorId;
  saveData(`Unit ${name} updated`);
  renderApp();
}

function deleteUnit(unitId) {
  const course = state.data.classes.find((item) => item.id === unitId);
  if (!course) {
    return;
  }

  const confirmed = window.confirm(`Remove ${course.name}? Stored attendance for this unit will also be removed locally.`);
  if (!confirmed) {
    return;
  }

  state.data.classes = state.data.classes.filter((item) => item.id !== unitId);
  delete state.data.attendance[unitId];
  if (state.selectedAdminClassId === unitId) {
    state.selectedAdminClassId = state.data.classes[0]?.id || null;
  }
  if (state.selectedClassId === unitId) {
    state.selectedClassId = getAssignedClasses()[0]?.id || null;
  }
  saveData(`Unit ${course.name} removed`);
  renderApp();
}

function saveStudent(unitId, studentId, card) {
  const course = state.data.classes.find((item) => item.id === unitId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student || !card) {
    return;
  }

  const name = card.querySelector('[data-field="name"]').value.trim();
  if (!name) {
    showToast("Student name is required");
    return;
  }

  student.name = name;
  saveData(`Student ${name} updated`);
  renderApp();
}

function deleteStudent(unitId, studentId) {
  const course = state.data.classes.find((item) => item.id === unitId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student) {
    return;
  }

  const confirmed = window.confirm(`Remove ${student.name} from ${course.name}?`);
  if (!confirmed) {
    return;
  }

  course.students = course.students.filter((item) => item.id !== studentId);
  Object.values(state.data.attendance[unitId] || {}).forEach((session) => {
    delete session.records[studentId];
  });
  saveData(`Student ${student.name} removed`);
  renderApp();
}

function buildTutorOptions(selectedId) {
  const options = ['<option value="">Unassigned</option>'];
  state.data.tutors.forEach((tutor) => {
    options.push(`<option value="${escapeAttribute(tutor.id)}" ${tutor.id === selectedId ? "selected" : ""}>${escapeHtml(tutor.name)} (${escapeHtml(tutor.id)})</option>`);
  });
  return options.join("");
}

function buildUnitOptions(selectedId) {
  if (!state.data.classes.length) {
    return '<option value="">No units available</option>';
  }

  return state.data.classes
    .map((course) => `<option value="${escapeAttribute(course.id)}" ${course.id === selectedId ? "selected" : ""}>${escapeHtml(course.name)} (${escapeHtml(course.id)})</option>`)
    .join("");
}

function buildScheduleOptions(selectedValue) {
  return DAYS_OF_WEEK.map((day) => `<option value="${day}" ${day === selectedValue ? "selected" : ""}>${day}</option>`).join("");
}

function buildNextStudentId(course) {
  const nextNumber = course.students.reduce((max, student) => {
    const matched = String(student.id).match(/(\d+)$/);
    return matched ? Math.max(max, Number(matched[1])) : max;
  }, 0) + 1;
  return `${course.id}-${String(nextNumber).padStart(2, "0")}`;
}

function exportData() {
  const payload = JSON.stringify(state.data, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `attendance-demo-${getTodayKey()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("Local demo data exported");
}

function exportCsvBackup() {
  const csvRows = buildCsvRows();
  const csv = toCsv(csvRows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `attendance-backup-${getTodayKey()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("CSV backup exported");
}

function buildCsvRows() {
  const header = ["date", "class", "student", "status", "note", "average_attendance"];
  const rows = [header];

  state.data.classes.forEach((course) => {
    const sessionsByDay = state.data.attendance[course.id];

    if (!sessionsByDay || !Object.keys(sessionsByDay).length) {
      return;
    }

    Object.entries(sessionsByDay).forEach(([dayKey, session]) => {
      course.students.forEach((student) => {
        const record = session.records?.[student.id];
        if (!record?.status) {
          return;
        }

        rows.push([
          dayKey,
          course.name,
          student.name,
          STATUS_LOOKUP[record.status]?.label || record.status,
          record.note || "",
          formatAverage(getStudentAverage(course, student.id))
        ]);
      });
    });
  });

  return rows;
}

function toCsv(rows) {
  return rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

function escapeCsvCell(value) {
  const stringValue = String(value ?? "");
  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      state.data = hydrateData(parsed);
      state.selectedAdminClassId = state.data.classes[0]?.id || null;
      saveData("Imported local demo data");
      renderApp();
    } catch (error) {
      console.error("Failed to import demo data", error);
      showToast("Import failed: invalid JSON file");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function resetData() {
  const confirmed = window.confirm("Reset this device's demo attendance data? This only affects the current browser.");
  if (!confirmed) {
    return;
  }

  state.data = structuredClone(seedData);
  syncDataRelationships(state.data);
  state.selectedClassId = getAssignedClasses()[0]?.id || null;
  state.selectedAdminClassId = state.data.classes[0]?.id || null;
  saveData("Local device data reset");
  renderApp();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function getMarkedCountForTutor(assignedClasses) {
  return assignedClasses.reduce((total, course) => {
    const { session } = getClassSession(course.id);
    return total + Object.keys(session.records).length;
  }, 0);
}

function getStoredRecordCount() {
  return Object.values(state.data.attendance).reduce((total, sessionsByDay) => {
    const daySessions = Object.values(sessionsByDay || {});
    return total + daySessions.reduce((sum, session) => sum + Object.keys(session.records || {}).length, 0);
  }, 0);
}

function getTotalStudentCount() {
  return state.data.classes.reduce((total, course) => total + course.students.length, 0);
}

function formatHumanDate(dayKey) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dayKey}T09:00:00`));
}

function formatShortDate(dayKey) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${dayKey}T09:00:00`));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatTimeOnly(value) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatAverage(value) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${Math.round(value * 100)}%`;
}

function getInitialSelectedDateKey() {
  return clampDateKey(getTodayKey());
}

function buildAverageDraftDates() {
  const start = new Date(`${AVERAGE_DRAFT_START}T09:00:00`);
  return Array.from({ length: AVERAGE_DRAFT_WEEKS * 7 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next.toISOString().slice(0, 10);
  });
}

function getScheduledCalendarDates(course) {
  return AVERAGE_DRAFT_DATES.filter((dayKey) => isCourseScheduledOnDate(course, dayKey));
}

function isCourseScheduledOnDate(course, dayKey) {
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(new Date(`${dayKey}T09:00:00`));
  return weekday.toLowerCase() === String(course.schedule || "").toLowerCase();
}

function getDayOfMonth(dayKey) {
  return new Date(`${dayKey}T09:00:00`).getDate();
}

function formatWeekday(dayKey) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(new Date(`${dayKey}T09:00:00`));
}

function formatMonthLabel(monthKey) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric"
  }).format(new Date(`${monthKey}-01T09:00:00`));
}

function getMonthKey(dayKey) {
  return String(dayKey).slice(0, 7);
}

function buildCalendarCells(monthKey) {
  const monthStart = new Date(`${monthKey}-01T09:00:00`);
  const firstWeekdayOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekdayOffset }, () => ({ dayKey: null }));

  for (let day = 1; day <= daysInMonth; day += 1) {
    const next = new Date(monthStart);
    next.setDate(day);
    const dayKey = next.toISOString().slice(0, 10);
    cells.push({
      dayKey,
      isOutOfRange: dayKey < getCalendarMinDateKey() || dayKey > getCalendarMaxDateKey()
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dayKey: null });
  }

  return cells;
}

function shiftMonthKey(monthKey, offset) {
  const monthDate = new Date(`${monthKey}-01T09:00:00`);
  monthDate.setMonth(monthDate.getMonth() + offset);
  return clampMonthKey(monthDate.toISOString().slice(0, 7));
}

function clampDateKey(dayKey) {
  if (!dayKey) {
    return getTodayKey();
  }

  if (dayKey < getCalendarMinDateKey()) {
    return getCalendarMinDateKey();
  }
  if (dayKey > getCalendarMaxDateKey()) {
    return getCalendarMaxDateKey();
  }
  return dayKey;
}

function clampMonthKey(monthKey) {
  if (monthKey < getCalendarMinMonthKey()) {
    return getCalendarMinMonthKey();
  }
  if (monthKey > getCalendarMaxMonthKey()) {
    return getCalendarMaxMonthKey();
  }
  return monthKey;
}

function getCalendarMinDateKey() {
  const minDate = new Date(`${getTodayKey()}T09:00:00`);
  minDate.setFullYear(minDate.getFullYear() - CALENDAR_YEAR_RANGE);
  return minDate.toISOString().slice(0, 10);
}

function getCalendarMaxDateKey() {
  const maxDate = new Date(`${getTodayKey()}T09:00:00`);
  maxDate.setFullYear(maxDate.getFullYear() + CALENDAR_YEAR_RANGE);
  return maxDate.toISOString().slice(0, 10);
}

function getCalendarMinMonthKey() {
  return getMonthKey(getCalendarMinDateKey());
}

function getCalendarMaxMonthKey() {
  return getMonthKey(getCalendarMaxDateKey());
}

function normalizeSchedule(value) {
  return DAYS_OF_WEEK.includes(value) ? value : "Monday";
}

function slugifyId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function syncDataRelationships(data) {
  const tutorIds = new Set(data.tutors.map((tutor) => tutor.id));
  data.classes = data.classes.map((course) => ({
    ...course,
    tutorId: tutorIds.has(course.tutorId) ? course.tutorId : "",
    schedule: normalizeSchedule(course.schedule),
    students: course.students.map((student) => ({
      ...student,
      course: course.name
    }))
  }));

  const validClassIds = new Set(data.classes.map((course) => course.id));
  data.attendance = Object.fromEntries(
    Object.entries(data.attendance || {})
      .filter(([classId]) => validClassIds.has(classId))
      .map(([classId, sessionsByDay]) => {
        const studentIds = new Set((data.classes.find((course) => course.id === classId)?.students || []).map((student) => student.id));
        return [
          classId,
          Object.fromEntries(
            Object.entries(sessionsByDay || {}).map(([dayKey, session]) => [
              dayKey,
              {
                notes: typeof session?.notes === "string" ? session.notes : "",
                updatedAt: session?.updatedAt || null,
                records: Object.fromEntries(
                  Object.entries(session?.records || {}).filter(([studentId]) => studentIds.has(studentId))
                )
              }
            ])
          )
        ];
      })
  );

  data.tutors = data.tutors.map((tutor) => ({
    ...tutor,
    classIds: data.classes.filter((course) => course.tutorId === tutor.id).map((course) => course.id)
  }));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

/* Duplicate copy accidentally appended below.
const STORAGE_KEY = "aq-attendance-demo-v2";
const SESSION_KEY = "aq-attendance-demo-session-v2";
const ADMIN_SESSION_KEY = "aq-attendance-demo-admin-v1";
const DEFAULT_ADMIN_PIN = "admin";
const CALENDAR_YEAR_RANGE = 5;
const AVERAGE_DRAFT_START = "2026-05-04";
const AVERAGE_DRAFT_WEEKS = 4;
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const STATUS_OPTIONS = [
  { value: "present", label: "Present", countsAsAttendance: true, noteLabel: "" },
  { value: "late", label: "Late", countsAsAttendance: true, noteLabel: "" },
  { value: "absent", label: "Absent", countsAsAttendance: false, noteLabel: "Absence note" },
  { value: "leave", label: "Leave", countsAsAttendance: false, noteLabel: "Leave note" }
];
const STATUS_LOOKUP = Object.fromEntries(STATUS_OPTIONS.map((option) => [option.value, option]));
const AVERAGE_DRAFT_DATES = buildAverageDraftDates();

const STUDENT_NAMES = [
  "Nusrat Jahan Ripa",
  "Sophia Sestuso Veran",
  "David Haitham Al-Shadfan",
  "Athul Antony",
  "Muhammad Usman Malik",
  "Sabulao John Benedict",
  "Joshua Samuel",
  "Faiz Abdul Razak",
  "Gian Melchor Albaran Gella",
  "Soofia Sheik Sakhabuth",
  "Stephanie Lauren Avenion Laylo",
  "Sasindu Amash Abeysinghe",
  "Aschton James Macatangay",
  "Showkat Ahmed",
  "Kylie Noelle B. Andal",
  "Bencel Ermitanio Sajulga",
  "Leonarda Allan Rosales",
  "Benidict Sajulga",
  "Miguel Melendez Cendreda",
  "Angelo Jan Villarama Cruz",
  "Ayeen Limoodehi",
  "Mohammed Zazi"
];

const seedData = {
  settings: {
    adminPin: DEFAULT_ADMIN_PIN
  },
  tutors: [
    {
      id: "eee",
      pin: "password",
      name: "Akbar Qamar",
      title: "Tutor · Units 4020, 4001 and 4015",
      classIds: ["unit-4020", "unit-4001", "unit-4015"]
    }
  ],
  classes: [
    {
      id: "unit-4020",
      name: "Unit 4020",
      room: "Tuesday register",
      schedule: "Tuesday",
      tutorId: "eee",
      students: createStudents("4020")
    },
    {
      id: "unit-4001",
      name: "Unit 4001",
      room: "Wednesday register",
      schedule: "Wednesday",
      tutorId: "eee",
      students: createStudents("4001")
    },
    {
      id: "unit-4015",
      name: "Unit 4015",
      room: "Thursday register",
      schedule: "Thursday",
      tutorId: "eee",
      students: createStudents("4015")
    }
  ],
  attendance: {},
  activity: [],
  lastSavedAt: null
};

const state = {
  data: loadData(),
  currentTutorId: loadSessionTutorId(),
  isAdminUnlocked: loadSessionAdminUnlocked(),
  selectedClassId: null,
  selectedAdminClassId: null,
  selectedDateKey: getInitialSelectedDateKey(),
  visibleMonthKey: getMonthKey(getInitialSelectedDateKey()),
  showAverages: true
};

const loginPanel = document.getElementById("loginPanel");
const appPanel = document.getElementById("appPanel");
const adminPanel = document.getElementById("adminPanel");
const loginForm = document.getElementById("loginForm");
const adminAccessForm = document.getElementById("adminAccessForm");
const loginMessage = document.getElementById("loginMessage");
const adminAccessMessage = document.getElementById("adminAccessMessage");
const accountGrid = document.getElementById("accountGrid");
const classList = document.getElementById("classList");
const attendanceTable = document.getElementById("attendanceTable");
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const calendarPrevButton = document.getElementById("calendarPrevButton");
const calendarNextButton = document.getElementById("calendarNextButton");
const attendanceDateInput = document.getElementById("attendanceDateInput");
const showAverageToggle = document.getElementById("showAverageToggle");
const selectedClassTitle = document.getElementById("selectedClassTitle");
const selectedClassMeta = document.getElementById("selectedClassMeta");
const activityLog = document.getElementById("activityLog");
const toast = document.getElementById("toast");

const metricClasses = document.getElementById("metricClasses");
const metricMarked = document.getElementById("metricMarked");
const metricAverage = document.getElementById("metricAverage");
const metricStored = document.getElementById("metricStored");
const heroSummary = document.getElementById("heroSummary");
const welcomeHeading = document.getElementById("welcomeHeading");
const lastSavedLabel = document.getElementById("lastSavedLabel");
const todayLabel = document.getElementById("todayLabel");

const adminHeading = document.getElementById("adminHeading");
const adminSummary = document.getElementById("adminSummary");
const adminMetricTutors = document.getElementById("adminMetricTutors");
const adminMetricUnits = document.getElementById("adminMetricUnits");
const adminMetricStudents = document.getElementById("adminMetricStudents");
const adminMetricUnassigned = document.getElementById("adminMetricUnassigned");
const adminTutorList = document.getElementById("adminTutorList");
const adminUnitList = document.getElementById("adminUnitList");
const adminStudentList = document.getElementById("adminStudentList");
const adminStudentUnitSelect = document.getElementById("adminStudentUnitSelect");
const createUnitTutorId = document.getElementById("createUnitTutorId");
const createTutorForm = document.getElementById("createTutorForm");
const createUnitForm = document.getElementById("createUnitForm");
const createStudentForm = document.getElementById("createStudentForm");
const adminPasswordForm = document.getElementById("adminPasswordForm");
const createTutorMessage = document.getElementById("createTutorMessage");
const createUnitMessage = document.getElementById("createUnitMessage");
const createStudentMessage = document.getElementById("createStudentMessage");
const adminPasswordMessage = document.getElementById("adminPasswordMessage");

const tutorImportInput = document.getElementById("importInput");
const adminImportInput = document.getElementById("adminImportInput");

document.getElementById("exportCsvButton").addEventListener("click", exportCsvBackup);
document.getElementById("exportButton").addEventListener("click", exportData);
tutorImportInput.addEventListener("change", importData);
document.getElementById("resetButton").addEventListener("click", resetData);
document.getElementById("logoutButton").addEventListener("click", logout);
document.getElementById("adminExportCsvButton").addEventListener("click", exportCsvBackup);
document.getElementById("adminExportButton").addEventListener("click", exportData);
adminImportInput.addEventListener("change", importData);
document.getElementById("adminResetButton").addEventListener("click", resetData);
document.getElementById("adminLogoutButton").addEventListener("click", logoutAdmin);
loginForm.addEventListener("submit", handleLogin);
adminAccessForm.addEventListener("submit", handleAdminUnlock);
attendanceDateInput.addEventListener("input", handleDateSelection);
showAverageToggle.addEventListener("change", handleAverageToggle);
calendarPrevButton.addEventListener("click", () => changeVisibleMonth(-1));
calendarNextButton.addEventListener("click", () => changeVisibleMonth(1));
createTutorForm.addEventListener("submit", handleCreateTutor);
createUnitForm.addEventListener("submit", handleCreateUnit);
createStudentForm.addEventListener("submit", handleCreateStudent);
adminPasswordForm.addEventListener("submit", handleAdminPasswordUpdate);
adminStudentUnitSelect.addEventListener("change", handleAdminUnitSelection);

renderAccountGrid();
renderApp();

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = structuredClone(seedData);
      syncDataRelationships(seeded);
      return seeded;
    }

    const parsed = JSON.parse(raw);
    return hydrateData(parsed);
  } catch (error) {
    console.error("Failed to load stored demo data", error);
    const seeded = structuredClone(seedData);
    syncDataRelationships(seeded);
    return seeded;
  }
}

function hydrateData(parsed) {
  const data = {
    settings: normalizeSettings(parsed?.settings),
    tutors: normalizeTutors(parsed?.tutors),
    classes: normalizeClasses(parsed?.classes),
    attendance: normalizeAttendance(parsed?.attendance),
    activity: Array.isArray(parsed?.activity) ? parsed.activity.slice(0, 12) : [],
    lastSavedAt: parsed?.lastSavedAt || null
  };

  syncDataRelationships(data);
  return data;
}

function normalizeSettings(settings) {
  return {
    adminPin: typeof settings?.adminPin === "string" && settings.adminPin.trim() ? settings.adminPin : DEFAULT_ADMIN_PIN
  };
}

function normalizeTutors(tutors) {
  const source = Array.isArray(tutors) ? tutors : seedData.tutors;
  return source.map((tutor, index) => ({
    id: slugifyId(tutor?.id || `tutor-${index + 1}`),
    pin: String(tutor?.pin || "password"),
    name: String(tutor?.name || `Tutor ${index + 1}`),
    title: String(tutor?.title || "Tutor"),
    classIds: []
  }));
}

function normalizeClasses(classes) {
  const source = Array.isArray(classes) ? classes : seedData.classes;
  return source.map((course, courseIndex) => ({
    id: slugifyId(course?.id || `unit-${courseIndex + 1}`),
    name: String(course?.name || `Unit ${courseIndex + 1}`),
    room: String(course?.room || "Room not set"),
    schedule: normalizeSchedule(course?.schedule),
    tutorId: course?.tutorId ? slugifyId(course.tutorId) : "",
    students: normalizeStudents(course?.students, course?.name || `Unit ${courseIndex + 1}`)
  }));
}

function normalizeStudents(students, courseName) {
  const source = Array.isArray(students) ? students : [];
  return source.map((student, studentIndex) => ({
    id: String(student?.id || `${slugifyId(courseName || "unit")}-${String(studentIndex + 1).padStart(2, "0")}`),
    name: String(student?.name || `Student ${studentIndex + 1}`),
    course: String(student?.course || courseName || "Unit")
  }));
}

function normalizeAttendance(attendance) {
  if (!attendance || typeof attendance !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(attendance).map(([classId, sessionsByDay]) => [
      classId,
      Object.fromEntries(
        Object.entries(sessionsByDay || {}).map(([dayKey, session]) => [
          dayKey,
          {
            notes: typeof session?.notes === "string" ? session.notes : "",
            updatedAt: session?.updatedAt || null,
            records: Object.fromEntries(
              Object.entries(session?.records || {}).map(([studentId, record]) => [
                studentId,
                {
                  status: normalizeStatus(record?.status),
                  updatedAt: record?.updatedAt || null,
                  note: typeof record?.note === "string" ? record.note : ""
                }
              ])
            )
          }
        ])
      )
    ])
  );
}

function normalizeStatus(status) {
  return STATUS_LOOKUP[status] ? status : "";
}

function createStudents(unitCode) {
  return STUDENT_NAMES.map((name, index) => ({
    id: `${unitCode}-${String(index + 1).padStart(2, "0")}`,
    name,
    course: `Unit ${unitCode}`
  }));
}

function saveData(reason) {
  syncDataRelationships(state.data);
  state.data.lastSavedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  lastSavedLabel.textContent = `Last local save: ${formatDateTime(state.data.lastSavedAt)}`;
  if (reason) {
    showToast(reason);
  }
}

function loadSessionTutorId() {
  return sessionStorage.getItem(SESSION_KEY);
}

function loadSessionAdminUnlocked() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function setSessionTutorId(tutorId) {
  if (tutorId) {
    sessionStorage.setItem(SESSION_KEY, tutorId);
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function setSessionAdminUnlocked(isUnlocked) {
  if (isUnlocked) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

function getTutorById(tutorId) {
  return state.data.tutors.find((tutor) => tutor.id === tutorId) || null;
}

function getClassesForTutorId(tutorId) {
  return state.data.classes.filter((course) => course.tutorId === tutorId);
}

function getAssignedClasses() {
  const tutor = getTutorById(state.currentTutorId);
  if (!tutor) {
    return [];
  }

  return getClassesForTutorId(tutor.id);
}

function getSelectedClass() {
  const classes = getAssignedClasses();
  return classes.find((course) => course.id === state.selectedClassId) || classes[0] || null;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClassSession(classId, dayKey = state.selectedDateKey) {
  const attendance = state.data.attendance[classId] || {};
  const session = attendance[dayKey] || { records: {}, notes: "", updatedAt: null };
  return { dayKey, session };
}

function ensureClassSession(classId, dayKey = state.selectedDateKey) {
  const { session } = getClassSession(classId, dayKey);
  if (!state.data.attendance[classId]) {
    state.data.attendance[classId] = {};
  }
  if (!state.data.attendance[classId][dayKey]) {
    state.data.attendance[classId][dayKey] = session;
  }
  return state.data.attendance[classId][dayKey];
}

function handleLogin(event) {
  event.preventDefault();
  const loginId = document.getElementById("loginId").value.trim().toLowerCase();
  const loginPin = document.getElementById("loginPin").value.trim();
  const tutor = state.data.tutors.find((item) => item.id === loginId && item.pin === loginPin);

  if (!tutor) {
    loginMessage.textContent = "That tutor ID and passcode combination does not match the demo accounts.";
    return;
  }

  loginMessage.textContent = "";
  state.isAdminUnlocked = false;
  setSessionAdminUnlocked(false);
  state.currentTutorId = tutor.id;
  setSessionTutorId(tutor.id);
  state.selectedClassId = getClassesForTutorId(tutor.id)[0]?.id || null;
  addActivity(`${tutor.name} opened the demo workspace.`);
  renderApp();
  showToast(`Signed in as ${tutor.name}`);
}

function handleAdminUnlock(event) {
  event.preventDefault();
  const submittedPin = document.getElementById("adminAccessPin").value.trim();
  if (submittedPin !== state.data.settings.adminPin) {
    adminAccessMessage.textContent = "That admin password is not correct for the local configuration workspace.";
    return;
  }

  adminAccessMessage.textContent = "";
  adminAccessForm.reset();
  state.currentTutorId = null;
  state.selectedClassId = null;
  setSessionTutorId(null);
  state.isAdminUnlocked = true;
  state.selectedAdminClassId = state.data.classes[0]?.id || null;
  setSessionAdminUnlocked(true);
  renderApp();
  showToast("Admin workspace unlocked");
}

function loginAsDemo(tutorId) {
  const tutor = getTutorById(tutorId);
  if (!tutor) {
    return;
  }

  document.getElementById("loginId").value = tutor.id;
  document.getElementById("loginPin").value = tutor.pin;
  state.isAdminUnlocked = false;
  setSessionAdminUnlocked(false);
  state.currentTutorId = tutor.id;
  setSessionTutorId(tutor.id);
  state.selectedClassId = getClassesForTutorId(tutor.id)[0]?.id || null;
  addActivity(`${tutor.name} opened the demo workspace via preview access.`);
  renderApp();
  showToast(`Loaded ${tutor.name}'s tutor view`);
}

function logout() {
  const tutor = getTutorById(state.currentTutorId);
  if (tutor) {
    addActivity(`${tutor.name} logged out.`);
  }
  state.currentTutorId = null;
  state.selectedClassId = null;
  setSessionTutorId(null);
  renderApp();
}

function logoutAdmin() {
  state.isAdminUnlocked = false;
  state.selectedAdminClassId = null;
  setSessionAdminUnlocked(false);
  renderApp();
}

function renderApp() {
  syncDataRelationships(state.data);
  renderAccountGrid();

  if (state.isAdminUnlocked) {
    loginPanel.classList.add("hidden");
    appPanel.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    renderAdminPanel();
    return;
  }

  const tutor = getTutorById(state.currentTutorId);
  if (!tutor) {
    loginPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
    adminPanel.classList.add("hidden");
    loginMessage.textContent = "";
    return;
  }

  loginPanel.classList.add("hidden");
  appPanel.classList.remove("hidden");
  adminPanel.classList.add("hidden");

  const assignedClasses = getAssignedClasses();
  if (!state.selectedClassId || !assignedClasses.some((course) => course.id === state.selectedClassId)) {
    state.selectedClassId = assignedClasses[0]?.id || null;
  }

  const selectedClass = getSelectedClass();
  welcomeHeading.textContent = `${tutor.name} · ${tutor.title}`;
  heroSummary.textContent = `${tutor.name} is viewing ${assignedClasses.length} tutor-scoped class${assignedClasses.length === 1 ? "" : "es"}. Data persists only on this browser profile until the backend release is connected.`;
  todayLabel.textContent = `Selected date: ${formatHumanDate(state.selectedDateKey)}`;
  attendanceDateInput.value = state.selectedDateKey;
  attendanceDateInput.min = getCalendarMinDateKey();
  attendanceDateInput.max = getCalendarMaxDateKey();
  showAverageToggle.checked = state.showAverages;

  renderMetrics(assignedClasses, selectedClass);
  renderClassTabs(assignedClasses);
  renderCalendar(selectedClass);
  renderClassDetail(selectedClass);
  renderActivity();
  lastSavedLabel.textContent = state.data.lastSavedAt ? `Last local save: ${formatDateTime(state.data.lastSavedAt)}` : "No local edits yet.";
}

function renderMetrics(assignedClasses, selectedClass) {
  metricClasses.textContent = String(assignedClasses.length);
  metricMarked.textContent = String(getMarkedCountForTutor(assignedClasses));
  metricAverage.textContent = selectedClass ? formatAverage(getClassAverage(selectedClass)) : "0%";
  metricStored.textContent = String(getStoredRecordCount());
}

function renderClassTabs(assignedClasses) {
  if (!assignedClasses.length) {
    classList.innerHTML = '<p class="subtle">No units are assigned to this tutor yet.</p>';
    return;
  }

  classList.innerHTML = "";
  assignedClasses.forEach((course) => {
    const { session } = getClassSession(course.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "class-tab";
    button.setAttribute("aria-selected", String(course.id === state.selectedClassId));
    button.innerHTML = `
      <strong>${course.name}</strong>
      <div>${course.room}</div>
      <small>${course.schedule} · ${Object.keys(session.records).length}/${course.students.length} marked on ${formatShortDate(state.selectedDateKey)}</small>
    `;
    button.addEventListener("click", () => {
      state.selectedClassId = course.id;
      renderApp();
    });
    classList.appendChild(button);
  });
}

function renderClassDetail(course) {
  if (!course) {
    selectedClassTitle.textContent = "No class assigned";
    selectedClassMeta.innerHTML = "";
    attendanceTable.innerHTML = '<p class="subtle">Assign at least one class to a tutor to render the register.</p>';
    return;
  }

  const { session } = getClassSession(course.id);
  selectedClassTitle.textContent = course.name;
  selectedClassMeta.innerHTML = `
    <span class="meta-chip">${course.room}</span>
    <span class="meta-chip">${course.schedule}</span>
    <span class="meta-chip">${formatHumanDate(state.selectedDateKey)}</span>
    <span class="meta-chip">${Object.keys(session.records).length}/${course.students.length} marked</span>
    <span class="meta-chip">Average ${formatAverage(getClassAverage(course))}</span>
  `;

  const legend = `
    <div class="attendance-legend">
      <span class="legend-chip legend-chip--present">Present</span>
      <span class="legend-chip legend-chip--late">Late</span>
      <span class="legend-chip legend-chip--absent">Absent</span>
      <span class="legend-chip legend-chip--leave">Leave</span>
    </div>
  `;

  const rows = course.students.map((student) => renderStudentRow(course.id, student, session.records[student.id])).join("");
  attendanceTable.innerHTML = `${legend}${rows}`;

  attendanceTable.querySelectorAll(".status-button").forEach((button) => {
    button.addEventListener("click", () => {
      updateAttendance(course.id, button.dataset.studentId, button.dataset.status);
    });
  });

  attendanceTable.querySelectorAll(".student-note-input").forEach((field) => {
    field.addEventListener("input", () => {
      updateStudentNote(course.id, field.dataset.studentId, field.value);
    });
  });
}

function renderStudentRow(classId, student, record) {
  const status = STATUS_LOOKUP[record?.status]?.label || "Unmarked";
  const stamp = record?.updatedAt ? formatTimeOnly(record.updatedAt) : "Awaiting mark";
  const averageMarkup = state.showAverages ? `<span class="student-row__average">4-week average ${formatAverage(getStudentAverage(getSelectedClass(), student.id))}</span>` : "";
  const statusButtons = STATUS_OPTIONS
    .map((option) => {
      const activeClass = record?.status === option.value ? "is-active" : "";
      return `<button type="button" class="status-button ${activeClass}" data-class-id="${classId}" data-student-id="${student.id}" data-status="${option.value}">${option.label}</button>`;
    })
    .join("");
  const noteEnabled = record?.status === "absent" || record?.status === "leave";
  const noteLabel = noteEnabled ? STATUS_LOOKUP[record.status].noteLabel : "Note";

  return `
    <div class="student-row">
      <div class="student-row__identity">
        <strong>${student.name}</strong>
        <span class="student-row__course">${student.course}</span>
        ${averageMarkup}
      </div>
      <div class="student-row__status">
        <strong>${status}</strong><br>
        <span>${stamp}</span>
      </div>
      <div class="student-row__actions">${statusButtons}</div>
      <label class="student-row__note">
        <span>${noteLabel}</span>
        <textarea class="student-note-input" data-student-id="${student.id}" rows="3" placeholder="Add context for absence or leave" ${noteEnabled ? "" : "disabled"}>${escapeHtml(record?.note || "")}</textarea>
      </label>
    </div>
  `;
}

function updateAttendance(classId, studentId, status) {
  const course = state.data.classes.find((item) => item.id === classId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student) {
    return;
  }

  const session = ensureClassSession(classId);
  const existingRecord = session.records[studentId] || { note: "" };
  session.records[studentId] = {
    status,
    updatedAt: new Date().toISOString(),
    note: status === "absent" || status === "leave" ? existingRecord.note || "" : ""
  };
  session.updatedAt = new Date().toISOString();
  addActivity(`${student.name} marked ${status} in ${course.name} for ${formatShortDate(state.selectedDateKey)}.`);
  saveData(`${student.name} marked ${status}`);
  renderApp();
}

function updateStudentNote(classId, studentId, note) {
  const course = state.data.classes.find((item) => item.id === classId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student) {
    return;
  }

  const session = ensureClassSession(classId);
  const existingRecord = session.records[studentId];
  if (!existingRecord || (existingRecord.status !== "absent" && existingRecord.status !== "leave")) {
    return;
  }

  session.records[studentId] = {
    ...existingRecord,
    note,
    updatedAt: new Date().toISOString()
  };
  session.updatedAt = new Date().toISOString();
  saveData();
}

function handleDateSelection(event) {
  const nextDate = clampDateKey(event.target.value || getTodayKey());
  state.selectedDateKey = nextDate;
  state.visibleMonthKey = getMonthKey(nextDate);
  renderApp();
}

function handleAverageToggle(event) {
  state.showAverages = event.target.checked;
  renderApp();
}

function changeVisibleMonth(offset) {
  state.visibleMonthKey = shiftMonthKey(state.visibleMonthKey, offset);
  renderApp();
}

function renderCalendar(course) {
  const monthKey = state.visibleMonthKey;
  const calendarCells = buildCalendarCells(monthKey);
  calendarMonthLabel.textContent = formatMonthLabel(monthKey);
  calendarPrevButton.disabled = monthKey <= getCalendarMinMonthKey();
  calendarNextButton.disabled = monthKey >= getCalendarMaxMonthKey();

  calendarGrid.innerHTML = calendarCells
    .map((cell) => {
      if (!cell.dayKey) {
        return '<div class="calendar-day is-empty" aria-hidden="true"></div>';
      }

      const isSelected = cell.dayKey === state.selectedDateKey;
      const isScheduled = course ? isCourseScheduledOnDate(course, cell.dayKey) : false;
      const classes = ["calendar-day"];
      if (isSelected) {
        classes.push("is-selected");
      }
      if (isScheduled) {
        classes.push("is-scheduled");
      }
      if (cell.isOutOfRange) {
        classes.push("is-out-of-range");
      }

      return `
        <button type="button" class="${classes.join(" ")}" data-calendar-date="${cell.dayKey}" ${cell.isOutOfRange ? "disabled" : ""}>
          <span class="calendar-day__number">${getDayOfMonth(cell.dayKey)}</span>
          <span class="calendar-day__label">${formatWeekday(cell.dayKey)}</span>
        </button>
      `;
    })
    .join("");

  calendarGrid.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDateKey = button.dataset.calendarDate;
      state.visibleMonthKey = getMonthKey(state.selectedDateKey);
      renderApp();
    });
  });
}

function getStudentAverage(course, studentId) {
  if (!course) {
    return null;
  }

  const scheduledDates = getScheduledCalendarDates(course);
  let attended = 0;
  let marked = 0;

  scheduledDates.forEach((dayKey) => {
    const record = state.data.attendance[course.id]?.[dayKey]?.records?.[studentId];
    if (!record?.status || record.status === "leave") {
      return;
    }

    marked += 1;
    if (STATUS_LOOKUP[record.status]?.countsAsAttendance) {
      attended += 1;
    }
  });

  if (!marked) {
    return null;
  }

  return attended / marked;
}

function getClassAverage(course) {
  if (!course) {
    return null;
  }

  const averages = course.students
    .map((student) => getStudentAverage(course, student.id))
    .filter((value) => typeof value === "number");

  if (!averages.length) {
    return null;
  }

  return averages.reduce((sum, value) => sum + value, 0) / averages.length;
}

function addActivity(message) {
  state.data.activity.unshift({
    message,
    timestamp: new Date().toISOString()
  });
  state.data.activity = state.data.activity.slice(0, 10);
  saveData();
}

function renderActivity() {
  if (!state.data.activity.length) {
    activityLog.innerHTML = "<li>No tutor actions logged yet.</li>";
    return;
  }

  activityLog.innerHTML = state.data.activity
    .map((item) => `<li><strong>${formatTimeOnly(item.timestamp)}</strong><br>${item.message}</li>`)
    .join("");
}

function renderAccountGrid() {
  if (!state.data.tutors.length) {
    accountGrid.innerHTML = '<div class="admin-empty">No tutor accounts exist yet. Use the admin studio to create the first local login.</div>';
    return;
  }

  accountGrid.innerHTML = state.data.tutors
    .map(
      (tutor) => `
        <article class="account-card">
          <header>
            <div>
              <strong>${tutor.name}</strong>
              <small>${tutor.title}</small>
            </div>
            <span class="pill">${getClassesForTutorId(tutor.id).length} class${getClassesForTutorId(tutor.id).length === 1 ? "" : "es"}</span>
          </header>
          <div>Tutor ID: ${tutor.id}</div>
          <div>Passcode: ${tutor.pin}</div>
          <button type="button" class="button button--ghost" data-demo-login="${tutor.id}">Open preview</button>
        </article>
      `
    )
    .join("");

  accountGrid.querySelectorAll("[data-demo-login]").forEach((button) => {
    button.addEventListener("click", () => loginAsDemo(button.dataset.demoLogin));
  });
}

function renderAdminPanel() {
  if (!state.selectedAdminClassId || !state.data.classes.some((course) => course.id === state.selectedAdminClassId)) {
    state.selectedAdminClassId = state.data.classes[0]?.id || null;
  }

  adminHeading.textContent = "Local attendance configuration";
  adminSummary.textContent = `The admin workspace currently holds ${state.data.tutors.length} tutor account${state.data.tutors.length === 1 ? "" : "s"}, ${state.data.classes.length} unit${state.data.classes.length === 1 ? "" : "s"}, and ${getTotalStudentCount()} student roster entries in this browser.`;
  adminMetricTutors.textContent = String(state.data.tutors.length);
  adminMetricUnits.textContent = String(state.data.classes.length);
  adminMetricStudents.textContent = String(getTotalStudentCount());
  adminMetricUnassigned.textContent = String(state.data.classes.filter((course) => !course.tutorId).length);

  createUnitTutorId.innerHTML = buildTutorOptions("");
  adminStudentUnitSelect.innerHTML = buildUnitOptions(state.selectedAdminClassId);
  adminStudentUnitSelect.value = state.selectedAdminClassId || "";

  renderTutorAdminList();
  renderUnitAdminList();
  renderStudentAdminList();
}

function renderTutorAdminList() {
  if (!state.data.tutors.length) {
    adminTutorList.innerHTML = '<div class="admin-empty">No tutors configured yet. Use the form above to create the first login.</div>';
    return;
  }

  adminTutorList.innerHTML = state.data.tutors
    .map((tutor) => {
      const assignedCount = getClassesForTutorId(tutor.id).length;
      return `
        <article class="admin-item" data-admin-tutor-id="${tutor.id}">
          <div class="admin-item__header">
            <div>
              <strong>${escapeHtml(tutor.name)}</strong>
              <div class="admin-item__meta">
                <span>${assignedCount} unit${assignedCount === 1 ? "" : "s"}</span>
                <span>ID ${escapeHtml(tutor.id)}</span>
              </div>
            </div>
            <span class="pill">Tutor</span>
          </div>

          <div class="admin-item__grid">
            <label>
              Tutor name
              <input data-field="name" value="${escapeAttribute(tutor.name)}">
            </label>
            <label>
              Title
              <input data-field="title" value="${escapeAttribute(tutor.title)}">
            </label>
            <label>
              Tutor password
              <input data-field="pin" value="${escapeAttribute(tutor.pin)}">
            </label>
            <label>
              Tutor ID
              <div class="admin-item__readonly">${escapeHtml(tutor.id)}</div>
            </label>
          </div>

          <div class="admin-item__actions">
            <button type="button" class="button button--primary" data-action="save-tutor">Save tutor</button>
            <button type="button" class="button button--danger" data-action="delete-tutor">Remove tutor</button>
          </div>
        </article>
      `;
    })
    .join("");

  adminTutorList.querySelectorAll('[data-action="save-tutor"]').forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-admin-tutor-id]");
      saveTutor(card.dataset.adminTutorId, card);
    });
  });

  adminTutorList.querySelectorAll('[data-action="delete-tutor"]').forEach((button) => {
    button.addEventListener("click", () => {
      deleteTutor(button.closest("[data-admin-tutor-id]").dataset.adminTutorId);
    });
  });
}

function renderUnitAdminList() {
  if (!state.data.classes.length) {
    adminUnitList.innerHTML = '<div class="admin-empty">No units exist yet. Create one above, then assign students into its roster.</div>';
    return;
  }

  adminUnitList.innerHTML = state.data.classes
    .map((course) => `
      <article class="admin-item" data-admin-unit-id="${course.id}">
        <div class="admin-item__header">
          <div>
            <strong>${escapeHtml(course.name)}</strong>
            <div class="admin-item__meta">
              <span>${course.students.length} student${course.students.length === 1 ? "" : "s"}</span>
              <span>${escapeHtml(course.schedule)}</span>
              <span>ID ${escapeHtml(course.id)}</span>
            </div>
          </div>
          <span class="pill">Unit</span>
        </div>

        <div class="admin-item__grid">
          <label>
            Unit name
            <input data-field="name" value="${escapeAttribute(course.name)}">
          </label>
          <label>
            Room or description
            <input data-field="room" value="${escapeAttribute(course.room)}">
          </label>
          <label>
            Scheduled day
            <select data-field="schedule">${buildScheduleOptions(course.schedule)}</select>
          </label>
          <label>
            Assigned tutor
            <select data-field="tutorId">${buildTutorOptions(course.tutorId)}</select>
          </label>
          <label>
            Unit code
            <div class="admin-item__readonly">${escapeHtml(course.id)}</div>
          </label>
        </div>

        <div class="admin-item__actions">
          <button type="button" class="button button--primary" data-action="save-unit">Save unit</button>
          <button type="button" class="button button--ghost" data-action="focus-roster">Manage roster</button>
          <button type="button" class="button button--danger" data-action="delete-unit">Remove unit</button>
        </div>
      </article>
    `)
    .join("");

  adminUnitList.querySelectorAll('[data-action="save-unit"]').forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-admin-unit-id]");
      saveUnit(card.dataset.adminUnitId, card);
    });
  });

  adminUnitList.querySelectorAll('[data-action="focus-roster"]').forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedAdminClassId = button.closest("[data-admin-unit-id]").dataset.adminUnitId;
      renderApp();
    });
  });

  adminUnitList.querySelectorAll('[data-action="delete-unit"]').forEach((button) => {
    button.addEventListener("click", () => {
      deleteUnit(button.closest("[data-admin-unit-id]").dataset.adminUnitId);
    });
  });
}

function renderStudentAdminList() {
  const course = state.data.classes.find((item) => item.id === state.selectedAdminClassId) || null;
  if (!course) {
    adminStudentList.innerHTML = '<div class="admin-empty">Create a unit before adding students to a roster.</div>';
    return;
  }

  if (!course.students.length) {
    adminStudentList.innerHTML = `<div class="admin-empty">${escapeHtml(course.name)} does not have any students yet. Add the first one above.</div>`;
    return;
  }

  adminStudentList.innerHTML = course.students
    .map((student) => `
      <article class="admin-item" data-admin-student-id="${student.id}">
        <div class="admin-item__header">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <div class="admin-item__meta">
              <span>${escapeHtml(student.id)}</span>
              <span>${escapeHtml(course.name)}</span>
            </div>
          </div>
          <span class="pill">Student</span>
        </div>

        <div class="admin-item__grid admin-item__student">
          <label>
            Student name
            <input data-field="name" value="${escapeAttribute(student.name)}">
          </label>
          <div class="admin-item__actions">
            <button type="button" class="button button--primary" data-action="save-student">Save</button>
            <button type="button" class="button button--danger" data-action="delete-student">Remove</button>
          </div>
        </div>
      </article>
    `)
    .join("");

  adminStudentList.querySelectorAll('[data-action="save-student"]').forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-admin-student-id]");
      saveStudent(course.id, card.dataset.adminStudentId, card);
    });
  });

  adminStudentList.querySelectorAll('[data-action="delete-student"]').forEach((button) => {
    button.addEventListener("click", () => {
      deleteStudent(course.id, button.closest("[data-admin-student-id]").dataset.adminStudentId);
    });
  });
}

function handleCreateTutor(event) {
  event.preventDefault();
  const name = document.getElementById("createTutorName").value.trim();
  const id = slugifyId(document.getElementById("createTutorId").value.trim());
  const pin = document.getElementById("createTutorPin").value.trim();
  const title = document.getElementById("createTutorTitle").value.trim() || `Tutor · ${name}`;

  if (!name || !id || !pin) {
    createTutorMessage.textContent = "Tutor name, ID, and password are required.";
    return;
  }

  if (state.data.tutors.some((tutor) => tutor.id === id)) {
    createTutorMessage.textContent = "That tutor ID is already in use.";
    return;
  }

  state.data.tutors.push({ id, pin, name, title, classIds: [] });
  createTutorForm.reset();
  createTutorMessage.textContent = "";
  saveData(`Tutor ${name} created`);
  renderApp();
}

function handleCreateUnit(event) {
  event.preventDefault();
  const name = document.getElementById("createUnitName").value.trim();
  const id = slugifyId(document.getElementById("createUnitId").value.trim());
  const room = document.getElementById("createUnitRoom").value.trim();
  const schedule = normalizeSchedule(document.getElementById("createUnitSchedule").value);
  const tutorId = document.getElementById("createUnitTutorId").value;

  if (!name || !id || !room) {
    createUnitMessage.textContent = "Unit name, code, and room/description are required.";
    return;
  }

  if (state.data.classes.some((course) => course.id === id)) {
    createUnitMessage.textContent = "That unit code already exists.";
    return;
  }

  state.data.classes.push({
    id,
    name,
    room,
    schedule,
    tutorId,
    students: []
  });
  state.selectedAdminClassId = id;
  createUnitForm.reset();
  document.getElementById("createUnitSchedule").value = "Monday";
  createUnitMessage.textContent = "";
  saveData(`Unit ${name} created`);
  renderApp();
}

function handleCreateStudent(event) {
  event.preventDefault();
  const course = state.data.classes.find((item) => item.id === adminStudentUnitSelect.value) || null;
  const name = document.getElementById("createStudentName").value.trim();

  if (!course) {
    createStudentMessage.textContent = "Select a unit before adding a student.";
    return;
  }
  if (!name) {
    createStudentMessage.textContent = "Student name is required.";
    return;
  }

  course.students.push({
    id: buildNextStudentId(course),
    name,
    course: course.name
  });
  createStudentForm.reset();
  createStudentMessage.textContent = "";
  saveData(`Student ${name} added to ${course.name}`);
  renderApp();
}

function handleAdminPasswordUpdate(event) {
  event.preventDefault();
  const currentPin = document.getElementById("adminCurrentPin").value.trim();
  const nextPin = document.getElementById("adminNewPin").value.trim();
  const confirmPin = document.getElementById("adminConfirmPin").value.trim();

  if (currentPin !== state.data.settings.adminPin) {
    adminPasswordMessage.textContent = "Current admin password is incorrect.";
    return;
  }
  if (!nextPin) {
    adminPasswordMessage.textContent = "New admin password cannot be empty.";
    return;
  }
  if (nextPin !== confirmPin) {
    adminPasswordMessage.textContent = "New password confirmation does not match.";
    return;
  }

  state.data.settings.adminPin = nextPin;
  adminPasswordForm.reset();
  adminPasswordMessage.textContent = "";
  saveData("Admin password updated");
  renderApp();
}

function handleAdminUnitSelection(event) {
  state.selectedAdminClassId = event.target.value || null;
  renderApp();
}

function saveTutor(tutorId, card) {
  const tutor = getTutorById(tutorId);
  if (!tutor || !card) {
    return;
  }

  const name = card.querySelector('[data-field="name"]').value.trim();
  const title = card.querySelector('[data-field="title"]').value.trim() || `Tutor · ${name}`;
  const pin = card.querySelector('[data-field="pin"]').value.trim();

  if (!name || !pin) {
    showToast("Tutor name and password are required");
    return;
  }

  tutor.name = name;
  tutor.title = title;
  tutor.pin = pin;
  saveData(`Tutor ${name} updated`);
  renderApp();
}

function deleteTutor(tutorId) {
  const tutor = getTutorById(tutorId);
  if (!tutor) {
    return;
  }

  const confirmed = window.confirm(`Remove ${tutor.name}? Any assigned units will remain but become unassigned.`);
  if (!confirmed) {
    return;
  }

  state.data.classes.forEach((course) => {
    if (course.tutorId === tutorId) {
      course.tutorId = "";
    }
  });
  state.data.tutors = state.data.tutors.filter((item) => item.id !== tutorId);
  saveData(`Tutor ${tutor.name} removed`);
  renderApp();
}

function saveUnit(unitId, card) {
  const course = state.data.classes.find((item) => item.id === unitId);
  if (!course || !card) {
    return;
  }

  const name = card.querySelector('[data-field="name"]').value.trim();
  const room = card.querySelector('[data-field="room"]').value.trim();
  const schedule = normalizeSchedule(card.querySelector('[data-field="schedule"]').value);
  const tutorId = card.querySelector('[data-field="tutorId"]').value;

  if (!name || !room) {
    showToast("Unit name and room are required");
    return;
  }

  course.name = name;
  course.room = room;
  course.schedule = schedule;
  course.tutorId = tutorId;
  saveData(`Unit ${name} updated`);
  renderApp();
}

function deleteUnit(unitId) {
  const course = state.data.classes.find((item) => item.id === unitId);
  if (!course) {
    return;
  }

  const confirmed = window.confirm(`Remove ${course.name}? Stored attendance for this unit will also be removed locally.`);
  if (!confirmed) {
    return;
  }

  state.data.classes = state.data.classes.filter((item) => item.id !== unitId);
  delete state.data.attendance[unitId];
  if (state.selectedAdminClassId === unitId) {
    state.selectedAdminClassId = state.data.classes[0]?.id || null;
  }
  if (state.selectedClassId === unitId) {
    state.selectedClassId = getAssignedClasses()[0]?.id || null;
  }
  saveData(`Unit ${course.name} removed`);
  renderApp();
}

function saveStudent(unitId, studentId, card) {
  const course = state.data.classes.find((item) => item.id === unitId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student || !card) {
    return;
  }

  const name = card.querySelector('[data-field="name"]').value.trim();
  if (!name) {
    showToast("Student name is required");
    return;
  }

  student.name = name;
  saveData(`Student ${name} updated`);
  renderApp();
}

function deleteStudent(unitId, studentId) {
  const course = state.data.classes.find((item) => item.id === unitId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student) {
    return;
  }

  const confirmed = window.confirm(`Remove ${student.name} from ${course.name}?`);
  if (!confirmed) {
    return;
  }

  course.students = course.students.filter((item) => item.id !== studentId);
  Object.values(state.data.attendance[unitId] || {}).forEach((session) => {
    delete session.records[studentId];
  });
  saveData(`Student ${student.name} removed`);
  renderApp();
}

function buildTutorOptions(selectedId) {
  const options = ['<option value="">Unassigned</option>'];
  state.data.tutors.forEach((tutor) => {
    options.push(`<option value="${escapeAttribute(tutor.id)}" ${tutor.id === selectedId ? "selected" : ""}>${escapeHtml(tutor.name)} (${escapeHtml(tutor.id)})</option>`);
  });
  return options.join("");
}

function buildUnitOptions(selectedId) {
  if (!state.data.classes.length) {
    return '<option value="">No units available</option>';
  }

  return state.data.classes
    .map((course) => `<option value="${escapeAttribute(course.id)}" ${course.id === selectedId ? "selected" : ""}>${escapeHtml(course.name)} (${escapeHtml(course.id)})</option>`)
    .join("");
}

function buildScheduleOptions(selectedValue) {
  return DAYS_OF_WEEK.map((day) => `<option value="${day}" ${day === selectedValue ? "selected" : ""}>${day}</option>`).join("");
}

function buildNextStudentId(course) {
  const nextNumber = course.students.reduce((max, student) => {
    const matched = String(student.id).match(/(\d+)$/);
    return matched ? Math.max(max, Number(matched[1])) : max;
  }, 0) + 1;
  return `${course.id}-${String(nextNumber).padStart(2, "0")}`;
}

function exportData() {
  const payload = JSON.stringify(state.data, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `attendance-demo-${getTodayKey()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("Local demo data exported");
}

function exportCsvBackup() {
  const csvRows = buildCsvRows();
  const csv = toCsv(csvRows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `attendance-backup-${getTodayKey()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("CSV backup exported");
}

function buildCsvRows() {
  const header = ["date", "class", "student", "status", "note", "average_attendance"];
  const rows = [header];

  state.data.classes.forEach((course) => {
    const sessionsByDay = state.data.attendance[course.id];

    if (!sessionsByDay || !Object.keys(sessionsByDay).length) {
      return;
    }

    Object.entries(sessionsByDay).forEach(([dayKey, session]) => {
      course.students.forEach((student) => {
        const record = session.records?.[student.id];
        if (!record?.status) {
          return;
        }

        rows.push([
          dayKey,
          course.name,
          student.name,
          STATUS_LOOKUP[record.status]?.label || record.status,
          record.note || "",
          formatAverage(getStudentAverage(course, student.id))
        ]);
      });
    });
  });

  return rows;
}

function toCsv(rows) {
  return rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

function escapeCsvCell(value) {
  const stringValue = String(value ?? "");
  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      state.data = hydrateData(parsed);
      state.selectedAdminClassId = state.data.classes[0]?.id || null;
      saveData("Imported local demo data");
      renderApp();
    } catch (error) {
      console.error("Failed to import demo data", error);
      showToast("Import failed: invalid JSON file");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function resetData() {
  const confirmed = window.confirm("Reset this device's demo attendance data? This only affects the current browser.");
  if (!confirmed) {
    return;
  }

  state.data = structuredClone(seedData);
  syncDataRelationships(state.data);
  state.selectedClassId = getAssignedClasses()[0]?.id || null;
  state.selectedAdminClassId = state.data.classes[0]?.id || null;
  saveData("Local device data reset");
  renderApp();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function getMarkedCountForTutor(assignedClasses) {
  return assignedClasses.reduce((total, course) => {
    const { session } = getClassSession(course.id);
    return total + Object.keys(session.records).length;
  }, 0);
}

function getStoredRecordCount() {
  return Object.values(state.data.attendance).reduce((total, sessionsByDay) => {
    const daySessions = Object.values(sessionsByDay || {});
    return total + daySessions.reduce((sum, session) => sum + Object.keys(session.records || {}).length, 0);
  }, 0);
}

function getTotalStudentCount() {
  return state.data.classes.reduce((total, course) => total + course.students.length, 0);
}

function formatHumanDate(dayKey) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dayKey}T09:00:00`));
}

function formatShortDate(dayKey) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${dayKey}T09:00:00`));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatTimeOnly(value) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatAverage(value) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${Math.round(value * 100)}%`;
}

function getInitialSelectedDateKey() {
  return clampDateKey(getTodayKey());
}

function buildAverageDraftDates() {
  const start = new Date(`${AVERAGE_DRAFT_START}T09:00:00`);
  return Array.from({ length: AVERAGE_DRAFT_WEEKS * 7 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next.toISOString().slice(0, 10);
  });
}

function getScheduledCalendarDates(course) {
  return AVERAGE_DRAFT_DATES.filter((dayKey) => isCourseScheduledOnDate(course, dayKey));
}

function isCourseScheduledOnDate(course, dayKey) {
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(new Date(`${dayKey}T09:00:00`));
  return weekday.toLowerCase() === String(course.schedule || "").toLowerCase();
}

function getDayOfMonth(dayKey) {
  return new Date(`${dayKey}T09:00:00`).getDate();
}

function formatWeekday(dayKey) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(new Date(`${dayKey}T09:00:00`));
}

function formatMonthLabel(monthKey) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric"
  }).format(new Date(`${monthKey}-01T09:00:00`));
}

function getMonthKey(dayKey) {
  return String(dayKey).slice(0, 7);
}

function buildCalendarCells(monthKey) {
  const monthStart = new Date(`${monthKey}-01T09:00:00`);
  const firstWeekdayOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekdayOffset }, () => ({ dayKey: null }));

  for (let day = 1; day <= daysInMonth; day += 1) {
    const next = new Date(monthStart);
    next.setDate(day);
    const dayKey = next.toISOString().slice(0, 10);
    cells.push({
      dayKey,
      isOutOfRange: dayKey < getCalendarMinDateKey() || dayKey > getCalendarMaxDateKey()
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dayKey: null });
  }

  return cells;
}

function shiftMonthKey(monthKey, offset) {
  const monthDate = new Date(`${monthKey}-01T09:00:00`);
  monthDate.setMonth(monthDate.getMonth() + offset);
  return clampMonthKey(monthDate.toISOString().slice(0, 7));
}

function clampDateKey(dayKey) {
  if (!dayKey) {
    return getTodayKey();
  }

  if (dayKey < getCalendarMinDateKey()) {
    return getCalendarMinDateKey();
  }
  if (dayKey > getCalendarMaxDateKey()) {
    return getCalendarMaxDateKey();
  }
  return dayKey;
}

function clampMonthKey(monthKey) {
  if (monthKey < getCalendarMinMonthKey()) {
    return getCalendarMinMonthKey();
  }
  if (monthKey > getCalendarMaxMonthKey()) {
    return getCalendarMaxMonthKey();
  }
  return monthKey;
}

function getCalendarMinDateKey() {
  const minDate = new Date(`${getTodayKey()}T09:00:00`);
  minDate.setFullYear(minDate.getFullYear() - CALENDAR_YEAR_RANGE);
  return minDate.toISOString().slice(0, 10);
}

function getCalendarMaxDateKey() {
  const maxDate = new Date(`${getTodayKey()}T09:00:00`);
  maxDate.setFullYear(maxDate.getFullYear() + CALENDAR_YEAR_RANGE);
  return maxDate.toISOString().slice(0, 10);
}

function getCalendarMinMonthKey() {
  return getMonthKey(getCalendarMinDateKey());
}

function getCalendarMaxMonthKey() {
  return getMonthKey(getCalendarMaxDateKey());
}

function normalizeSchedule(value) {
  return DAYS_OF_WEEK.includes(value) ? value : "Monday";
}

function slugifyId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function syncDataRelationships(data) {
  const tutorIds = new Set(data.tutors.map((tutor) => tutor.id));
  data.classes = data.classes.map((course) => ({
    ...course,
    tutorId: tutorIds.has(course.tutorId) ? course.tutorId : "",
    schedule: normalizeSchedule(course.schedule),
    students: course.students.map((student) => ({
      ...student,
      course: course.name
    }))
  }));

  const validClassIds = new Set(data.classes.map((course) => course.id));
  data.attendance = Object.fromEntries(
    Object.entries(data.attendance || {})
      .filter(([classId]) => validClassIds.has(classId))
      .map(([classId, sessionsByDay]) => {
        const studentIds = new Set((data.classes.find((course) => course.id === classId)?.students || []).map((student) => student.id));
        return [
          classId,
          Object.fromEntries(
            Object.entries(sessionsByDay || {}).map(([dayKey, session]) => [
              dayKey,
              {
                notes: typeof session?.notes === "string" ? session.notes : "",
                updatedAt: session?.updatedAt || null,
                records: Object.fromEntries(
                  Object.entries(session?.records || {}).filter(([studentId]) => studentIds.has(studentId))
                )
              }
            ])
          )
        ];
      })
  );

  data.tutors = data.tutors.map((tutor) => ({
    ...tutor,
    classIds: data.classes.filter((course) => course.tutorId === tutor.id).map((course) => course.id)
  }));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
*/
