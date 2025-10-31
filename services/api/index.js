const express = require("express");
const app = express();
const searchRoutes = require("./routes/search");

const PORT = 3000;

// Use your search routes
app.use("/", searchRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
