import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export function generatePdf(email, tasks) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(
      "/tmp",
      `ProgressReport_${email.replace("@", "_")}.pdf`
    );

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text("Student Progress Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("Student: " + email);
    doc.moveDown();

    Object.keys(tasks).forEach((activity) => {
      const t = tasks[activity];
      doc.text(
        `${activity}

Ticked: ${t.studentTick ? "Yes" : "No"} | ${t.studentTickDate || "-"}
Approved: ${t.supervisorApprove ? "Yes" : "No"} | ${
          t.supervisorApproveDate || "-"
        }

`
      );
    });

    doc.end();

    doc.on("finish", () => resolve(filePath));
    doc.on("error", reject);
  });
}
