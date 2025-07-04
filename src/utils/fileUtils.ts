import dayjs from 'dayjs';

// Types for our local file-based application
interface Activity {
  category: string;
  start?: string | any; // Can be string or dayjs object
  end?: string | any;   // Can be string or dayjs object
  details?: string;
}

interface CategoryDef {
  name: string;
  color: string;
}

// CSV parser with proper handling of quoted fields and escape sequences for local files
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  return lines.map(line => {
    if (line.trim() === '') return [];
    
    const result: string[] = [];
    let currentField = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = i < line.length - 1 ? line[i + 1] : '';
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Handle escaped quotes (two double quotes in a row)
          currentField += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(currentField);
        currentField = "";
      } else {
        // Regular character
        currentField += char;
      }
    }
    
    // Add the last field
    result.push(currentField);
    return result;
  }).filter(row => row.length > 0); // Skip empty rows
}

// Function to read activities from local CSV file
export async function readActivities(dirHandle: FileSystemDirectoryHandle, dateStr?: string): Promise<Activity[]> {
  try {
    const fileHandle = await dirHandle.getFileHandle('activities.csv');
    const file = await fileHandle.getFile();
    const text = await file.text();
    
    const rows = parseCSV(text);
    if (rows.length <= 1) return []; // Just header or empty
    
    const header = rows[0];
    // Find column indexes in header with format: Category,Start,End,Details
    const categoryIdx = header.findIndex(h => h === 'Category');
    const startIdx = header.findIndex(h => h === 'Start');
    const endIdx = header.findIndex(h => h === 'End');
    const detailsIdx = header.findIndex(h => h === 'Details');
    
    let activities = rows.slice(1).filter(row => row.length >= 3).map(row => {
      const category = row[categoryIdx];
      const startStr = row[startIdx];
      const endStr = row[endIdx];
      const details = row[detailsIdx] || '';
      
      // Return string dates as they are - they'll be parsed when needed
      return {
        category,
        start: startStr,
        end: endStr,
        details
      };
    });
    
    // Filter by date if provided
    if (dateStr) {
      const targetDate = dayjs(dateStr);
      activities = activities.filter(a => {
        if (!a.start) return false;
        // Handle different date formats
        const actDate = dayjs(a.start);
        return actDate.format('YYYY-MM-DD') === targetDate.format('YYYY-MM-DD');
      });
    }
    
    return activities;
  } catch (error) {
    console.error('Error reading activities:', error);
    return [];
  }
}

// Function to read categories from local JSON file
export async function readCategories(dirHandle: FileSystemDirectoryHandle): Promise<CategoryDef[]> {
  try {
    const fileHandle = await dirHandle.getFileHandle('categories.json');
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error reading categories:', error);
    return [];
  }
}

// Function to read todos from local CSV file
export async function readTodos(dirHandle: FileSystemDirectoryHandle): Promise<string[]> {
  try {
    const fileHandle = await dirHandle.getFileHandle('todos.csv');
    const file = await fileHandle.getFile();
    const text = await file.text();
    
    const rows = parseCSV(text);
    if (rows.length <= 1) return []; // Just header or empty
    
    // Skip header and get the first column (Text)
    return rows.slice(1)
      .filter(row => row.length > 0 && row[0].trim() !== '')
      .map(row => row[0]);
  } catch (error) {
    console.error('Error reading todos:', error);
    return [];
  }
}

// Function to read ideas from local CSV file
export async function readIdeas(dirHandle: FileSystemDirectoryHandle, dateStr?: string): Promise<any[]> {
  try {
    const fileHandle = await dirHandle.getFileHandle('daily_ideas.csv');
    const file = await fileHandle.getFile();
    const text = await file.text();
    
    const rows = parseCSV(text);
    if (rows.length <= 1) return []; // Just header or empty
    
    const header = rows[0];
    const dateIdx = header.findIndex(h => h === 'Date');
    const ideaIdx = header.findIndex(h => h === 'Idea');
    
    let ideas = rows.slice(1)
      .filter(row => row.length >= 2 && row[ideaIdx].trim() !== '')
      .map(row => ({
        Date: row[dateIdx],
        Idea: row[ideaIdx]
      }));
    
    // Filter by date if provided
    if (dateStr) {
      ideas = ideas.filter(idea => idea.Date === dateStr);
    }
    
    return ideas;
  } catch (error) {
    console.error('Error reading ideas:', error);
    return [];
  }
}

// Function to write new activity to local CSV file
export async function saveActivity(dirHandle: FileSystemDirectoryHandle, activity: Activity): Promise<boolean> {
  try {
    // Properly escape CSV fields
    const escapeCSV = (field: string = '') => {
      // If field contains comma, newline or quote, wrap in quotes and escape any quotes
      if (field.includes(',') || field.includes('\n') || field.includes('"')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    
    // Try to get existing file or create a new one
    let fileHandle: FileSystemFileHandle;
    try {
      fileHandle = await dirHandle.getFileHandle('activities.csv');
    } catch (error) {
      // File doesn't exist, create it
      fileHandle = await dirHandle.getFileHandle('activities.csv', { create: true });
    }
    
    // Read existing content to check header
    let existingContent = '';
    let needsHeader = false;
    
    try {
      const file = await fileHandle.getFile();
      existingContent = await file.text();
      
      // Check if header exists and is correct
      const lines = existingContent.split(/\r?\n/);
      if (lines.length === 0 || !lines[0].includes('Category') || 
          !lines[0].includes('Start') || !lines[0].includes('End')) {
        needsHeader = true;
      }
    } catch (error) {
      // New file or can't read it
      needsHeader = true;
    }
    
    // Create writable for the file
    const writable = await fileHandle.createWritable();
    
    // Create new content with proper header if needed
    let newContent = '';
    
    if (needsHeader) {
      newContent = 'Category,Start,End,Details\n';
    } else {
      newContent = existingContent;
    }
    
    // Format the new row with proper CSV escaping
    const formatDate = (dateValue?: any) => {
      if (!dateValue) return '';
      
      // Handle both string dates and dayjs objects
      const date = typeof dateValue === 'string' ? dayjs(dateValue) : dateValue;
      
      // Check if it's a valid dayjs object
      if (date && typeof date.format === 'function') {
        return date.format('YYYY/MM/DD HH:mm');
      }
      
      // Fallback for string values that are already in the correct format
      return dateValue;
    };
    
    const newRow = `${escapeCSV(activity.category)},${escapeCSV(formatDate(activity.start))},${escapeCSV(formatDate(activity.end))},${escapeCSV(activity.details)}`;
    
    // Append new row (ensure proper line ending)
    if (newContent.endsWith('\n') || newContent === '') {
      newContent += newRow;
    } else {
      newContent += '\n' + newRow;
    }
    
    // Add trailing newline
    if (!newContent.endsWith('\n')) {
      newContent += '\n';
    }
    
    // Write the updated content
    await writable.write(newContent);
    await writable.close();
    
    console.log('Activity saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving activity:', error);
    return false;
  }
}

// Function to add a new idea to local CSV file
export async function saveIdea(dirHandle: FileSystemDirectoryHandle, dateStr: string, idea: string): Promise<boolean> {
  try {
    const fileHandle = await dirHandle.getFileHandle('daily_ideas.csv');
    // Need writable access
    const writable = await fileHandle.createWritable({ keepExistingData: true });
    
    // First read existing content
    const file = await fileHandle.getFile();
    const text = await file.text();
    
    // Parse and check if header exists
    const rows = text.split(/\r?\n/);
    let newContent = text;
    
    if (rows.length === 0 || !rows[0].includes('Date')) {
      // Create file with header
      newContent = 'Date,Idea\n';
    }
    
    // Format the new row
    const newRow = `${dateStr},${idea.replace(/,/g, ';')}`;
    
    // Append new row (ensure proper line ending)
    if (newContent.endsWith('\n')) {
      newContent += newRow;
    } else {
      newContent += '\n' + newRow;
    }
    
    // Write the updated content
    await writable.write(newContent);
    await writable.close();
    
    return true;
  } catch (error) {
    console.error('Error saving idea:', error);
    return false;
  }
}

// Function to add or remove todo in local file
export async function saveTodos(dirHandle: FileSystemDirectoryHandle, todos: string[]): Promise<boolean> {
  try {
    const fileHandle = await dirHandle.getFileHandle('todos.csv');
    const writable = await fileHandle.createWritable();
    
    // Create content with header and todos
    let content = 'Text\n';
    todos.forEach(todo => {
      content += `${todo.replace(/,/g, ';')}\n`;
    });
    
    await writable.write(content);
    await writable.close();
    
    return true;
  } catch (error) {
    console.error('Error saving todos:', error);
    return false;
  }
}

// Calculate summary data based on activities from local files
export async function calculateSummary(dirHandle: FileSystemDirectoryHandle): Promise<any> {
  try {
    const activities = await readActivities(dirHandle);
    
    // Group activities by day
    const days = new Set<string>();
    let totalMinutes = 0;
    
    // Count categories
    const categoryMinutes: Record<string, number> = {};
    
    activities.forEach(activity => {
      if (!activity.start || !activity.end) return;
      
      // Handle both string dates and dayjs objects for local file operations
      const start = typeof activity.start === 'string' 
        ? dayjs(activity.start) 
        : activity.start;
      
      const end = typeof activity.end === 'string' 
        ? dayjs(activity.end) 
        : activity.end;
        
      const dayKey = start.format('YYYY-MM-DD');
      days.add(dayKey);
      
      // Skip "Free Time" for total hours calculation
      if (activity.category === 'Free Time') return;
      
      const mins = end.diff(start, 'minute');
      totalMinutes += mins;
      
      if (!categoryMinutes[activity.category]) {
        categoryMinutes[activity.category] = 0;
      }
      categoryMinutes[activity.category] += mins;
    });
    
    // Find top category
    let topCategory = '-';
    let topMinutes = 0;
    
    Object.entries(categoryMinutes).forEach(([category, minutes]) => {
      if (minutes > topMinutes) {
        topMinutes = minutes;
        topCategory = category;
      }
    });
    
    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      daysTracked: days.size,
      avgDaily: days.size ? ((totalMinutes / 60) / days.size).toFixed(1) : '0.0',
      topCategory
    };
  } catch (error) {
    console.error('Error calculating summary:', error);
    return {
      totalHours: 0,
      daysTracked: 0,
      avgDaily: 0,
      topCategory: '-'
    };
  }
}
