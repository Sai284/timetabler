const express = require("express");
const router = express.Router();
const pool = require("../db");
const { createEvents } = require("ics");

// Default user id
const DEFAULT_USER_ID = 1;

//public route
router.get("/profile", (req, res) => {
  res.json({ message: "Public profile route", user: { id: DEFAULT_USER_ID } });
});

// Subjects endpoints
router.post("/subjects", async (req, res) => {
  const { name, exam_date } = req.body;
  try {
    const newSubject = await pool.query(
      "INSERT INTO subjects (user_id, name, exam_date) VALUES ($1, $2, $3) RETURNING *",
      [DEFAULT_USER_ID, name, exam_date]
    );
    res.json(newSubject.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/subjects", async (req, res) => {
  try {
    const subjects = await pool.query(
      "SELECT * FROM subjects WHERE user_id = $1",
      [DEFAULT_USER_ID]
    );
    res.json(subjects.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Preferences endpoints
router.post("/preferences", async (req, res) => {
  const { study_days_per_week, hours_per_day, start_time, end_time } = req.body;
  try {
    // Check if preferences already exist
    const existing = await pool.query(
      "SELECT * FROM study_preferences WHERE user_id = $1",
      [DEFAULT_USER_ID]
    );
    if (existing.rows.length > 0) {
      // Update the existing record
      const updated = await pool.query(
        "UPDATE study_preferences SET study_days_per_week = $1, hours_per_day = $2, start_time = $3, end_time = $4 WHERE user_id = $5 RETURNING *",
        [study_days_per_week, hours_per_day, start_time, end_time, DEFAULT_USER_ID]
      );
      res.json(updated.rows[0]);
    } else {
      // Insert a new record
      const newPref = await pool.query(
        "INSERT INTO study_preferences (user_id, study_days_per_week, hours_per_day, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [DEFAULT_USER_ID, study_days_per_week, hours_per_day, start_time, end_time]
      );
      res.json(newPref.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/preferences", async (req, res) => {
  try {
    const preferencesResult = await pool.query(
      "SELECT * FROM study_preferences WHERE user_id = $1",
      [DEFAULT_USER_ID]
    );
    if (preferencesResult.rows.length === 0) {
      return res.status(404).json({ error: "Study preferences not found."});
    }
    res.json(preferencesResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exclusions endpoints
router.post("/exclusions", async (req, res) => {
  const { date, reason } = req.body;
  try {
    const newExclusion = await pool.query(
      "INSERT INTO exclusions (user_id, date, reason) VALUES ($1, $2, $3) RETURNING *",
      [DEFAULT_USER_ID, date, reason]
    );
    res.json(newExclusion.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/exclusions", async (req, res) => {
  try {
    const exclusions = await pool.query(
      "SELECT * FROM exclusions WHERE user_id = $1",
      [DEFAULT_USER_ID]
    );
    res.json(exclusions.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sessions endpoints
router.post("/sessions", async (req, res) => {
  const { subject_id, session_date, start_time, end_time } = req.body;
  try {
    const newSession = await pool.query(
      "INSERT INTO study_sessions (user_id, subject_id, session_date, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [DEFAULT_USER_ID, subject_id, session_date, start_time, end_time]
    );
    res.json({ session: newSession.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/sessions", async (req, res) => {
  try {
    const sessionsResult = await pool.query(
      "SELECT * FROM study_sessions WHERE user_id = $1 ORDER BY session_date",
      [DEFAULT_USER_ID]
    );
    res.json({ sessions: sessionsResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/sessions/:id", async (req, res) => {
  const sessionId = req.params.id;
  const { completed } = req.body;
  try {
    const updateResult = await pool.query(
      "UPDATE study_sessions SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [completed, sessionId, DEFAULT_USER_ID]
    );
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Session not found or unauthorized" });
    }
    res.json({ session: updateResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Timetable Generation Endpoint
router.get("/timetable", async (req, res) => {
  try {
    // Fetch subjects for default user
    const subjectsResult = await pool.query(
      "SELECT * FROM subjects WHERE user_id = $1",
      [DEFAULT_USER_ID]
    );
    const subjects = subjectsResult.rows;

    // Fetch study preferences
    const preferencesResult = await pool.query(
      "SELECT * FROM study_preferences WHERE user_id = $1",
      [DEFAULT_USER_ID]
    );
    const preferences = preferencesResult.rows[0];
    if (!preferences) {
      return res.status(400).json({ error: "Study preferences not set." });
    }

    // Fetch exclusions and convert them to YYYY-MM-DD
    const exclusionsResult = await pool.query(
      "SELECT date FROM exclusions WHERE user_id = $1",
      [DEFAULT_USER_ID]
    );
    const exclusions = exclusionsResult.rows.map(row =>
      new Date(row.date).toISOString().split("T")[0]
    );

    // Parse available times
    const [startHour, startMinute] = preferences.start_time.split(":").map(Number);
    const [endHour, endMinute] = preferences.end_time.split(":").map(Number);
    const availableStart = startHour + startMinute / 60;
    const availableEnd = endHour + endMinute / 60;
    const availableDuration = availableEnd - availableStart;
    const breakTime = 1; // fixed break of 1 hour

    // Determine maximum exam date among subjects
    const maxExamDate = new Date(Math.max(...subjects.map(s => new Date(s.exam_date))));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let timetable = [];

    // Iterate over each day from today to maxExamDate
    for (let d = new Date(today); d <= maxExamDate; d.setDate(d.getDate() + 1)) {
      const currentDateString = d.toISOString().split("T")[0];
      if (exclusions.includes(currentDateString)) continue;

      // Filter subjects with exam dates on or after the current day
      const subjectsForDay = subjects.filter(s => new Date(s.exam_date) >= d);
      const N = subjectsForDay.length;
      if (N === 0) continue;

      const sessionDuration = (availableDuration - (N - 1) * breakTime) / N;

      const formatTime = (timeFloat) => {
        const h = Math.floor(timeFloat);
        const m = Math.floor((timeFloat - h) * 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      };

      for (let i = 0; i < N; i++) {
        const subject = subjectsForDay[i];
        const sessionStart = availableStart + i * (sessionDuration + breakTime);
        const sessionEnd = sessionStart + sessionDuration;
        timetable.push({
          date: currentDateString,
          subject: subject.name,
          start_time: formatTime(sessionStart),
          end_time: formatTime(sessionEnd)
        });
      }
    }

    res.json({ timetable });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: format a Date to numbers for ICS
const parseDateTime = (dateInput, timeInput) => {
  let dateStr = typeof dateInput === 'string' 
    ? dateInput 
    : new Date(dateInput).toISOString().split('T')[0];
    
  let timeStr = typeof timeInput === 'string' 
    ? timeInput 
    : new Date(`1970-01-01T${timeInput}`).toLocaleTimeString('en-GB', { hour12: false });
  
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  
  return [year, month, day, hour, minute];
};

router.get("/export-timetable", async (req, res) => {
  try {
    // Query study sessions for default user.
    const sessionsResult = await pool.query(
      `SELECT ss.*, s.name AS subject_name
       FROM study_sessions ss
       JOIN subjects s ON ss.subject_id = s.id
       WHERE ss.user_id = $1
       ORDER BY ss.session_date`,
      [DEFAULT_USER_ID]
    );
    const sessions = sessionsResult.rows;

    const events = sessions.map((session) => {
      const start = parseDateTime(session.session_date, session.start_time);
      const end = parseDateTime(session.session_date, session.end_time);
      return {
        title: session.subject_name,
        start,
        end,
        description: session.completed ? "Study session completed" : "Study session pending",
        status: session.completed ? "CONFIRMED" : "TENTATIVE",
      };
    });

    createEvents(events, (error, value) => {
      if (error) {
        console.error("ICS generation error:", error);
        return res.status(500).json({ error: error.message });
      }
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=timetable.ics");
      res.send(value);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard endpoint - Aggregated study session data
router.get("/dashboard", async (req, res) => {
  try {
    const sessionsResult = await pool.query(
      `SELECT ss.*, s.name as subject_name
       FROM study_sessions ss
       LEFT JOIN subjects s ON ss.subject_id = s.id
       WHERE ss.user_id = $1
       ORDER BY ss.session_date`,
      [DEFAULT_USER_ID]
    );
    const sessions = sessionsResult.rows;
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completed).length;
    const pendingSessions = totalSessions - completedSessions;
    
    res.json({
      totalSessions,
      completedSessions,
      pendingSessions,
      sessions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save timetable endpoint - Save generated sessions to study_sessions table
router.post("/save-timetable", async (req, res) => {
  const sessions = req.body.sessions;
  try {
    for (let session of sessions) {
      const subjectResult = await pool.query(
        "SELECT id FROM subjects WHERE user_id = $1 AND name = $2",
        [DEFAULT_USER_ID, session.subject]
      );
      
      if (subjectResult.rows.length === 0) continue;
      
      const subjectId = subjectResult.rows[0].id;
      
      await pool.query(
        `INSERT INTO study_sessions (user_id, subject_id, session_date, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, subject_id, session_date, start_time, end_time) DO NOTHING`,
        [DEFAULT_USER_ID, subjectId, session.date, session.start_time, session.end_time]
      );
    }
    res.json({ message: "Timetable sessions saved successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/clear-sessions", async (req, res) => {
  try {
    await pool.query("DELETE FROM study_sessions WHERE user_id = $1", [DEFAULT_USER_ID]);
    res.json({ message: "All study sessions cleared." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
