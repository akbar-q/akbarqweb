const PDF_FILE = "./Research Bulletin Directors Cut Draft.pdf";
const MOBILE_BREAKPOINT = 960;
const PDF_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const MAX_CANVAS_PIXELS = 3_000_000;

pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;

const elements = {
    app: document.querySelector(".viewer-app"),
    prevButton: document.getElementById("prevButton"),
    nextButton: document.getElementById("nextButton"),
    modeButton: document.getElementById("modeButton"),
    zoomSelect: document.getElementById("zoomSelect"),
    pageLabel: document.getElementById("pageLabel"),
    modeLabel: document.getElementById("modeLabel"),
    spreads: [document.getElementById("spreadA"), document.getElementById("spreadB")]
};

const state = {
    pdf: null,
    groups: [],
    groupIndex: 0,
    activeSpreadIndex: 0,
    zoom: "fit",
    userMode: "auto",
    isAnimating: false,
    resizeTimer: null
};

function getViewMode() {
    if (state.userMode === "single") {
        return "single";
    }

    if (state.userMode === "spread") {
        return window.innerWidth < MOBILE_BREAKPOINT ? "single" : "spread";
    }

    return window.innerWidth < MOBILE_BREAKPOINT ? "single" : "spread";
}

function syncViewModeClass() {
    elements.app.classList.toggle("is-single-page", getViewMode() === "single");
}

function buildGroups(pageCount, viewMode) {
    if (viewMode === "single") {
        return Array.from({ length: pageCount }, (_, index) => [null, index + 1]);
    }

    const groups = [[null, 1]];

    for (let pageNumber = 2; pageNumber <= pageCount; pageNumber += 2) {
        groups.push([pageNumber, pageNumber + 1 <= pageCount ? pageNumber + 1 : null]);
    }

    return groups;
}

function clampGroupIndex(index, groups) {
    return Math.max(0, Math.min(index, groups.length - 1));
}

function getCurrentPageNumbers() {
    return state.groups[state.groupIndex] || [null, null];
}

function describeGroup([leftPage, rightPage], totalPages) {
    const pages = [leftPage, rightPage].filter(Boolean);

    if (pages.length === 0) {
        return "Blank spread";
    }

    if (pages.length === 1) {
        return `Page ${pages[0]} of ${totalPages}`;
    }

    return `Pages ${pages[0]}-${pages[1]} of ${totalPages}`;
}

function updateControls() {
    const viewMode = getViewMode();
    const [leftPage, rightPage] = getCurrentPageNumbers();
    const pages = [leftPage, rightPage].filter(Boolean);

    syncViewModeClass();

    elements.prevButton.disabled = state.groupIndex === 0 || state.isAnimating;
    elements.nextButton.disabled = state.groupIndex === state.groups.length - 1 || state.isAnimating;
    elements.modeButton.disabled = !state.pdf || state.isAnimating;
    elements.zoomSelect.disabled = !state.pdf || state.isAnimating;
    elements.pageLabel.textContent = state.pdf
        ? describeGroup([leftPage, rightPage], state.pdf.numPages)
        : "Loading PDF...";
    elements.modeLabel.textContent = state.pdf
        ? `${viewMode === "spread" ? "Two-page spread" : "Single-page reading"} ${pages.length ? "• " + pages.join(" / ") : ""}`
        : "Preparing viewer";
    elements.modeButton.textContent = viewMode === "spread" ? "Single Page" : "Spread View";
}

function getSpreadSlots(spread) {
    return Array.from(spread.querySelectorAll(".page-slot"));
}

function parseAnimationTime(value) {
    if (!value) {
        return 0;
    }

    const trimmed = value.trim();

    if (trimmed.endsWith("ms")) {
        return Number.parseFloat(trimmed);
    }

    if (trimmed.endsWith("s")) {
        return Number.parseFloat(trimmed) * 1000;
    }

    return 0;
}

async function renderPageToSlot(pageNumber, slot, viewMode) {
    const canvas = slot.querySelector("canvas");
    const shell = slot.querySelector(".page-shell");

    if (!pageNumber) {
        slot.classList.add("is-empty");
        canvas.width = 0;
        canvas.height = 0;
        canvas.removeAttribute("style");
        return;
    }

    slot.classList.remove("is-empty");

    const page = await state.pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
    const paddingAllowance = 28;
    const availableWidth = Math.max(shell.clientWidth - paddingAllowance, 120);
    const availableHeight = Math.max(shell.clientHeight - paddingAllowance, 240);
    const fitScale = Math.min(availableWidth / baseViewport.width, availableHeight / baseViewport.height);
    const numericZoom = state.zoom === "fit" ? 1 : Number(state.zoom);
    let finalScale = fitScale * numericZoom;
    const estimatedPixels = baseViewport.width * finalScale * baseViewport.height * finalScale * dpr * dpr;

    if (estimatedPixels > MAX_CANVAS_PIXELS) {
        finalScale *= Math.sqrt(MAX_CANVAS_PIXELS / estimatedPixels);
    }

    const viewport = page.getViewport({ scale: finalScale });
    const context = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    await page.render({
        canvasContext: context,
        viewport,
        transform: dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0]
    }).promise;

    if (viewMode === "single") {
        slot.classList.toggle("is-empty", false);
    }
}

async function renderSpread(spread, groupIndex) {
    const slots = getSpreadSlots(spread);
    const viewMode = getViewMode();
    const [leftPage, rightPage] = state.groups[groupIndex] || [null, null];
    const pageNumbers = viewMode === "single" ? [null, rightPage] : [leftPage, rightPage];

    await Promise.all(slots.map((slot, index) => renderPageToSlot(pageNumbers[index], slot, viewMode)));
}

function waitForAnimation(element) {
    return new Promise((resolve) => {
        const computedStyle = window.getComputedStyle(element);
        const durations = computedStyle.animationDuration.split(",").map(parseAnimationTime);
        const delays = computedStyle.animationDelay.split(",").map(parseAnimationTime);
        const totalTime = Math.max(...durations.map((duration, index) => duration + (delays[index] || 0)), 0);

        if (computedStyle.animationName === "none" || totalTime === 0) {
            resolve();
            return;
        }

        let settled = false;
        const finish = () => {
            if (settled) {
                return;
            }

            settled = true;
            window.clearTimeout(timeoutId);
            element.removeEventListener("animationend", onEnd);
            resolve();
        };

        const onEnd = (event) => {
            if (event.target === element) {
                finish();
            }
        };

        const timeoutId = window.setTimeout(finish, totalTime + 120);

        element.addEventListener("animationend", onEnd, { once: true });
    });
}

async function showGroup(nextGroupIndex, direction = "next", animate = true) {
    if (!state.pdf || state.isAnimating) {
        return;
    }

    const targetIndex = clampGroupIndex(nextGroupIndex, state.groups);

    if (targetIndex === state.groupIndex && animate) {
        return;
    }

    const outgoing = elements.spreads[state.activeSpreadIndex];
    const incomingIndex = state.activeSpreadIndex === 0 ? 1 : 0;
    const incoming = elements.spreads[incomingIndex];

    state.isAnimating = true;
    syncViewModeClass();
    updateControls();
    await renderSpread(incoming, targetIndex);

    if (animate) {
        incoming.classList.add("is-active", direction === "next" ? "animating-next-in" : "animating-prev-in");
        outgoing.classList.add(direction === "next" ? "animating-next-out" : "animating-prev-out");
        void incoming.offsetWidth;
        void outgoing.offsetWidth;
        await Promise.all([waitForAnimation(incoming), waitForAnimation(outgoing)]);
        outgoing.className = "spread-layer";
        incoming.className = "spread-layer is-active";
    } else {
        outgoing.className = "spread-layer";
        incoming.className = "spread-layer is-active";
    }

    state.groupIndex = targetIndex;
    state.activeSpreadIndex = incomingIndex;
    state.isAnimating = false;
    updateControls();
}

function remapGroupIndex(previousPages) {
    if (!previousPages.length) {
        return 0;
    }

    const targetPage = previousPages[0];
    const nextIndex = state.groups.findIndex((group) => group.includes(targetPage));
    return nextIndex === -1 ? 0 : nextIndex;
}

async function rebuildGroups({ animate = false } = {}) {
    if (!state.pdf) {
        return;
    }

    const previousPages = getCurrentPageNumbers().filter(Boolean);
    state.groups = buildGroups(state.pdf.numPages, getViewMode());
    const nextIndex = clampGroupIndex(remapGroupIndex(previousPages), state.groups);

    state.groupIndex = nextIndex;
    await showGroup(nextIndex, "next", animate);
}

async function initializeViewer() {
    try {
        const loadingTask = pdfjsLib.getDocument(PDF_FILE);
        state.pdf = await loadingTask.promise;
        state.groups = buildGroups(state.pdf.numPages, getViewMode());
        state.groupIndex = 0;
        await showGroup(0, "next", false);
    } catch (error) {
        elements.pageLabel.textContent = "Unable to load PDF";
        elements.modeLabel.textContent = "Serve this folder over HTTP and confirm the PDF filename still matches.";
        console.error(error);
    }
}

elements.prevButton.addEventListener("click", () => {
    showGroup(state.groupIndex - 1, "prev", true);
});

elements.nextButton.addEventListener("click", () => {
    showGroup(state.groupIndex + 1, "next", true);
});

elements.modeButton.addEventListener("click", async () => {
    const currentView = getViewMode();
    state.userMode = currentView === "spread" ? "single" : "spread";
    await rebuildGroups();
    updateControls();
});

elements.zoomSelect.addEventListener("change", async (event) => {
    state.zoom = event.target.value;
    await showGroup(state.groupIndex, "next", false);
});

window.addEventListener("resize", () => {
    window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(() => {
        showGroup(state.groupIndex, "next", false);
        updateControls();
    }, 120);
});

window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
        event.preventDefault();
        showGroup(state.groupIndex - 1, "prev", true);
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();
        showGroup(state.groupIndex + 1, "next", true);
    }
});

updateControls();
initializeViewer();