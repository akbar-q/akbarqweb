const STORAGE_KEY = "aq-attendance-demo-v2";
const SESSION_KEY = "aq-attendance-demo-session-v2";
const ADMIN_SESSION_KEY = "aq-attendance-demo-admin-v1";
const DEFAULT_ADMIN_PIN = "admin";
const API_BASE_URL = resolveApiBaseUrl();
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
  currentTutorProfile: loadSessionTutorProfile(),
  currentTutorId: loadSessionTutorId(),
  currentAdminSession: loadSessionAdminSession(),
  isAdminUnlocked: loadSessionAdminUnlocked(),
  selectedClassId: null,
  selectedAdminClassId: null,
  selectedDateKey: getInitialSelectedDateKey(),
  visibleMonthKey: getMonthKey(getInitialSelectedDateKey()),
  showAverages: true,
  apiConnectionState: "pending",
  loadedAttendanceKeys: {},
  loadingAttendanceKeys: {},
  attendanceRetryAfter: {},
  pendingNoteSaveTimers: {}
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
const deploymentBadge = document.getElementById("deploymentBadge");
const bannerStatusText = document.getElementById("bannerStatusText");
const bannerApiBase = document.getElementById("bannerApiBase");
const bannerApiHealth = document.getElementById("bannerApiHealth");
const connectionPill = document.getElementById("connectionPill");
const connectionForm = document.getElementById("connectionForm");
const apiBaseUrlInput = document.getElementById("apiBaseUrlInput");
const resetApiBaseUrlButton = document.getElementById("resetApiBaseUrlButton");
const connectionMessage = document.getElementById("connectionMessage");

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
connectionForm.addEventListener("submit", handleConnectionSave);
resetApiBaseUrlButton.addEventListener("click", resetConnectionBaseUrl);

initializeApp();

function resolveApiBaseUrl() {
  const url = new URL(window.location.href);
  const queryOverride = url.searchParams.get("apiBaseUrl");
  const configuredOverride = window.ATTENDANCE_API_BASE_URL || localStorage.getItem("aq-attendance-api-base-url") || "";
  const baseUrl = queryOverride || configuredOverride;

  if (baseUrl) {
    return String(baseUrl).replace(/\/+$/, "");
  }

  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return window.location.origin;
  }

  return "http://localhost:3001";
}

function persistApiBaseUrl(baseUrl) {
  if (baseUrl) {
    localStorage.setItem("aq-attendance-api-base-url", baseUrl);
    return;
  }

  localStorage.removeItem("aq-attendance-api-base-url");
}

function formatApiBaseUrl(baseUrl) {
  return baseUrl || "Not configured";
}

function setConnectionVisualState(stateName, message) {
  state.apiConnectionState = stateName;
  connectionPill.classList.remove("is-online", "is-offline", "is-pending");

  if (stateName === "online") {
    connectionPill.classList.add("is-online");
    connectionPill.textContent = "Connected";
    bannerApiHealth.textContent = "Online";
    bannerStatusText.textContent = message || "Live API connection confirmed";
    deploymentBadge.textContent = "Pilot ready";
    return;
  }

  if (stateName === "offline") {
    connectionPill.classList.add("is-offline");
    connectionPill.textContent = "Offline";
    bannerApiHealth.textContent = "Offline";
    bannerStatusText.textContent = message || "API not reachable from this page";
    deploymentBadge.textContent = "Needs attention";
    return;
  }

  connectionPill.classList.add("is-pending");
  connectionPill.textContent = "Checking";
  bannerApiHealth.textContent = "Checking";
  bannerStatusText.textContent = message || "Checking API connection";
  deploymentBadge.textContent = "Pilot build";
}

async function checkApiHealth({ showFeedback = false } = {}) {
  bannerApiBase.textContent = formatApiBaseUrl(API_BASE_URL);
  apiBaseUrlInput.value = API_BASE_URL;
  setConnectionVisualState("pending");

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(`Health check failed (${response.status})`);
    }

    const payload = await response.json();
    setConnectionVisualState("online", payload?.database === "connected" ? "Live API and database are connected" : "API responded but database status is unclear");
    connectionMessage.textContent = showFeedback ? `Connected to ${API_BASE_URL}` : "";
    return true;
  } catch (error) {
    console.error("API health check failed", error);
    setConnectionVisualState("offline", "API not reachable from this page");
    connectionMessage.textContent = showFeedback ? (error.message || "Connection check failed") : "";
    return false;
  }
}

async function handleConnectionSave(event) {
  event.preventDefault();
  const normalizedBaseUrl = String(apiBaseUrlInput.value || "").trim().replace(/\/+$/, "");

  if (!normalizedBaseUrl) {
    connectionMessage.textContent = "Enter a valid API URL or use the default button.";
    return;
  }

  persistApiBaseUrl(normalizedBaseUrl);
  connectionMessage.textContent = "Saved. Reloading with the new API URL...";
  window.location.reload();
}

function resetConnectionBaseUrl() {
  persistApiBaseUrl("");
  connectionMessage.textContent = "Default API resolution restored. Reloading...";
  window.location.reload();
}

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
  const storedSession = loadSessionTutorProfile();
  if (storedSession?.id) {
    return storedSession.id;
  }

  return sessionStorage.getItem(SESSION_KEY);
}

function loadSessionTutorProfile() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const tutorId = String(parsed.id || "").trim().toLowerCase();
    if (!tutorId) {
      return null;
    }

    return {
      id: tutorId,
      name: String(parsed.name || "Tutor"),
      title: String(parsed.title || "Tutor"),
      token: typeof parsed.token === "string" ? parsed.token : ""
    };
  } catch (error) {
    return null;
  }
}

function loadSessionAdminUnlocked() {
  return Boolean(loadSessionAdminSession()?.token);
}

function loadSessionAdminSession() {
  const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.token !== "string" || !parsed.token) {
      return null;
    }

    return { token: parsed.token };
  } catch (error) {
    return null;
  }
}

function setSessionTutorSession(tutorSession) {
  if (tutorSession?.id) {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: tutorSession.id,
        name: tutorSession.name,
        title: tutorSession.title,
        token: tutorSession.token || ""
      })
    );
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function setSessionAdminUnlocked(isUnlocked) {
  if (!isUnlocked) {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

function setSessionAdminSession(adminSession) {
  if (adminSession?.token) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ token: adminSession.token }));
    return;
  }

  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function getTutorById(tutorId) {
  const tutor = state.data.tutors.find((item) => item.id === tutorId);
  if (tutor) {
    return tutor;
  }

  if (state.currentTutorProfile?.id === tutorId) {
    return state.currentTutorProfile;
  }

  return null;
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

function isRemoteTutorSession() {
  return Boolean(state.currentTutorId && state.currentTutorProfile?.token);
}

function isRemoteAdminSession() {
  return Boolean(state.currentAdminSession?.token);
}

function getAttendanceCacheKey(classId, dayKey) {
  return `${classId}::${dayKey}`;
}

function markAttendanceSessionLoaded(classId, dayKey, isLoaded = true) {
  state.loadedAttendanceKeys[getAttendanceCacheKey(classId, dayKey)] = isLoaded;
}

function hasAttendanceSessionLoaded(classId, dayKey) {
  return Boolean(state.loadedAttendanceKeys[getAttendanceCacheKey(classId, dayKey)]);
}

function setAttendanceSessionLoading(classId, dayKey, isLoading) {
  const cacheKey = getAttendanceCacheKey(classId, dayKey);
  if (isLoading) {
    state.loadingAttendanceKeys[cacheKey] = true;
    return;
  }

  delete state.loadingAttendanceKeys[cacheKey];
}

function isAttendanceSessionLoading(classId, dayKey) {
  return Boolean(state.loadingAttendanceKeys[getAttendanceCacheKey(classId, dayKey)]);
}

function canRetryAttendanceLoad(classId, dayKey) {
  const retryAfter = state.attendanceRetryAfter[getAttendanceCacheKey(classId, dayKey)] || 0;
  return retryAfter <= Date.now();
}

function normalizeAttendanceRecord(record) {
  return {
    status: normalizeStatus(record?.status),
    updatedAt: record?.updatedAt || record?.updated_at || null,
    note: typeof record?.note === "string" ? record.note : ""
  };
}

function cacheAttendanceSession(classId, dayKey, records, updatedAt = null) {
  const session = ensureClassSession(classId, dayKey);
  session.records = Object.fromEntries(
    Object.entries(records || {}).map(([studentId, record]) => [studentId, normalizeAttendanceRecord(record)])
  );
  session.updatedAt = updatedAt || session.updatedAt || null;
  markAttendanceSessionLoaded(classId, dayKey, true);
  delete state.attendanceRetryAfter[getAttendanceCacheKey(classId, dayKey)];
}

function applyAdminBootstrap(payload) {
  const existingTutorPins = Object.fromEntries(
    state.data.tutors.map((tutor) => [tutor.id, tutor.pin || ""])
  );
  const studentsByUnit = (payload?.students || []).reduce((accumulator, student) => {
    const bucket = accumulator[student.unitId] || [];
    bucket.push({
      id: String(student.id || "").trim(),
      name: String(student.name || "Student"),
      course: String(student.course || "")
    });
    accumulator[student.unitId] = bucket;
    return accumulator;
  }, {});

  state.data.tutors = (payload?.tutors || []).map((tutor) => ({
    id: String(tutor.id || "").trim().toLowerCase(),
    pin: existingTutorPins[String(tutor.id || "").trim().toLowerCase()] || "",
    name: String(tutor.name || "Tutor"),
    title: String(tutor.title || "Tutor"),
    classIds: Array.isArray(tutor.classIds) ? tutor.classIds.map((id) => String(id || "").trim().toLowerCase()) : []
  }));

  state.data.classes = (payload?.units || []).map((unit) => ({
    id: String(unit.id || "").trim().toLowerCase(),
    name: String(unit.name || "Unit"),
    room: String(unit.room || "Room not set"),
    schedule: normalizeSchedule(unit.schedule),
    tutorId: String(unit.tutorId || "").trim().toLowerCase(),
    students: studentsByUnit[String(unit.id || "").trim().toLowerCase()] || []
  }));

  const validUnitIds = new Set(state.data.classes.map((course) => course.id));
  Object.keys(state.data.attendance).forEach((unitId) => {
    if (!validUnitIds.has(unitId)) {
      delete state.data.attendance[unitId];
    }
  });

  syncDataRelationships(state.data);
}

async function loadAdminWorkspace() {
  if (!isRemoteAdminSession()) {
    return;
  }

  const payload = await apiRequest("/admin/bootstrap", {
    token: state.currentAdminSession.token
  });

  applyAdminBootstrap(payload);
}

async function loadAttendanceSession(classId, dayKey, { force = false, renderOnComplete = true } = {}) {
  if (!isRemoteTutorSession()) {
    return;
  }

  if (!force && (hasAttendanceSessionLoaded(classId, dayKey) || isAttendanceSessionLoading(classId, dayKey) || !canRetryAttendanceLoad(classId, dayKey))) {
    return;
  }

  setAttendanceSessionLoading(classId, dayKey, true);

  try {
    const payload = await apiRequest(`/attendance/${encodeURIComponent(classId)}/${encodeURIComponent(dayKey)}`, {
      token: state.currentTutorProfile?.token
    });

    cacheAttendanceSession(classId, dayKey, payload?.records || {});
  } catch (error) {
    console.error(`Failed to load attendance for ${classId} on ${dayKey}`, error);
    state.attendanceRetryAfter[getAttendanceCacheKey(classId, dayKey)] = Date.now() + 5000;
    if (renderOnComplete && classId === state.selectedClassId && dayKey === state.selectedDateKey) {
      showToast("Could not load attendance from the backend for this date.");
    }
  } finally {
    setAttendanceSessionLoading(classId, dayKey, false);
    if (renderOnComplete) {
      renderApp();
    }
  }
}

async function preloadTutorAttendance(classes) {
  if (!isRemoteTutorSession() || !classes.length) {
    return;
  }

  const requests = [];

  classes.forEach((course) => {
    const dateKeys = new Set(getScheduledCalendarDates(course));
    dateKeys.add(state.selectedDateKey);

    dateKeys.forEach((dayKey) => {
      requests.push(loadAttendanceSession(course.id, dayKey, { renderOnComplete: false }));
    });
  });

  await Promise.allSettled(requests);
}

function ensureAttendanceLoadedForDate(classes, dayKey) {
  if (!isRemoteTutorSession()) {
    return;
  }

  classes.forEach((course) => {
    void loadAttendanceSession(course.id, dayKey);
  });
}

async function persistAttendanceRecord(classId, dayKey, studentId, record) {
  if (!isRemoteTutorSession()) {
    return normalizeAttendanceRecord(record);
  }

  const payload = await apiRequest(
    `/attendance/${encodeURIComponent(classId)}/${encodeURIComponent(dayKey)}/${encodeURIComponent(studentId)}`,
    {
      method: "PUT",
      token: state.currentTutorProfile?.token,
      body: {
        status: record.status,
        note: record.note || ""
      }
    }
  );

  return normalizeAttendanceRecord(payload?.saved || record);
}

function scheduleNoteSync(classId, dayKey, studentId) {
  if (!isRemoteTutorSession()) {
    return;
  }

  const timerKey = getAttendanceCacheKey(`${classId}::${studentId}`, dayKey);
  if (state.pendingNoteSaveTimers[timerKey]) {
    clearTimeout(state.pendingNoteSaveTimers[timerKey]);
  }

  state.pendingNoteSaveTimers[timerKey] = setTimeout(async () => {
    delete state.pendingNoteSaveTimers[timerKey];

    const record = state.data.attendance[classId]?.[dayKey]?.records?.[studentId];
    if (!record?.status) {
      return;
    }

    try {
      const savedRecord = await persistAttendanceRecord(classId, dayKey, studentId, record);
      const session = ensureClassSession(classId, dayKey);
      session.records[studentId] = savedRecord;
      session.updatedAt = savedRecord.updatedAt || new Date().toISOString();
      saveData();
      renderApp();
    } catch (error) {
      console.error(`Failed to sync note for ${studentId} on ${dayKey}`, error);
      showToast("Attendance note sync failed. The latest edit is still only local.");
    }
  }, 500);
}

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const responseText = await response.text();
  let payload = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch (error) {
      payload = { error: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload;
}

function upsertTutorProfile(tutor) {
  const normalizedTutor = {
    id: String(tutor?.id || "").trim().toLowerCase(),
    name: String(tutor?.name || "Tutor"),
    title: String(tutor?.title || "Tutor")
  };

  const tutorIndex = state.data.tutors.findIndex((item) => item.id === normalizedTutor.id);
  if (tutorIndex >= 0) {
    state.data.tutors[tutorIndex] = {
      ...state.data.tutors[tutorIndex],
      ...normalizedTutor
    };
    return state.data.tutors[tutorIndex];
  }

  const nextTutor = {
    ...normalizedTutor,
    pin: "",
    classIds: []
  };
  state.data.tutors.push(nextTutor);
  return nextTutor;
}

function replaceTutorClasses(tutorId, classes) {
  const normalizedClasses = normalizeClasses(classes).map((course) => ({
    ...course,
    tutorId
  }));

  state.data.classes = state.data.classes
    .filter((course) => course.tutorId !== tutorId)
    .concat(normalizedClasses);

  syncDataRelationships(state.data);
}

async function hydrateTutorWorkspace(tutorId) {
  const payload = await apiRequest(`/tutors/${encodeURIComponent(tutorId)}/classes`, {
    token: state.currentTutorProfile?.token
  });

  replaceTutorClasses(tutorId, payload?.classes || []);
  await preloadTutorAttendance(getClassesForTutorId(tutorId));
}

async function initializeTutorSession(tutor, token, activityMessage) {
  const storedTutor = upsertTutorProfile(tutor);

  state.isAdminUnlocked = false;
  state.currentAdminSession = null;
  setSessionAdminSession(null);
  setSessionAdminUnlocked(false);
  state.currentTutorProfile = {
    id: storedTutor.id,
    name: storedTutor.name,
    title: storedTutor.title,
    token: token || ""
  };
  state.currentTutorId = storedTutor.id;
  setSessionTutorSession(state.currentTutorProfile);
  await hydrateTutorWorkspace(storedTutor.id);
  state.selectedClassId = getClassesForTutorId(storedTutor.id)[0]?.id || null;
  addActivity(activityMessage || `${storedTutor.name} opened the tutor workspace.`);
}

async function initializeApp() {
  await checkApiHealth();

  if (isRemoteAdminSession()) {
    try {
      state.currentTutorProfile = null;
      state.currentTutorId = null;
      state.isAdminUnlocked = true;
      await loadAdminWorkspace();
    } catch (error) {
      console.error("Failed to restore admin session", error);
      state.currentAdminSession = null;
      state.isAdminUnlocked = false;
      setSessionAdminSession(null);
      adminAccessMessage.textContent = "Your saved admin session could not be restored. Sign in again.";
    }
    renderApp();
    return;
  }

  if (state.currentTutorId) {
    try {
      await hydrateTutorWorkspace(state.currentTutorId);
    } catch (error) {
      console.error("Failed to restore tutor session", error);
      state.currentTutorProfile = null;
      state.currentTutorId = null;
      setSessionTutorSession(null);
      loginMessage.textContent = "Your saved tutor session could not be restored. Sign in again.";
    }
  }

  renderApp();
}

async function handleLogin(event) {
  event.preventDefault();
  const loginId = document.getElementById("loginId").value.trim().toLowerCase();
  const loginPin = document.getElementById("loginPin").value.trim();
  loginMessage.textContent = "Signing in...";

  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        id: loginId,
        pin: loginPin
      }
    });

    loginMessage.textContent = "";
    await initializeTutorSession(response.tutor, response.token, `${response.tutor.name} opened the tutor workspace.`);
    renderApp();
    showToast(`Signed in as ${response.tutor.name}`);
  } catch (error) {
    loginMessage.textContent = error.message || "Unable to sign in to the backend right now.";
    return;
  }
}

async function handleAdminUnlock(event) {
  event.preventDefault();
  const submittedPin = document.getElementById("adminAccessPin").value.trim();
  adminAccessMessage.textContent = "Signing in...";

  try {
    const response = await apiRequest("/auth/admin/login", {
      method: "POST",
      body: {
        pin: submittedPin
      }
    });

    state.currentTutorId = null;
    state.currentTutorProfile = null;
    state.selectedClassId = null;
    setSessionTutorSession(null);
    state.currentAdminSession = { token: response.token };
    setSessionAdminSession(state.currentAdminSession);
    state.isAdminUnlocked = true;
    await loadAdminWorkspace();
    state.selectedAdminClassId = state.data.classes[0]?.id || null;
    adminAccessMessage.textContent = "";
    adminAccessForm.reset();
    renderApp();
    showToast("Admin workspace unlocked");
  } catch (error) {
    adminAccessMessage.textContent = error.message || "Admin sign-in failed.";
  }
}

async function loginAsDemo(tutorId) {
  const tutor = getTutorById(tutorId);
  if (!tutor) {
    return;
  }

  document.getElementById("loginId").value = tutor.id;
  document.getElementById("loginPin").value = tutor.pin || "";

  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        id: tutor.id,
        pin: tutor.pin || ""
      }
    });

    loginMessage.textContent = "";
    await initializeTutorSession(response.tutor, response.token, `${response.tutor.name} opened the tutor workspace via preview access.`);
    renderApp();
    showToast(`Loaded ${response.tutor.name}'s tutor view`);
  } catch (error) {
    loginMessage.textContent = error.message || "Preview sign-in failed.";
  }
}

function logout() {
  const tutor = getTutorById(state.currentTutorId);
  if (tutor) {
    addActivity(`${tutor.name} logged out.`);
  }
  state.currentTutorProfile = null;
  state.currentTutorId = null;
  state.selectedClassId = null;
  setSessionTutorSession(null);
  renderApp();
}

function logoutAdmin() {
  state.isAdminUnlocked = false;
  state.currentAdminSession = null;
  state.selectedAdminClassId = null;
  setSessionAdminSession(null);
  setSessionAdminUnlocked(false);
  renderApp();
}

function renderApp() {
  syncDataRelationships(state.data);
  renderAccountGrid();
  bannerApiBase.textContent = formatApiBaseUrl(API_BASE_URL);
  apiBaseUrlInput.value = API_BASE_URL;

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
  ensureAttendanceLoadedForDate(assignedClasses, state.selectedDateKey);
  welcomeHeading.textContent = `${tutor.name} · ${tutor.title}`;
  heroSummary.textContent = `${tutor.name} is viewing ${assignedClasses.length} tutor-scoped class${assignedClasses.length === 1 ? "" : "es"}. Class data, attendance reads, and attendance writes are all using the live backend.`;
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
  const isLoadingSession = isAttendanceSessionLoading(course.id, state.selectedDateKey);
  selectedClassTitle.textContent = course.name;
  selectedClassMeta.innerHTML = `
    <span class="meta-chip">${course.room}</span>
    <span class="meta-chip">${course.schedule}</span>
    <span class="meta-chip">${formatHumanDate(state.selectedDateKey)}</span>
    <span class="meta-chip">${Object.keys(session.records).length}/${course.students.length} marked</span>
    <span class="meta-chip">Average ${formatAverage(getClassAverage(course))}</span>
    ${isLoadingSession ? '<span class="meta-chip">Loading register...</span>' : ""}
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

async function updateAttendance(classId, studentId, status) {
  const course = state.data.classes.find((item) => item.id === classId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student) {
    return;
  }

  const dayKey = state.selectedDateKey;
  const session = ensureClassSession(classId, dayKey);
  const previousRecord = session.records[studentId] ? { ...session.records[studentId] } : null;
  const previousUpdatedAt = session.updatedAt;
  const existingRecord = session.records[studentId] || { note: "" };
  const nextRecord = {
    status,
    updatedAt: new Date().toISOString(),
    note: status === "absent" || status === "leave" ? existingRecord.note || "" : ""
  };
  session.records[studentId] = nextRecord;
  session.updatedAt = new Date().toISOString();
  addActivity(`${student.name} marked ${status} in ${course.name} for ${formatShortDate(state.selectedDateKey)}.`);
  saveData(`${student.name} marked ${status}`);
  renderApp();

  try {
    const savedRecord = await persistAttendanceRecord(classId, dayKey, studentId, nextRecord);
    session.records[studentId] = savedRecord;
    session.updatedAt = savedRecord.updatedAt || session.updatedAt;
    saveData();
    renderApp();
  } catch (error) {
    console.error(`Failed to save attendance for ${studentId} on ${dayKey}`, error);
    if (previousRecord) {
      session.records[studentId] = previousRecord;
    } else {
      delete session.records[studentId];
    }
    session.updatedAt = previousUpdatedAt || null;
    saveData();
    renderApp();
    showToast("Attendance save failed. The change was not written to the backend.");
  }
}

function updateStudentNote(classId, studentId, note) {
  const course = state.data.classes.find((item) => item.id === classId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student) {
    return;
  }

  const dayKey = state.selectedDateKey;
  const session = ensureClassSession(classId, dayKey);
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
  scheduleNoteSync(classId, dayKey, studentId);
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
  if (state.apiConnectionState === "online") {
    accountGrid.innerHTML = '<div class="admin-empty">Preview cards are disabled on the live handoff build. Tutors should sign in with their assigned credentials.</div>';
    return;
  }

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
          <div>${tutor.pin ? `Passcode: ${tutor.pin}` : "Passcode is hidden for backend-backed accounts"}</div>
          ${tutor.pin ? `<button type="button" class="button button--ghost" data-demo-login="${tutor.id}">Open preview</button>` : ""}
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

  adminHeading.textContent = "Attendance configuration studio";
  adminSummary.textContent = `The admin workspace currently holds ${state.data.tutors.length} tutor account${state.data.tutors.length === 1 ? "" : "s"}, ${state.data.classes.length} unit${state.data.classes.length === 1 ? "" : "s"}, and ${getTotalStudentCount()} student roster entries from the backend.`;
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
              <input data-field="pin" value="" placeholder="Leave blank to keep current password">
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

async function handleCreateTutor(event) {
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

  try {
    await apiRequest("/admin/tutors", {
      method: "POST",
      token: state.currentAdminSession?.token,
      body: { id, pin, name, title }
    });
    state.data.tutors.push({ id, pin, name, title, classIds: [] });
    await loadAdminWorkspace();
    createTutorForm.reset();
    createTutorMessage.textContent = "";
    renderApp();
    showToast(`Tutor ${name} created`);
  } catch (error) {
    createTutorMessage.textContent = error.message || "Tutor creation failed.";
  }
}

async function handleCreateUnit(event) {
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

  try {
    await apiRequest("/admin/units", {
      method: "POST",
      token: state.currentAdminSession?.token,
      body: { id, name, room, schedule, tutorId }
    });
    state.selectedAdminClassId = id;
    await loadAdminWorkspace();
    createUnitForm.reset();
    document.getElementById("createUnitSchedule").value = "Monday";
    createUnitMessage.textContent = "";
    renderApp();
    showToast(`Unit ${name} created`);
  } catch (error) {
    createUnitMessage.textContent = error.message || "Unit creation failed.";
  }
}

async function handleCreateStudent(event) {
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

  try {
    await apiRequest("/admin/students", {
      method: "POST",
      token: state.currentAdminSession?.token,
      body: {
        id: buildNextStudentId(course),
        name,
        unitId: course.id
      }
    });
    await loadAdminWorkspace();
    createStudentForm.reset();
    createStudentMessage.textContent = "";
    renderApp();
    showToast(`Student ${name} added to ${course.name}`);
  } catch (error) {
    createStudentMessage.textContent = error.message || "Student creation failed.";
  }
}

async function handleAdminPasswordUpdate(event) {
  event.preventDefault();
  const currentPin = document.getElementById("adminCurrentPin").value.trim();
  const nextPin = document.getElementById("adminNewPin").value.trim();
  const confirmPin = document.getElementById("adminConfirmPin").value.trim();

  if (!nextPin) {
    adminPasswordMessage.textContent = "New admin password cannot be empty.";
    return;
  }
  if (nextPin !== confirmPin) {
    adminPasswordMessage.textContent = "New password confirmation does not match.";
    return;
  }

  try {
    await apiRequest("/admin/settings/admin-password", {
      method: "PUT",
      token: state.currentAdminSession?.token,
      body: {
        currentPin,
        newPin: nextPin
      }
    });
    adminPasswordForm.reset();
    adminPasswordMessage.textContent = "";
    renderApp();
    showToast("Admin password updated");
  } catch (error) {
    adminPasswordMessage.textContent = error.message || "Admin password update failed.";
  }
}

function handleAdminUnitSelection(event) {
  state.selectedAdminClassId = event.target.value || null;
  renderApp();
}

async function saveTutor(tutorId, card) {
  const tutor = getTutorById(tutorId);
  if (!tutor || !card) {
    return;
  }

  const name = card.querySelector('[data-field="name"]').value.trim();
  const title = card.querySelector('[data-field="title"]').value.trim() || `Tutor · ${name}`;
  const pin = card.querySelector('[data-field="pin"]').value.trim();

  if (!name) {
    showToast("Tutor name is required");
    return;
  }

  try {
    tutor.name = name;
    tutor.title = title;
    if (pin) {
      tutor.pin = pin;
    }
    await apiRequest(`/admin/tutors/${encodeURIComponent(tutorId)}`, {
      method: "PUT",
      token: state.currentAdminSession?.token,
      body: { name, title, pin }
    });
    await loadAdminWorkspace();
    renderApp();
    showToast(`Tutor ${name} updated`);
  } catch (error) {
    showToast(error.message || "Tutor update failed");
  }
}

async function deleteTutor(tutorId) {
  const tutor = getTutorById(tutorId);
  if (!tutor) {
    return;
  }

  const confirmed = window.confirm(`Remove ${tutor.name}? Any assigned units will remain but become unassigned.`);
  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(`/admin/tutors/${encodeURIComponent(tutorId)}`, {
      method: "DELETE",
      token: state.currentAdminSession?.token
    });
    await loadAdminWorkspace();
    renderApp();
    showToast(`Tutor ${tutor.name} removed`);
  } catch (error) {
    showToast(error.message || "Tutor removal failed");
  }
}

async function saveUnit(unitId, card) {
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

  try {
    await apiRequest(`/admin/units/${encodeURIComponent(unitId)}`, {
      method: "PUT",
      token: state.currentAdminSession?.token,
      body: { name, room, schedule, tutorId }
    });
    await loadAdminWorkspace();
    renderApp();
    showToast(`Unit ${name} updated`);
  } catch (error) {
    showToast(error.message || "Unit update failed");
  }
}

async function deleteUnit(unitId) {
  const course = state.data.classes.find((item) => item.id === unitId);
  if (!course) {
    return;
  }

  const confirmed = window.confirm(`Remove ${course.name}? Stored attendance for this unit will also be removed locally.`);
  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(`/admin/units/${encodeURIComponent(unitId)}`, {
      method: "DELETE",
      token: state.currentAdminSession?.token
    });
    delete state.data.attendance[unitId];
    if (state.selectedAdminClassId === unitId) {
      state.selectedAdminClassId = null;
    }
    if (state.selectedClassId === unitId) {
      state.selectedClassId = null;
    }
    await loadAdminWorkspace();
    renderApp();
    showToast(`Unit ${course.name} removed`);
  } catch (error) {
    showToast(error.message || "Unit removal failed");
  }
}

async function saveStudent(unitId, studentId, card) {
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

  try {
    await apiRequest(`/admin/students/${encodeURIComponent(studentId)}`, {
      method: "PUT",
      token: state.currentAdminSession?.token,
      body: { name }
    });
    await loadAdminWorkspace();
    renderApp();
    showToast(`Student ${name} updated`);
  } catch (error) {
    showToast(error.message || "Student update failed");
  }
}

async function deleteStudent(unitId, studentId) {
  const course = state.data.classes.find((item) => item.id === unitId);
  const student = course?.students.find((item) => item.id === studentId);
  if (!course || !student) {
    return;
  }

  const confirmed = window.confirm(`Remove ${student.name} from ${course.name}?`);
  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(`/admin/students/${encodeURIComponent(studentId)}`, {
      method: "DELETE",
      token: state.currentAdminSession?.token
    });
    Object.values(state.data.attendance[unitId] || {}).forEach((session) => {
      delete session.records[studentId];
    });
    await loadAdminWorkspace();
    renderApp();
    showToast(`Student ${student.name} removed`);
  } catch (error) {
    showToast(error.message || "Student removal failed");
  }
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
