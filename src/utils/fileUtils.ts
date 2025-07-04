import dayjs from 'dayjs';

// Types matching what the app expects
interface Activity {
  category: string;
  start?: string;
  end?: string;
  details?: string;
  duration?: number;
}

interface CategoryDef {
  name: string;
  color: string;
}

// CSV parser for simple files
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  return lines.map(line => {
    // Handle quoted values with commas inside them
    const result = [];
    let currentField = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }
    
    result.push(currentField);
    return result;
  });
}

// Function to read activities from CSV
export async function readActivities(dirHandle: FileSystemDirectoryHandle, dateStr?: string): Promise<Activity[]> {
  try {
    const fileHandle = await dirHandle.getFileHandle('activities.csv');
    const file = await fileHandle.getFile();
    const text = await file.text();
    
    const rows = parseCSV(text);
    if (rows.length <= 1) return []; // Just header or empty
    
    const header = rows[0];
    const startIdx = header.findIndex(h => h === 'Start');
    const endIdx = header.findIndex(h => h === 'End');
    const categoryIdx = header.findIndex(h => h === 'Category');
    const detailsIdx = header.findIndex(h => h === 'Details');
    
    let activities = rows.slice(1).filter(row => row.length >= 3).map(row => ({
      start: row[startIdx],
      end: row[endIdx],
      category: row[categoryIdx],
      details: row[detailsIdx] || ''
    }));
    
    // Filter by date if provided
    if (dateStr) {
      const targetDate = dayjs(dateStr);
      activities = activities.filter(a => {
        if (!a.start) return false;
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

// Function to read categories from JSON
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

// Function to read todos from CSV
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

// Function to read ideas from CSV
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

// Function to write new activity to CSV
export async function saveActivity(dirHandle: FileSystemDirectoryHandle, activity: Activity): Promise<boolean> {
  try {
    const fileHandle = await dirHandle.getFileHandle('activities.csv');
    // Need writable access
    const writable = await fileHandle.createWritable({ keepExistingData: true });
    
    // First read existing content
    const file = await fileHandle.getFile();
    const text = await file.text();
    
    // Parse and check if header exists
    const rows = text.split(/\r?\n/);
    let newContent = text;
    
    if (rows.length === 0) {
      // Create file with header
      newContent = 'Start,End,Category,Details\n';
    }
    
    // Format the new row
    const newRow = `${activity.start},${activity.end},${activity.category},${activity.details || ''}`;
    
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
    console.error('Error saving activity:', error);
    return false;
  }
}

// Function to add a new idea to CSV
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

// Function to add or remove todo
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

// Calculate summary data based on activities
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
      
      const start = dayjs(activity.start);
      const end = dayjs(activity.end);
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
