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
    
    // Validate header format - must contain all required columns
    const requiredColumns = ['Start', 'End', 'Category', 'Details'];
    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`CSV file format is incorrect. Missing columns: ${missingColumns.join(', ')}. Expected format: Start,End,Category,Details`);
    }
    
    // Find column indexes in header with format: Start,End,Category,Details
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
    // Re-throw format validation errors so they can be caught by the caller
    if (error instanceof Error && error.message.includes('format is incorrect')) {
      throw error;
    }
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
    
    const header = rows[0];
    
    // Validate header format - must contain Text column
    if (!header.includes('Text')) {
      throw new Error(`todos.csv file format is incorrect. Expected format: Text`);
    }
    
    // Skip header and get the first column (Text)
    return rows.slice(1)
      .filter(row => row.length > 0 && row[0].trim() !== '')
      .map(row => row[0]);
  } catch (error) {
    // Re-throw format validation errors so they can be caught by the caller
    if (error instanceof Error && error.message.includes('format is incorrect')) {
      throw error;
    }
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
    
    // Validate header format - must contain Date and Idea columns
    const requiredColumns = ['Date', 'Idea'];
    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`daily_ideas.csv file format is incorrect. Missing columns: ${missingColumns.join(', ')}. Expected format: Date,Idea`);
    }
    
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
    // Re-throw format validation errors so they can be caught by the caller
    if (error instanceof Error && error.message.includes('format is incorrect')) {
      throw error;
    }
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
    
    // Read existing content to check header and determine column order
    let existingContent = '';
    let needsHeader = false;
    let columnOrder = ['Start', 'End', 'Category', 'Details']; // Default order
    
    try {
      const file = await fileHandle.getFile();
      existingContent = await file.text();
      
      // Check if header exists and is correct
      const lines = existingContent.split(/\r?\n/);
      if (lines.length === 0) {
        needsHeader = true;
      } else {
        const firstLine = lines[0];
        const headerCols = parseCSV(firstLine)[0] || [];
        
        // Check if all required columns exist
        const requiredColumns = ['Start', 'End', 'Category', 'Details'];
        const missingColumns = requiredColumns.filter(col => !headerCols.includes(col));
        
        if (missingColumns.length > 0) {
          needsHeader = true;
        } else {
          // Use existing column order
          columnOrder = headerCols;
        }
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
      newContent = 'Start,End,Category,Details\n';
      columnOrder = ['Start', 'End', 'Category', 'Details']; // Use default order for new files
    } else {
      newContent = existingContent;
    }
    
    // Format the new row with proper CSV escaping, respecting column order
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
    
    // Build row data based on existing column order
    const rowData: string[] = [];
    for (const columnName of columnOrder) {
      switch (columnName) {
        case 'Start':
          rowData.push(escapeCSV(formatDate(activity.start)));
          break;
        case 'End':
          rowData.push(escapeCSV(formatDate(activity.end)));
          break;
        case 'Category':
          rowData.push(escapeCSV(activity.category));
          break;
        case 'Details':
          rowData.push(escapeCSV(activity.details));
          break;
        default:
          // Handle any additional columns that might exist
          rowData.push('');
          break;
      }
    }
    
    const newRow = rowData.join(',');
    
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
    // Try to get existing file or create a new one
    let fileHandle: FileSystemFileHandle;
    try {
      fileHandle = await dirHandle.getFileHandle('daily_ideas.csv');
    } catch (error) {
      // File doesn't exist, create it
      fileHandle = await dirHandle.getFileHandle('daily_ideas.csv', { create: true });
    }
    
    // Read existing content to check header and determine column order
    let existingContent = '';
    let needsHeader = false;
    let columnOrder = ['Date', 'Idea']; // Default order
    
    try {
      const file = await fileHandle.getFile();
      existingContent = await file.text();
      
      if (existingContent.trim()) {
        const lines = existingContent.split(/\r?\n/);
        if (lines.length > 0) {
          const headerCols = parseCSV(lines[0])[0] || [];
          
          // Check if all required columns exist
          const requiredColumns = ['Date', 'Idea'];
          const missingColumns = requiredColumns.filter(col => !headerCols.includes(col));
          
          if (missingColumns.length > 0) {
            needsHeader = true;
          } else {
            // Use existing column order
            columnOrder = headerCols;
          }
        } else {
          needsHeader = true;
        }
      } else {
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
      newContent = 'Date,Idea\n';
      columnOrder = ['Date', 'Idea']; // Use default order for new files
    } else {
      newContent = existingContent;
    }
    
    // Build row data based on existing column order
    const rowData: string[] = [];
    for (const columnName of columnOrder) {
      switch (columnName) {
        case 'Date':
          rowData.push(dateStr);
          break;
        case 'Idea':
          rowData.push(idea.replace(/,/g, ';')); // Simple comma replacement for ideas
          break;
        default:
          // Handle any additional columns that might exist
          rowData.push('');
          break;
      }
    }
    
    const newRow = rowData.join(',');
    
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

// Function to validate all CSV file formats in the directory
export async function validateDirectoryFiles(dirHandle: FileSystemDirectoryHandle): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    // Check activities.csv format by trying to read it
    try {
      await readActivities(dirHandle);
    } catch (error) {
      if (error instanceof Error && error.message.includes('format is incorrect')) {
        errors.push(error.message);
      }
    }
    
    // Check todos.csv format by trying to read it
    try {
      await readTodos(dirHandle);
    } catch (error) {
      if (error instanceof Error && error.message.includes('format is incorrect')) {
        errors.push(error.message);
      }
    }
    
    // Check daily_ideas.csv format by trying to read it
    try {
      await readIdeas(dirHandle);
    } catch (error) {
      if (error instanceof Error && error.message.includes('format is incorrect')) {
        errors.push(error.message);
      }
    }
    
    // Check categories.json format
    try {
      const categoriesHandle = await dirHandle.getFileHandle('categories.json');
      const file = await categoriesHandle.getFile();
      const text = await file.text();
      
      if (text.trim()) {
        try {
          const categories = JSON.parse(text);
          if (!Array.isArray(categories)) {
            errors.push(`categories.json format is incorrect. Should be an array`);
          } else {
            // Check if each category has required fields
            for (let i = 0; i < categories.length; i++) {
              const cat = categories[i];
              if (!cat.name || !cat.color) {
                errors.push(`categories.json format is incorrect. Category ${i + 1} is missing name or color field`);
                break;
              }
            }
          }
        } catch (parseError) {
          errors.push(`categories.json format is incorrect. Not valid JSON format`);
        }
      }
    } catch (error) {
      // File doesn't exist, which is OK
    }
    
  } catch (error) {
    errors.push(`Unable to access folder: ${error}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
