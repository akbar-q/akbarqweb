const STORAGE_KEY = "aq-attendance-demo-v2";
const SESSION_KEY = "aq-attendance-demo-session-v2";

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
  selectedClassId: null
};

const loginPanel = document.getElementById("loginPanel");
const appPanel = document.getElementById("appPanel");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const accountGrid = document.getElementById("accountGrid");
const classList = document.getElementById("classList");
const attendanceTable = document.getElementById("attendanceTable");
const selectedClassTitle = document.getElementById("selectedClassTitle");
const selectedClassMeta = document.getElementById("selectedClassMeta");
const sessionNotes = document.getElementById("sessionNotes");
const activityLog = document.getElementById("activityLog");
const toast = document.getElementById("toast");

const metricClasses = document.getElementById("metricClasses");
const metricMarked = document.getElementById("metricMarked");
const metricStored = document.getElementById("metricStored");
const heroSummary = document.getElementById("heroSummary");
const welcomeHeading = document.getElementById("welcomeHeading");
const lastSavedLabel = document.getElementById("lastSavedLabel");
const todayLabel = document.getElementById("todayLabel");

document.getElementById("exportCsvButton").addEventListener("click", exportCsvBackup);
document.getElementById("exportButton").addEventListener("click", exportData);
document.getElementById("importInput").addEventListener("change", importData);
document.getElementById("resetButton").addEventListener("click", resetData);
document.getElementById("logoutButton").addEventListener("click", logout);
loginForm.addEventListener("submit", handleLogin);
sessionNotes.addEventListener("input", handleNotesUpdate);

renderAccountGrid();
renderApp();

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(seedData);
    }

    const parsed = JSON.parse(raw);
    return hydrateData(parsed);
  } catch (error) {
    console.error("Failed to load stored demo data", error);
    return structuredClone(seedData);
  }
}

function hydrateData(parsed) {
  const base = structuredClone(seedData);
  return {
    tutors: base.tutors,
    classes: base.classes,
    attendance: parsed.attendance && typeof parsed.attendance === "object" ? parsed.attendance : {},
    activity: Array.isArray(parsed.activity) ? parsed.activity.slice(0, 12) : [],
    lastSavedAt: parsed.lastSavedAt || null
  };
}

function createStudents(unitCode) {
  return STUDENT_NAMES.map((name, index) => ({
    id: `${unitCode}-${String(index + 1).padStart(2, "0")}`,
    name,
    course: `Unit ${unitCode}`
  }));
}

function saveData(reason) {
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

function setSessionTutorId(tutorId) {
  if (tutorId) {
    sessionStorage.setItem(SESSION_KEY, tutorId);
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function getTutorById(tutorId) {
  return state.data.tutors.find((tutor) => tutor.id === tutorId) || null;
}

function getAssignedClasses() {
  const tutor = getTutorById(state.currentTutorId);
  if (!tutor) {
    return [];
  }

  return state.data.classes.filter((course) => tutor.classIds.includes(course.id));
}

function getSelectedClass() {
  const classes = getAssignedClasses();
  return classes.find((course) => course.id === state.selectedClassId) || classes[0] || null;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClassSession(classId) {
  const dayKey = getTodayKey();
  const attendance = state.data.attendance[classId] || {};
  const session = attendance[dayKey] || { records: {}, notes: "", updatedAt: null };
  return { dayKey, session };
}

function ensureClassSession(classId) {
  const { dayKey, session } = getClassSession(classId);
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
  state.currentTutorId = tutor.id;
  setSessionTutorId(tutor.id);
  state.selectedClassId = tutor.classIds[0] || null;
  addActivity(`${tutor.name} opened the demo workspace.`);
  renderApp();
  showToast(`Signed in as ${tutor.name}`);
}

function loginAsDemo(tutorId) {
  const tutor = getTutorById(tutorId);
  if (!tutor) {
    return;
  }

  document.getElementById("loginId").value = tutor.id;
  document.getElementById("loginPin").value = tutor.pin;
  state.currentTutorId = tutor.id;
  setSessionTutorId(tutor.id);
  state.selectedClassId = tutor.classIds[0] || null;
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

function renderApp() {
  const tutor = getTutorById(state.currentTutorId);
  if (!tutor) {
    loginPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
    loginMessage.textContent = "";
    return;
  }

  loginPanel.classList.add("hidden");
  appPanel.classList.remove("hidden");

  const assignedClasses = getAssignedClasses();
  if (!state.selectedClassId && assignedClasses[0]) {
    state.selectedClassId = assignedClasses[0].id;
  }

  const selectedClass = getSelectedClass();
  welcomeHeading.textContent = `${tutor.name} · ${tutor.title}`;
  heroSummary.textContent = `${tutor.name} is viewing ${assignedClasses.length} tutor-scoped class${assignedClasses.length === 1 ? "" : "es"}. Data persists only on this browser profile until the backend release is connected.`;
  todayLabel.textContent = `Today: ${formatHumanDate(getTodayKey())}`;

  renderMetrics(assignedClasses);
  renderClassTabs(assignedClasses);
  renderClassDetail(selectedClass);
  renderActivity();
  lastSavedLabel.textContent = state.data.lastSavedAt ? `Last local save: ${formatDateTime(state.data.lastSavedAt)}` : "No local edits yet.";
}

function renderMetrics(assignedClasses) {
  metricClasses.textContent = String(assignedClasses.length);
  metricMarked.textContent = String(getMarkedCountForTutor(assignedClasses));
  metricStored.textContent = String(getStoredRecordCount());
}

function renderClassTabs(assignedClasses) {
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
      <small>${course.schedule} · ${Object.keys(session.records).length}/${course.students.length} marked</small>
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
    sessionNotes.value = "";
    attendanceTable.innerHTML = "<p class=\"subtle\">Assign at least one class to a tutor to render the register.</p>";
    return;
  }

  const { session } = getClassSession(course.id);
  selectedClassTitle.textContent = course.name;
  selectedClassMeta.innerHTML = `
    <span class="meta-chip">${course.room}</span>
    <span class="meta-chip">${course.schedule}</span>
    <span class="meta-chip">${Object.keys(session.records).length}/${course.students.length} marked</span>
  `;
  sessionNotes.value = session.notes || "";

  const legend = `
    <div class="attendance-legend">
      <span class="legend-chip legend-chip--present">Present</span>
      <span class="legend-chip legend-chip--late">Late</span>
      <span class="legend-chip legend-chip--absent">Absent</span>
    </div>
  `;

  const rows = course.students.map((student) => renderStudentRow(course.id, student, session.records[student.id])).join("");
  attendanceTable.innerHTML = `${legend}${rows}`;

  attendanceTable.querySelectorAll(".status-button").forEach((button) => {
    button.addEventListener("click", () => {
      updateAttendance(course.id, button.dataset.studentId, button.dataset.status);
    });
  });
}

function renderStudentRow(classId, student, record) {
  const status = record?.status || "Unmarked";
  const stamp = record?.updatedAt ? formatTimeOnly(record.updatedAt) : "Awaiting mark";
  const statusButtons = ["present", "late", "absent"]
    .map((kind) => {
      const label = kind.charAt(0).toUpperCase() + kind.slice(1);
      const activeClass = record?.status === kind ? "is-active" : "";
      return `<button type="button" class="status-button ${activeClass}" data-class-id="${classId}" data-student-id="${student.id}" data-status="${kind}">${label}</button>`;
    })
    .join("");

  return `
    <div class="student-row">
      <div class="student-row__identity">
        <strong>${student.name}</strong>
        <span class="student-row__course">${student.course}</span>
      </div>
      <div class="student-row__status">
        <strong>${status}</strong><br>
        <span>${stamp}</span>
      </div>
      <div class="student-row__actions">${statusButtons}</div>
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
  session.records[studentId] = {
    status,
    updatedAt: new Date().toISOString()
  };
  session.updatedAt = new Date().toISOString();
  addActivity(`${student.name} marked ${status} in ${course.name}.`);
  saveData(`${student.name} marked ${status}`);
  renderApp();
}

function handleNotesUpdate(event) {
  const course = getSelectedClass();
  if (!course) {
    return;
  }

  const session = ensureClassSession(course.id);
  session.notes = event.target.value;
  session.updatedAt = new Date().toISOString();
  saveData();
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
  accountGrid.innerHTML = state.data.tutors
    .map(
      (tutor) => `
        <article class="account-card">
          <header>
            <div>
              <strong>${tutor.name}</strong>
              <small>${tutor.title}</small>
            </div>
            <span class="pill">${tutor.classIds.length} class${tutor.classIds.length === 1 ? "" : "es"}</span>
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
  const header = [
    "date",
    "class_id",
    "class_name",
    "scheduled_day",
    "student_id",
    "student_name",
    "status",
    "updated_at",
    "session_notes",
    "tutor_id",
    "tutor_name"
  ];

  const rows = [header];

  state.data.classes.forEach((course) => {
    const tutor = getTutorById(course.tutorId);
    const sessionsByDay = state.data.attendance[course.id];

    if (!sessionsByDay || !Object.keys(sessionsByDay).length) {
      rows.push([
        getTodayKey(),
        course.id,
        course.name,
        course.schedule,
        "",
        "",
        "",
        "",
        "",
        tutor?.id || course.tutorId,
        tutor?.name || ""
      ]);
      return;
    }

    Object.entries(sessionsByDay).forEach(([dayKey, session]) => {
      course.students.forEach((student) => {
        const record = session.records?.[student.id];
        rows.push([
          dayKey,
          course.id,
          course.name,
          course.schedule,
          student.id,
          student.name,
          record?.status || "",
          record?.updatedAt || "",
          session.notes || "",
          tutor?.id || course.tutorId,
          tutor?.name || ""
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
      saveData("Imported local demo data");
      renderAccountGrid();
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
  state.selectedClassId = getTutorById(state.currentTutorId)?.classIds[0] || null;
  saveData("Local device data reset");
  renderAccountGrid();
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

function formatHumanDate(dayKey) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
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