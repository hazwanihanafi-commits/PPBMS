// backend/index.js

import app from "./app.js";
import cron from "node-cron";
import { generateExpectedTimeline } from "./cron/expectedTimeline.js";

const PORT = process.env.PORT || 10000;

// Prevent double-cron on Render (multiple instances)
let cronStarted = false;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);

  if (!cronStarted) {
    cronStarted = true;

    console.log("🕒 Setting up cron tasks...");

    // Run daily at 2:00 AM Malaysia time
    cron.schedule(
      "0 2 * * *",
      async () => {
        try {
          console.log("🔄 CRON START: Generating expected timeline...");
          await generateExpectedTimeline();
          console.log("✅ CRON DONE: Expected timeline updated.");
        } catch (err) {
          console.error("❌ CRON ERROR:", err.message);
        }
      },
      { timezone: "Asia/Kuala_Lumpur" }
    );

    console.log("📌 Cron initialized successfully.");
  }
});
