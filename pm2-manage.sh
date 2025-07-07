#!/bin/bash

# PM2 Management Script for TimeCraft

show_menu() {
    echo ""
    echo "=== TimeCraft PM2 Management ==="
    echo ""
    echo "1. Show PM2 status"
    echo "2. Show logs (all)"
    echo "3. Show frontend logs only"
    echo "4. Show backend logs only"
    echo "5. Restart all services"
    echo "6. Stop all services"
    echo "7. Start all services"
    echo "8. Delete all services"
    echo "9. Real-time monitoring"
    echo "0. Exit"
    echo ""
}

while true; do
    show_menu
    read -p "Choose an option (0-9): " choice
    
    case $choice in
        1)
            echo ""
            echo "=== PM2 Status ==="
            pm2 status
            read -p "Press Enter to continue..."
            ;;
        2)
            echo ""
            echo "=== All Logs (Press Ctrl+C to exit) ==="
            pm2 logs
            ;;
        3)
            echo ""
            echo "=== Frontend Logs (Press Ctrl+C to exit) ==="
            pm2 logs timecraft-frontend
            ;;
        4)
            echo ""
            echo "=== Backend Logs (Press Ctrl+C to exit) ==="
            pm2 logs timecraft-backend
            ;;
        5)
            echo ""
            echo "=== Restarting Services ==="
            pm2 restart ecosystem.config.js
            echo "Services restarted."
            read -p "Press Enter to continue..."
            ;;
        6)
            echo ""
            echo "=== Stopping Services ==="
            pm2 stop ecosystem.config.js
            echo "Services stopped."
            read -p "Press Enter to continue..."
            ;;
        7)
            echo ""
            echo "=== Starting Services ==="
            pm2 start ecosystem.config.js
            echo "Services started."
            read -p "Press Enter to continue..."
            ;;
        8)
            echo ""
            read -p "Are you sure you want to delete all PM2 services? (y/N): " confirm
            if [[ $confirm == [yY] ]]; then
                pm2 delete ecosystem.config.js
                echo "Services deleted."
            else
                echo "Operation cancelled."
            fi
            read -p "Press Enter to continue..."
            ;;
        9)
            echo ""
            echo "=== Real-time Monitoring (Press Ctrl+C to exit) ==="
            pm2 monit
            ;;
        0)
            echo ""
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            read -p "Press Enter to continue..."
            ;;
    esac
done
