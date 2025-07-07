# TimeCraft - Time Tracking App

A modern time tracking application built with React, TypeScript, and Node.js.

## Running in Virtual Machine

### Prerequisites

1. **Node.js** (v18 or higher)
   - Ubuntu/Debian: `sudo apt update && sudo apt install nodejs npm`
   - CentOS/RHEL: `sudo yum install nodejs npm`
   - Windows: Download from [nodejs.org](https://nodejs.org/)

### Quick Setup

#### For Linux/macOS VM:
```bash
# Make scripts executable
chmod +x setup-vm.sh start-app.sh

# Run setup
./setup-vm.sh

# Start the application
./start-app.sh
```

#### For Windows VM:
```batch
# Run setup
setup-vm.bat

# Start the application
start-app.bat
```

### Manual Setup

If you prefer to run commands manually:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the frontend application:**
   ```bash
   npm run dev
   ```

### Access the Application

- **Application UI:** http://localhost:5173

### Application Features

- Daily activity tracking
- Categories: meetings, feature work, emails, discussions, etc.
- Data visualization with charts
- Local file integration for data storage
- Material-UI for modern interface

### Project Structure

```
TimeCraft/
├── src/                    # React frontend source
├── data/                   # CSV data files
├── public/                 # Static assets
├── package.json           # Dependencies
├── setup-vm.sh/.bat       # Setup scripts
└── start-app.sh/.bat      # Application start scripts
```

### Troubleshooting

1. **Port already in use:**
   - Frontend (5173): Stop any other Vite dev servers

2. **Dependencies issues:**
   - Delete `node_modules` folder
   - Run `npm install` again

3. **Permission issues (Linux/macOS):**
   - Make scripts executable: `chmod +x *.sh`

4. **Firewall in VM:**
   - Ensure ports 3001 and 5173 are accessible
   - For external access, configure VM network settings

### Development

- **Lint code:** `npm run lint`
- **Build for production:** `npm run build`
- **Preview production build:** `npm run preview`

---

For any issues, check the console output in both terminal windows.
