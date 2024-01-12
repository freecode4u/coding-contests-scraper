const express = require("express");
const cors = require("cors");
const ScheduledTask = require("./utils/scapingSchedule");
const router = require("./routes/contests.router");
const app = express();

require("dotenv").config();

app.use(cors());
app.use("/api/v1", router);
router.use((req, res) => {
  res.status(404).json({ message: "Invalid route" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
