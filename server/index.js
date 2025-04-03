const dotenv = require("dotenv");
const result = dotenv.config({path: './.env'});

console.log("dotenv result:", result);
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 5001;

console.log(process.env)

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => res.send("Timetable API running!"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
