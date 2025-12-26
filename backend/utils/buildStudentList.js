import { readMasterTracking } from "../services/googleSheets.js";
import buildTimelineForRow from "./buildTimeline.js";

export async function buildStudentList(user, sheetId) {
  const rows = await readMasterTracking(sheetId);

  const loginEmail = (user.email || "")
    .toLowerCase()
    .replace(/\s+/g, "");

  return rows
    .filter(r => {
      if (user.role === "admin") return true;

      const supervisorEmail = (r["Main Supervisor's Email"] || "")
        .toLowerCase()
        .replace(/\s+/g, "");

      return supervisorEmail.includes(loginEmail);
    })
    .map(r => {
      const timeline = buildTimelineForRow(r);
      const completed = timeline.filter(t => t.status === "Completed").length;

      return {
        id: r["Matric"] || "",
        name: r["Student Name"] || "",
        email: (r["Student's Email"] || "").toLowerCase().trim(),
        programme: r["Programme"] || "",
        field: r["Field"] || "",
        status: r["Status"] || "Active",
        progressPercent: timeline.length
          ? Math.round((completed / timeline.length) * 100)
          : 0
      };
    });
}
