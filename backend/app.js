// --------------------------------------------------------
// Load environment variables FIRST
// --------------------------------------------------------
import dotenv from "dotenv";
dotenv.config();

// --------------------------------------------------------
// Imports
// --------------------------------------------------------
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
import path from "path";

console.log("DEBUG — Checking routes directory:");
console.log("Routes folder exists:", fs.existsSync(path.resolve("routes")));
console.log("tasks.js exists:", fs.existsSync(path.resolve("routes/tasks.js")));

const app = express();

// --------------------------------------------------------
// CORS
// --------------------------------------------------------
app.use(
  cors({
    origin: [
      "https://ppbms-frontend.onrender.com",
      "http://localhost:3000"
    ],
    credentials: true,
  })
);

// --------------------------------------------------------
// Middleware
// --------------------------------------------------------
app.use(express.json());
app.use(cookieParser());

// --------------------------------------------------------
// Routers (SAFE IMPORT with error logs)
// --------------------------------------------------------
let apiRouter, studentRouter, supervisorRouter, authRouter, tasksRouter;

try {
  apiRouter = (await import("./routes/api.js")).default;
  console.log("✓ api.js loaded");
} catch (e) {
  console.error("❌ Failed to load api.js:", e);
}

try {
  studentRouter = (await import("./routes/student.js")).default;
  console.log("✓ student.js loaded");
} catch (e) {
  console.error("❌ Failed to load student.js:", e);
}

try {
  supervisorRouter = (await import("./routes/supervisor.js")).default;
  console.log("✓ supervisor.js loaded");
} catch (e) {
  console.error("❌ Failed to load supervisor.js:", e);
}

try {
  authRouter = (await import("./routes/auth.js")).default;
  console.log("✓ auth.js loaded");
} catch (e) {
  console.error("❌ Failed to load auth.js:", e);
}

try {
  tasksRouter = (await import("./routes/tasks.js")).default;
  console.log("✓ tasks.js loaded");
} catch (e) {
  console.error("❌ Failed to load tasks.js:", e);
}

// --------------------------------------------------------
// Register Routers
// --------------------------------------------------------
if (apiRouter) app.use("/api", apiRouter);
if (studentRouter) app.use("/api/student", studentRouter);
if (supervisorRouter) app.use("/api/supervisor", supervisorRouter);
if (authRouter) app.use("/auth", authRouter);
if (tasksRouter) app.use("/tasks", tasksRouter); // IMPORTANT

// --------------------------------------------------------
// Root test routes
// --------------------------------------------------------
app.get("/", (req, res) => {
  res.send("PPBMS Student Progress API is running");
});

app.get("/test-debug", (req, res) => {
  res.send("Backend updated & routes registered successfully");
});

app.get("/zz-test", (req, res) => {
  res.send("YES — backend code is running");
});

// --------------------------------------------------------
// 404 Handler
// --------------------------------------------------------
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

// --------------------------------------------------------
// LOG ALL REGISTERED ROUTES (FULL VERSION)
// --------------------------------------------------------
console.log("------- REGISTERED ENDPOINTS -------");

const listRoutes = (layer, basePath = "") => {
  if (layer.route) {
    const route = layer.route;
    const methods = Object.keys(route.methods)
      .map((m) => m.toUpperCase())
      .join(", ");
    console.log(`${methods}  ${basePath}${route.path}`);
  } else if (layer.name === "router" && layer.handle.stack) {
    layer.handle.stack.forEach((handler) =>
      listRoutes(handler, basePath + (layer.regexp?.source.replace("^\\/", "/") || ""))
    );
  }
};

app._router.stack.forEach((layer) => listRoutes(layer));

console.log("------------------------------------");

export default app;
