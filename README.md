# Timetable App

This project is still a work in progress.
All changes are in the master branch

## To do list:
- User Interface and UX improvements
- Data Management and CRUD operations
- Session Tracking
- Calendar Improvements and Export
- Analytics and dashboard improvements
- Testing
- Deployment and CI/CD

A web application to help students generate personalized study timetables based on exam deadlines, study preferences, and exclusions. Users can review the generated timetable in a traditional calendar view and export it to Apple Calendar, Google Calendar, or other calendar apps via an ICS file.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup](#database-setup)
- [Running the App](#running-the-app)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Multi-Step Form:** Enter subjects, exam deadlines, study preferences, and exclusion dates.
- **Timetable Generation:** Automatically generate study sessions based on user inputs.
- **Dashboard:** View aggregated session data, a summarized timetable, and a traditional calendar view.
- **Export:** Generate an ICS file to export your timetable to external calendar apps.
- **Public Access:** No login/signup required—users simply navigate to the dashboard and begin using the app.

## Tech Stack

- **Frontend:** React.js, React Router v6
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Calendar Export:** ICS (npm package)

## Prerequisites

- Node.js (v14 or higher)
- npm (or yarn)
- PostgreSQL (v12 or higher)
- Git

## Installation

### Backend Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/timetable-app.git
   cd timetable-app/server

2. **Install backend dependencies**
   ```bash
   npm install

3. **Set up environment variables**
   Create a .env file in the server folder.

   ```.env
   PORT=5001
   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/timetable_db
   JWT_SECRET=your_jwt_secret

4. **Database Setup**
   - Ensure PostgreSQL is installed and running
   - Create a new database:

  ```bash
  createdb timetable_db
  ```
  run the provided schema file to set up the tables:
  ```bash
  psql -d timetable_db -f schema.sql
  ```

5. ***Frontend Setup***
   In server directory:
   ```bash
   npm start
   ```
   In client directory:
   npm start

## Usage
Dashboard:
When users navigate to the app, they are taken directly to the Dashboard.

The Dashboard displays aggregated session data and any previously saved sessions.

A "Generate Timetable" button redirects users to a multi-step form.

Multi-Step Form:

Step 1: Enter subjects and exam dates.

Step 2: Enter study preferences (study days per week, hours per day, start/end times).

Step 3: Enter exclusion dates and reasons.

On submitting the form, the app calls the timetable generation endpoint, saves the generated timetable in local storage, and redirects back to the Dashboard.

Saving Timetable:
If a generated timetable exists, the Dashboard shows a "Save Timetable" button, which persists the sessions to the database.

Calendar Export:
Users can export their saved sessions to an ICS file by clicking the "Export Timetable" button.

Automatic Clearing:
The app is configured to clear all sessions from the database on each page refresh (for demo purposes).


## Environment Variables
Backend (.env):

PORT - The port your server will run on (default: 5001)

DATABASE_URL - Connection string for your PostgreSQL database

JWT_SECRET - Secret key for JSON Web Tokens

Frontend (.env):

REACT_APP_API_URL - Base URL for your backend API (e.g., http://localhost:5001/api)


