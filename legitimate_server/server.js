const express = require("express");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const debugRoutes = require("./routes/debugRoutes");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", debugRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🏦 LEGITIMATE SERVER running at http://localhost:${PORT}`);
  console.log(`   Login page:  http://localhost:${PORT}/`);
  console.log(`   Dashboard:   http://localhost:${PORT}/dashboard`);
  console.log(`   Sessions:    http://localhost:${PORT}/sessions\n`);
});
