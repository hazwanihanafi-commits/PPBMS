// backend/index.js
import app from "./app.js";
import cron from "node-cron";
import { generateExpectedTimeline } from "./cron/expectedTimeline.mjs";

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Backend running on port " + PORT);

  // Start cron AFTER server starts
  console.log("Setting up cron tasks...");

  cron.schedule("0 2 * * *", async () => {
    console.log("Generating expected timeline...");
    await generateExpectedTimeline();
  });
});
