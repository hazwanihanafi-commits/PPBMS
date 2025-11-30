// File: frontend/utils/calcProgress.js
{ key: "Phase 2 Data Collection Continued", label: "Phase 2 Data Collection Continued", mandatory: true },
{ key: "Seminar Completed", label: "Seminar Completed", mandatory: true },
{ key: "Thesis Draft Completed", label: "Thesis Draft Completed", mandatory: true },
{ key: "Internal Evaluation Completed", label: "Internal Evaluation Completed", mandatory: true },
{ key: "Viva Voce", label: "Viva Voce", mandatory: true },
{ key: "Corrections Completed", label: "Corrections Completed", mandatory: true },
{ key: "Final Thesis Submission", label: "Final Thesis Submission", mandatory: true }
];


// PhD plan (17 items)
export const PHD_PLAN = [
{ key: "Development Plan & Learning Contract", label: "Development Plan & Learning Contract", mandatory: true },
{ key: "Master Research Timeline (Gantt)", label: "Master Research Timeline (Gantt)", mandatory: false },
{ key: "Research Logbook (Weekly)", label: "Research Logbook (Weekly)", mandatory: false },
{ key: "Proposal Defense Endorsed", label: "Proposal Defense Endorsed", mandatory: true },
{ key: "Pilot / Phase 1 Completed", label: "Pilot / Phase 1 Completed", mandatory: true },
{ key: "Annual Progress Review (Year 1)", label: "Annual Progress Review (Year 1)", mandatory: true },
{ key: "Phase 2 Completed", label: "Phase 2 Completed", mandatory: true },
{ key: "Seminar Completed", label: "Seminar Completed", mandatory: true },
{ key: "Data Analysis Completed", label: "Data Analysis Completed", mandatory: true },
{ key: "1 Journal Paper Submitted", label: "1 Journal Paper Submitted", mandatory: true },
{ key: "Conference Presentation", label: "Conference Presentation", mandatory: true },
{ key: "Annual Progress Review (Year 2)", label: "Annual Progress Review (Year 2)", mandatory: true },
{ key: "Thesis Draft Completed", label: "Thesis Draft Completed", mandatory: true },
{ key: "Internal Evaluation Completed", label: "Internal Evaluation Completed", mandatory: true },
{ key: "Viva Voce", label: "Viva Voce", mandatory: true },
{ key: "Corrections Completed", label: "Corrections Completed", mandatory: true },
{ key: "Final Thesis Submission", label: "Final Thesis Submission", mandatory: true }
];


// Calculate progress using selected plan (returns percentage and item breakdown)
export function calculateProgress(rawRow = {}, programmeText = "") {
const lower = (programmeText || "").toLowerCase();
const plan = (lower.includes("msc") || lower.includes("master")) ? MSC_PLAN : PHD_PLAN;


const items = plan.map((it) => ({ ...it, done: isTicked(rawRow, it.key) }));
const doneCount = items.filter(i => i.done).length;
const total = items.length;
const percentage = total ? Math.round((doneCount / total) * 100) : 0;


return { percentage, doneCount, total, items };
}


// Backwards-compatible helper: calculateProgressFrom12 (if you previously used 12-item list)
export const ACTIVITIES_12 = [
"P1 Submitted",
"P3 Submitted",
"P4 Submitted",
"P5 Submitted",
"Thesis Draft Completed",
"Ethical clearance obtained",
"Pilot or Phase 1 completed",
"Progress approved",
"Seminar & report submitted",
"Phase 2 completed",
"1 indexed paper submitted",
"Conference presentation"
];


export function calculateProgressFrom12(rawRow = {}) {
const activities = ACTIVITIES_12;
const done = activities.filter(a => isTicked(rawRow, a)).length;
const total = activities.length;
const percentage = total ? Math.round((done / total) * 100) : 0;
return { done, total, percentage };
}

