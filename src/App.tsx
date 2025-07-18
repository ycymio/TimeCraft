import './App.css';
import { useEffect, useState } from 'react';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { SimplePieChart } from './SimplePieChart';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { FolderSetup } from './components/FolderSetup';
import { readActivities, readCategories, readIdeas, readTodos, saveActivity, saveIdea, saveTodos, calculateSummary } from './utils/fileUtils';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Updated Activity type
interface Activity {
  category: string;
  start?: string;
  end?: string;
  details?: string;
}

interface CategoryDef {
  name: string;
  color: string;
}

function roundToNearest5or10(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  let mins = date.getMinutes();
  // Round to nearest 0, 5, or 10
  if (mins % 10 < 3) mins = Math.floor(mins / 10) * 10;
  else if (mins % 10 < 8) mins = Math.floor(mins / 10) * 10 + 5;
  else mins = Math.ceil(mins / 10) * 10;
  date.setMinutes(mins, 0, 0);
  return date.toISOString().slice(0, 16);
}

function getDefaultDate(offsetMin = 0) {
  const now = dayjs();
  const rounded = now.second(0).millisecond(0).minute(Math.floor(now.minute() / 5) * 5 + offsetMin);
  return rounded; // Return dayjs object for DateTimePicker compatibility
}

// Generate soft background color
function getSoftColor(hex: string, alpha = 0.32) {
  // Support #rgb/#rrggbb format
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  // Increase brightness (lighter)
  const brighten = (v: number) => Math.min(255, Math.floor(220 + (v-128)*0.18));
  return `rgba(${brighten(r)},${brighten(g)},${brighten(b)},${alpha})`;
}
// Generate dark text color
function getDarkColor(hex: string) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  // Darker color (darken factor increased from 0.28 to 0.18)
  const darken = (v: number) => Math.max(0, Math.floor(v * 0.18));
  return `rgb(${darken(r)},${darken(g)},${darken(b)})`;
}

// Generate colorful text color in same tone but darker (larger darken factor)
function getColorfulTextColor(hex: string) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let r = parseInt(c.substring(0,2),16);
  let g = parseInt(c.substring(2,4),16);
  let b = parseInt(c.substring(4,6),16);
  // Reduce brightness, increase saturation for same-tone darker color
  const factor = 0.44; // Darker
  r = Math.round(r * factor);
  g = Math.round(g * factor);
  b = Math.round(b * factor);
  return `rgb(${r},${g},${b})`;
}

function App() {
  // Save directory handle to IndexedDB
  const saveDirHandle = async (dirHandle: FileSystemDirectoryHandle) => {
    try {
      // Request persistent access permission
      if ((await (dirHandle as any).queryPermission({ mode: 'readwrite' })) !== 'granted') {
        const permission = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          console.error('Unable to get persistent access permission');
          return;
        }
      }
      
      // Open IndexedDB database
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('TimeCraftDB', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('dirHandles')) {
            db.createObjectStore('dirHandles', { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Save directory handle
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('dirHandles', 'readwrite');
        const store = transaction.objectStore('dirHandles');
        const request = store.put({ id: 'lastUsedDir', handle: dirHandle });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to save directory handle:', error);
    }
  };

  // Restore directory handle from IndexedDB
  const loadDirHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
    try {
      // Open IndexedDB database
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('TimeCraftDB', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('dirHandles')) {
            db.createObjectStore('dirHandles', { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Get directory handle
      return new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
        const transaction = db.transaction('dirHandles', 'readonly');
        const store = transaction.objectStore('dirHandles');
        const request = store.get('lastUsedDir');
        request.onsuccess = () => {
          const dirHandle = request.result?.handle || null;
          if (dirHandle) {
            // Verify permissions
            (dirHandle as any).queryPermission({ mode: 'readwrite' })
              .then((permission: string) => {
                if (permission === 'granted') {
                  resolve(dirHandle);
                } else {
                  // If no permission, try to request permission
                  (dirHandle as any).requestPermission({ mode: 'readwrite' })
                    .then((newPermission: string) => {
                      if (newPermission === 'granted') {
                        resolve(dirHandle);
                      } else {
                        console.log('User denied persistent access permission');
                        resolve(null);
                      }
                    });
                }
              });
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to load directory handle:', error);
      return null;
    }
  };

  // Setup and state hooks
  const [selectedDir, setSelectedDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [newPeriod, setNewPeriod] = useState({ start: null as any, end: null as any, category: '', details: '' });
  const [viewDate, setViewDate] = useState(dayjs());
  const [weekActivities, setWeekActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState({ totalHours: 0, daysTracked: 0, avgDaily: 0, topCategory: '-' });
  const [dailyIdea, setDailyIdea] = useState('');
  const [ideas, setIdeas] = useState<any[]>([]);
  const [randomIdea, setRandomIdea] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [commentedIdeas, setCommentedIdeas] = useState<Record<string, string>>({});
  const [todos, setTodos] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState<string>('');
  
  useEffect(() => {
    if (!selectedDir) return;
    readCategories(selectedDir).then((data) => {
      setCategories(data);
      setNewPeriod((prev) => ({
        ...prev,
        category: '',
        start: prev.start || getDefaultDate(-30),
        end: prev.end || getDefaultDate(),
      }));
    });
    // Load activities for specified date
    readActivities(selectedDir, viewDate.format('YYYY-MM-DD')).then(data => {
      // Ensure correct field order is used: category, start, end, details
      setActivities(data);
    });
  }, [viewDate, selectedDir]);

  useEffect(() => {
    if (!selectedDir) return;
    // Load all activities for this week for statistics, reload when viewDate or activities change
    readActivities(selectedDir).then(data => {
      // Ensure correct field order is used: category, start, end, details
      setWeekActivities(data);
    });
  }, [viewDate, activities, selectedDir]);

  useEffect(() => {
    if (!selectedDir) return;
    calculateSummary(selectedDir).then(data => setSummary(data));
  }, [activities, selectedDir]);

  useEffect(() => {
    if (!selectedDir) return;
    readIdeas(selectedDir, viewDate.format('YYYY-MM-DD')).then(setIdeas);
  }, [viewDate, selectedDir]);
  
  useEffect(() => {
    if (!selectedDir) return;
    readTodos(selectedDir).then(setTodos);
  }, [selectedDir]);

  // Randomly pick a historical insight when page loads (not today's)
  useEffect(() => {
    if (!selectedDir) return;
    readIdeas(selectedDir).then(allIdeas => {
      // Exclude today
      const todayStr = viewDate.format('YYYY-MM-DD');
      const pastIdeas = allIdeas.filter((i: any) => i.Date !== todayStr);
      if (pastIdeas.length > 0) {
        const pick = pastIdeas[Math.floor(Math.random() * pastIdeas.length)];
          setRandomIdea(pick);
        } else {
          setRandomIdea(null);
        }
      });
  }, [viewDate, selectedDir]);

  // Try to load last used directory
  useEffect(() => {
    async function loadLastDir() {
      if (!selectedDir) {
        try {
          // Try to load last used directory from IndexedDB
          const dirHandle = await loadDirHandle();
          if (dirHandle) {
            console.log('Restored last used directory');
            setSelectedDir(dirHandle);
          }
        } catch (error) {
          console.error('Failed to restore directory:', error);
        }
      }
    }
    
    loadLastDir();
  }, []); // Only run on component first mount, don't depend on selectedDir

  // Save to IndexedDB when directory changes
  useEffect(() => {
    if (selectedDir) {
      saveDirHandle(selectedDir).catch(err => {
        console.error('Failed to save directory handle:', err);
      });
    }
  }, [selectedDir]);

  // Define all handler functions here
  // Toggle/delete todo via local files
  const handleToggleTodo = async (index: number) => {
    if (!selectedDir) return;
    try {
      // Get current todos
      const currentTodos = await readTodos(selectedDir);
      
      // Remove the one at the specified index
      const updatedTodos = currentTodos.filter((_, i) => i !== index);
      
      // Save the updated todos
      await saveTodos(selectedDir, updatedTodos);
      
      // Update state
      setTodos(updatedTodos);
    } catch (e) {
      console.error('Failed to delete todo', e);
    }
  };
  
  // Add new todo via local files
  const handleAddTodo = async () => {
    if (!selectedDir || !newTodo.trim()) return;
    try {
      // Get current todos
      const currentTodos = await readTodos(selectedDir);
      
      // Add the new todo
      const updatedTodos = [...currentTodos, newTodo.trim()];
      
      // Save updated todos
      await saveTodos(selectedDir, updatedTodos);
      
      // Update state
      setTodos(updatedTodos);
      setNewTodo('');
    } catch (e) {
      console.error('Failed to add todo', e);
    }
  };

  function handleNewPeriodChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    let newValue = value;
    if ((name === 'start' || name === 'end') && value) {
      newValue = roundToNearest5or10(value);
    }
    setNewPeriod((prev) => ({ ...prev, [name]: newValue }));
  }

  // Refresh today's activities after adding new one
  async function saveActivityToServer(activity: Activity) {
    if (!selectedDir) return;
    try {
      // Ensure activity object is passed in correct format
      await saveActivity(selectedDir, activity);
      // Refresh activities for current viewDate after saving
      const acts = await readActivities(selectedDir, viewDate.format('YYYY-MM-DD'));
      setActivities(acts);
    } catch (e) {
      // Can add toast or notification here
      console.error('Failed to save activity to file', e);
    }
  }

  function handleAddPeriod() {
    if (!selectedDir || !newPeriod.start || !newPeriod.end || !newPeriod.category) return;
    const start = dayjs(newPeriod.start);
    const end = dayjs(newPeriod.end);
    const duration = Math.max(0, end.diff(start, 'minute'));
    if (duration <= 0) return;
    // Check overlap
    const overlap = activities.some(a => {
      if (!a.start || !a.end) return false;
      const aStart = dayjs(a.start);
      const aEnd = dayjs(a.end);
      // Any intersection counts as overlap
      return start.isBefore(aEnd) && end.isAfter(aStart);
    });
    if (overlap) {
      alert('This time period overlaps with existing activities. Please adjust and try again.');
      return;
    }
    const newActivity: Activity = {
      category: newPeriod.category,
      // Keep the original dayjs objects in the activity state
      start: newPeriod.start,
      end: newPeriod.end,
      details: newPeriod.details,
    };
    setActivities((prev) => [
      ...prev,
      newActivity,
    ]);
    saveActivityToServer(newActivity);
    setNewPeriod({
      start: newPeriod.end, // Keep using the dayjs object
      end: getDefaultDate(),
      category: '',
      details: '',
    });
  }
  
  // Conditional setup screen after all function definitions
  if (!selectedDir) {
    return <FolderSetup onDone={(dirHandle) => setSelectedDir(dirHandle)} />;
  }

  // Calculate timeline display range
  const todayActs = activities.filter(a => {
    if (!a.start || !a.end) return false;
    const start = dayjs(a.start);
    return start.isSame(viewDate, 'day');
  });
  let minHour = 10, maxHour = 20;
  if (todayActs.length > 0) {
    const minStart = Math.min(...todayActs.map(a => dayjs(a.start).hour()));
    const maxEnd = Math.max(...todayActs.map(a => dayjs(a.end).hour() + (dayjs(a.end).minute() > 0 ? 1 : 0)));
    minHour = Math.min(minHour, minStart);
    maxHour = Math.max(maxHour, maxEnd);
  }
  // Limit range to 0-24
  minHour = Math.max(0, minHour);
  maxHour = Math.min(24, maxHour);

  // Calculate weekly time summary by category
  // weekStart: Monday 00:00, weekEnd: Sunday 23:59:59
  // Calculate current week based on selected viewDate
  const weekStart = viewDate.startOf('week').add(1, 'day'); // Monday of viewDate week
  const weekEnd = weekStart.add(6, 'day').endOf('day'); // Sunday 23:59:59 of viewDate week
  const weekActivitiesFiltered = weekActivities.filter(a => {
    if (!a.start || !a.end) return false;
    // Explicitly use dayjs(start, 'YYYY/MM/DD HH:mm') to parse
    const start = dayjs(a.start, 'YYYY/MM/DD HH:mm');
    return start.isSameOrAfter(weekStart) && start.isSameOrBefore(weekEnd);
  });
  const categoryTotals: Record<string, number> = {};
  weekActivitiesFiltered.forEach(a => {
    const start = dayjs(a.start, 'YYYY/MM/DD HH:mm');
    const end = dayjs(a.end, 'YYYY/MM/DD HH:mm');
    const mins = Math.max(0, end.diff(start, 'minute'));
    if (!categoryTotals[a.category]) categoryTotals[a.category] = 0;
    categoryTotals[a.category] += mins;
  });

  // Calculate today's total time (excluding Free Time)
  const todayTotalMinutes = todayActs
    .filter(a => a.category !== 'Free Time')
    .reduce((sum, a) => {
      if (!a.start || !a.end) return sum;
      const start = dayjs(a.start);
      const end = dayjs(a.end);
      return sum + Math.max(0, end.diff(start, 'minute'));
    }, 0);
  const todayTotalHours = (todayTotalMinutes / 60).toFixed(2);

  return (
    <>
      <header style={{ padding: '10px', textAlign: 'right' }}>
        <button 
          onClick={() => setSelectedDir(null)}
          style={{
            border: '1.5px solid #d0d7de',
            borderRadius: '6px',
            padding: '0.5em 1em',
            background: '#fff',
            color: '#333',
            cursor: 'pointer',
            fontSize: '0.9em',
            fontWeight: 500
          }}
        >
          Change Folder
        </button>
      </header>
      <div className="main-layout">
        <div className="left-column">
          <div className="add-period-form">
            <h1 className="site-title">
              <span className="site-title-hours">Hours</span>
              <span className="site-title-and">&amp;</span>
              <span className="site-title-me">Me</span>
            </h1>
            <h2>Add New Activity Period</h2>
            <div className="form-row form-row-vertical">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Start"
                  value={newPeriod.start}
                  onChange={date => setNewPeriod(prev => ({ ...prev, start: date }))}
                  ampm={false}
                  minutesStep={5}
                  slotProps={{ textField: { className: 'modern-input', fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </div>
            <div className="form-row form-row-vertical">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="End"
                  value={newPeriod.end}
                  onChange={date => setNewPeriod(prev => ({ ...prev, end: date }))}
                  ampm={false}
                  minutesStep={5}
                  slotProps={{ textField: { className: 'modern-input', fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </div>
            <div className="form-row">
              <label>Category
                <select
                  name="category"
                  value={newPeriod.category}
                  onChange={handleNewPeriodChange}
                  disabled={categories.length === 0}
                  required
                  className="colorful-select"
                  style={{
                    background: newPeriod.category ? getSoftColor(categories.find((cat) => cat.name === newPeriod.category)?.color || '#bbb') : '#fff',
                    color: newPeriod.category ? getColorfulTextColor(categories.find((cat) => cat.name === newPeriod.category)?.color || '#bbb') : '#333',
                    border: '1.5px solid #bbb',
                    borderRadius: '6px',
                    padding: '0.3em 0.7em',
                    fontWeight: 'normal',
                  }}
                >
                  <option value="" disabled style={{background:'#fff',color:'#333'}}>
                    {categories.length === 0 ? 'Loading...' : 'Select category'}
                  </option>
                  {categories.map((cat) => (
                    <option
                      key={cat.name}
                      value={cat.name}
                      style={{
                        background: getSoftColor(cat.color), // Timeline style soft background color
                        color: getColorfulTextColor(cat.color), // Timeline style dark text color
                        fontWeight: 'normal'
                      }}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>Details
                <textarea name="details" value={newPeriod.details} onChange={handleNewPeriodChange} rows={2} className="modern-textarea" />
              </label>
            </div>
            <button onClick={handleAddPeriod} className="add-period-form-btn" style={{ marginTop: '0.5rem', marginLeft: 'auto', marginRight: 'auto', display: 'block' }}>Add</button>
          </div>
          {/* Todo List Section */}
          <div className="todo-list" style={{background:'#f7f7fa',borderRadius:'8px',padding:'0.8em',boxShadow:'0 1px 4px rgba(0,0,0,0.04)',border:'1.5px solid #ececf0',marginBottom:'1em',textAlign:'left',fontSize:'0.85em'}}>
            <h2 style={{fontSize:'1.2em',margin:'0 0 0.5em 0',color:'#213547',fontWeight:500,textAlign:'center',width:'100%'}}>Todo List</h2>
            {/* New Todo Input */}
            <div style={{display:'flex',gap:'0.5em',marginBottom:'0.5em',justifyContent:'center',width:'100%'}}>
              <input
                type="text"
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                placeholder="Add new todo..."
                style={{flex:1,padding:'0.4em',fontSize:'0.9em',border:'1px solid #ccc',borderRadius:'4px'}}
              />
              <button
                onClick={handleAddTodo}
                style={{padding:'0.4em 1em',background:'#4F8EF7',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'0.9em'}}
              >Add</button>
            </div>
            {todos.length === 0 ? (
              <div style={{color:'#aaa'}}>No todos</div>
            ) : (
              <ul style={{listStyle:'none',paddingLeft:0,margin:0}}>
                {todos.map((todo, idx) => (
                  <li key={todo} style={{display:'flex',alignItems:'center',marginBottom:'0.3em'}}>
                    <input
                      type="checkbox"
                      onChange={() => handleToggleTodo(idx)}
                      style={{marginRight:'0.5em'}}
                    />
                    <span>{todo}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Daily Reflection Section */}
          <div className="add-period-form daily-idea-form" style={{marginTop:'1.3em'}}>
            <h2 style={{fontSize:'1.08em',margin:'0 0 0.5em 0',color:'#213547',fontWeight:500}}>Daily Reflection</h2>
            <form onSubmit={async e => {
              e.preventDefault();
              if (!dailyIdea.trim()) return;
              await saveIdea(selectedDir!, viewDate.format('YYYY-MM-DD'), dailyIdea);
              setDailyIdea('');
              // reload
              readIdeas(selectedDir!, viewDate.format('YYYY-MM-DD')).then(setIdeas);
            }} style={{display:'flex',flexDirection:'column',gap:'0.3em',alignItems:'stretch',marginBottom:'0.7em'}}>
              <textarea
                value={dailyIdea}
                onChange={e => setDailyIdea(e.target.value)}
                rows={2}
                placeholder="Write your thoughts, insights, or inspirations for today..."
                className="modern-textarea"
                style={{resize:'vertical'}}
              />
              <button type="submit" className="add-period-form-btn" style={{marginTop:'0.5rem',marginLeft:'auto',marginRight:'auto',display:'block'}}>Add</button>
            </form>
            <div className="daily-idea-list" style={{marginTop:'0.2em'}}>
              {ideas.length === 0 ? (
                <div style={{color:'#aaa',fontSize:'0.98em'}}>No reflection for today</div>
              ) : (
                <ul style={{listStyle:'disc',paddingLeft:'1.2em',margin:0}}>
                  {ideas.map((i,idx) => (
                    <li key={idx} style={{marginBottom:'0.2em',color:'#333',fontSize:'1.01em',lineHeight:1.5}}>{i.Idea}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* Random Past Idea Section */}
          <div className="random-idea-box" style={{background:'#f7f7fa',borderRadius:'8px',padding:'1em',boxShadow:'0 1px 4px rgba(0,0,0,0.04)',border:'1.5px solid #ececf0',marginBottom:'1.1em',color:'#222'}}>
            <div style={{fontWeight:500,color:'#213547',fontSize:'1.05em',marginBottom:'0.3em'}}>A Random Past Reflection</div>
            {randomIdea ? (
              <>
                <div style={{color:'#222',fontSize:'1.01em',marginBottom:'0.5em'}}>{randomIdea.Idea}</div>
                <form onSubmit={e => {
                  e.preventDefault();
                  if (!comment.trim()) return;
                  setCommentedIdeas(prev => ({...prev, [randomIdea.Date+randomIdea.Idea]: comment}));
                  setComment('');
                }} style={{display:'flex',flexDirection:'column',gap:'0.3em',alignItems:'stretch'}}>
                  <input
                    type="text"
                    value={commentedIdeas[randomIdea.Date+randomIdea.Idea] || comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Write your comment..."
                    style={{flex:1,minWidth:0,borderRadius:'6px',border:'1.5px solid #d0d7de',padding:'0.4em 0.8em',fontSize:'1em',background:'#fff',color:'#222'}}
                  />
                  <button type="submit" className="add-period-form-btn" style={{marginTop:'0.5rem',marginLeft:'auto',marginRight:'auto',display:'block'}}>Comment</button>
                </form>
                {commentedIdeas[randomIdea.Date+randomIdea.Idea] && (
                  <div style={{marginTop:'0.4em',color:'#888',fontSize:'0.98em'}}>Your comment: {commentedIdeas[randomIdea.Date+randomIdea.Idea]}</div>
                )}
              </>
            ) : (
              <div style={{color:'#aaa',fontSize:'0.98em'}}>No past reflections</div>
            )}
          </div> {/* random-idea-box */}
        </div> {/* left-column end */}
        <div className="center-column">
          <div className="today-title-bar" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="today-arrow-btn" onClick={() => setViewDate(viewDate.subtract(1, 'day'))}>
              <ArrowBackIosNewIcon fontSize="small" />
            </button>
            <h2
              className="today-title"
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                margin: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {viewDate.isSame(dayjs(), 'day') ? 'Today' : viewDate.format('YYYY/MM/DD')}
            </h2>
            <button className="today-arrow-btn" onClick={() => setViewDate(viewDate.add(1, 'day'))}>
              <ArrowForwardIosIcon fontSize="small" />
            </button>
            <span style={{ fontSize: '0.75em', color: '#888', fontWeight: 400, whiteSpace: 'nowrap', alignSelf: 'flex-end' }}>
              {todayTotalHours} hours
            </span>            </div>
            {/* Timeline container */}
            <div className="timeline-container">
              {/* Time scale ticks */}
              <div className="timeline-ticks">
                {Array.from({ length: maxHour - minHour + 1 }).map((_, i) => {
                  const h = minHour + i;
                  return (
                    <div
                      key={h}
                      className="timeline-tick-label"
                      style={{ top: `${((h - minHour) / (maxHour - minHour)) * 100}%` }}
                    >
                      {h.toString().padStart(2, '0')}:00
                    </div>
                  );
                })}
              </div>
              {/* No vertical/horizontal lines, activity blocks close to time ticks */}
            {todayActs.map((a, idx) => {
              const start = dayjs(a.start);
              const end = dayjs(a.end);
              const startMin = (start.hour() * 60 + start.minute()) - (minHour * 60);
              const endMin = (end.hour() * 60 + end.minute()) - (minHour * 60);
              const totalMinutes = (maxHour - minHour) * 60;
              const topPct = (startMin / totalMinutes) * 100;
              const heightPct = Math.max(2, (endMin - startMin) / totalMinutes * 100);
              
              const catColor = categories.find(c => c.name === a.category)?.color || '#bbb';
              const bgColor = getSoftColor(catColor);
              const textColor = getDarkColor(catColor);
              
              // Dynamic padding: reduce padding when height is very small
              let dynamicPadding = '0.25em 0.8em';
              if (heightPct < 7) dynamicPadding = '0em 0.8em';
              else if (heightPct < 12) dynamicPadding = '0.15em 0.8em';
              
              return (
                <div
                  key={idx}
                  className="timeline-activity-block timeline-activity-block-plain"
                  style={window.innerWidth > 600 ? {
                    top: `${topPct}%`,
                    height: `${heightPct}%`,
                    background: bgColor,
                    color: textColor,
                    left: '60px',
                    padding: dynamicPadding,
                  } : {
                    background: bgColor,
                    color: textColor,
                  }}
                  title={`${start.format('HH:mm')} - ${end.format('HH:mm')}\n${a.category}${a.details ? ': ' + a.details : ''}`}
                >
                  <span
                    className="timeline-activity-label"
                    style={{
                      color: getColorfulTextColor(catColor),
                      fontSize: '0.9em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block'
                    }}
                  >{a.category}</span>
                  {a.details && heightPct >= 7 && (
                    <span
                      className="timeline-activity-details"
                      style={{
                        color: getColorfulTextColor(catColor),
                        fontSize: '0.78em',
                        whiteSpace: 'normal', // Allow automatic line wrapping
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        fontStyle: 'italic', // Italic
                      }}
                    >{a.details}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="right-column">
          <div className="weekly-summary">
            <h3 style={{margin: '1.2em 0 0.5em 0', fontSize: '1.2em', color: '#555', fontWeight: 500}}>This Week by Category</h3>
            <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
              {Object.entries(categoryTotals).length === 0 && <li style={{color:'#aaa'}}>No data this week</li>}
              {Object.entries(categoryTotals).map(([cat, mins]) => (
                <li key={cat}>
                  <span style={{background:categories.find(c=>c.name===cat)?.color||'#bbb'}}></span>
                  <span>{cat}</span>
                  <span>{Math.floor(mins/60)}h {mins%60}m</span>
                </li>
              ))}
            </ul>
            {/* Pie chart showing weekly category distribution */}
            <div className="weekly-pie-chart" style={{margin:'1.2em auto 0 auto',width:'fit-content',minHeight: '190px'}}>
              {Object.values(categoryTotals).reduce((a,b)=>a+b,0) > 0 ? (
                <SimplePieChart
                  data={Object.entries(categoryTotals).map(([cat, mins]) => ({
                    label: cat,
                    value: mins,
                    color: categories.find(c=>c.name===cat)?.color||'#bbb',
                  }))}
                  size={180}
                />
              ) : (
                <div style={{color:'#aaa',textAlign:'center',padding:'2.5em 0'}}>No data for pie chart</div>
              )}
              <div className="weekly-pie-legend" style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'0.7em',marginTop:'0.5em'}}>
                {Object.entries(categoryTotals).map(([cat, mins]) => (
                  <span key={cat} style={{display:'flex',alignItems:'center',fontSize:'0.97em',color:'#555'}}>
                    <span style={{display:'inline-block',width:10,height:10,borderRadius:5,background:categories.find(c=>c.name===cat)?.color||'#bbb',marginRight:4}}></span>
                    {cat} {((mins/Math.max(1,Object.values(categoryTotals).reduce((a,b)=>a+b,0)))*100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="summary-panel">
            <h3 className="summary-title">Summary</h3>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-label"><span role="img" aria-label="Total Time">📊</span> Total Time</div>
                <div className="summary-value highlight">{summary.totalHours} hours</div>
              </div>
              <div className="summary-card">
                <div className="summary-label"><span role="img" aria-label="Days Tracked">📅</span> Days Tracked</div>
                <div className="summary-value highlight">{summary.daysTracked} days</div>
              </div>
              <div className="summary-card">
                <div className="summary-label"><span role="img" aria-label="Average Daily">⏱️</span> Average Daily</div>
                <div className="summary-value highlight">{summary.avgDaily} hours</div>
              </div>
              <div className="summary-card">
                <div className="summary-label"><span role="img" aria-label="Top Category">🏆</span> Top Category</div>
                <div className="summary-value highlight">{summary.topCategory}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
