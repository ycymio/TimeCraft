# TimeCraft

TimeCraft is a time tracking app UI that helps you visualize how you spend your time daily. Activities are categorized (e.g., meetings, feature work, emails, discussions) and displayed in a modern, interactive dashboard.

## Features
- Visualize daily time allocation by category
- Categories: Meetings, Feature Work, Emails, Discussions, and more
- Built with React, TypeScript, and Vite
- Local file-based data storage using CSV and JSON formats
- File format validation to ensure data integrity

## Data Files and Format Requirements

TimeCraft uses local files to store your data. You need to select a folder containing the following files with the correct formats:

### Required Files

#### 1. `activities.csv`
Stores your daily time tracking activities.

**Required columns:** `Start`, `End`, `Category`, `Details`

**Example:**
```csv
Start,End,Category,Details
2025/07/07 09:00,2025/07/07 10:30,Meetings,Team standup meeting
2025/07/07 10:30,2025/07/07 12:00,Feature Work,Implementing user authentication
2025/07/07 14:00,2025/07/07 14:30,Emails,Responding to client emails
```

**Notes:**
- Date format: `YYYY/MM/DD HH:mm`
- Columns can be in any order, but all four must be present
- Details field is optional but the column must exist

#### 2. `categories.json`
Defines the available activity categories and their colors.

**Format:** Array of objects with `name` and `color` fields

**Example:**
```json
[
  {"name": "Meetings", "color": "#FF6B6B"},
  {"name": "Feature Work", "color": "#4ECDC4"},
  {"name": "Emails", "color": "#45B7D1"},
  {"name": "Discussions", "color": "#96CEB4"},
  {"name": "Free Time", "color": "#FECA57"}
]
```

#### 3. `todos.csv`
Stores your todo list items.

**Required column:** `Text`

**Example:**
```csv
Text
Review pull request #123
Update project documentation
Schedule team meeting
```

#### 4. `daily_ideas.csv`
Stores daily ideas and notes.

**Required columns:** `Date`, `Idea`

**Example:**
```csv
Date,Idea
2025-07-07,Implement dark mode for better user experience
2025-07-07,Add export functionality for time reports
2025-07-06,Consider adding mobile app version
```

**Notes:**
- Date format: `YYYY-MM-DD`
- Columns can be in any order, but both must be present

### File Format Validation

When you select a data folder, TimeCraft will automatically validate:
- All required files are present
- CSV files have the correct column headers
- JSON files have valid structure
- Categories have required `name` and `color` fields

If validation fails, you'll see detailed error messages explaining what needs to be fixed.

## Getting Started

### Prerequisites
1. Install dependencies:
   ```sh
   npm install
   ```

### Setting Up Data Files
1. Create a folder for your TimeCraft data
2. Create the required files in that folder (see "Data Files and Format Requirements" above)
3. You can start with empty files that have just the headers

### Running the Application
1. Start the development server:
   ```sh
   npm run dev
   ```
2. Open your browser and navigate to the displayed URL
3. Select your data folder when prompted
4. Start tracking your time!

## Future Enhancements
- Enhanced data visualization and charts
- Export reports to different formats
- Time tracking statistics and insights
- Data backup and sync options
- Mobile-responsive design improvements

## Technical Details
- **Frontend:** React 18 with TypeScript
- **Build Tool:** Vite
- **Data Storage:** Local CSV and JSON files
- **File Access:** File System Access API (modern browsers)

---

This project was bootstrapped with [Vite](https://vitejs.dev/).
# VibeCoding
