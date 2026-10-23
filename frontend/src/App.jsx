import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const initialForm = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  dueDate: '',
}

const initialFilters = {
  search: '',
  status: '',
  priority: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('taskflow_token'))
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(initialForm)
  const [filters, setFilters] = useState(initialFilters)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function authenticate(event) {
    event.preventDefault()
    try {
      setError('')
      const response = await api.post(`/auth/${authMode}`, authForm)
      localStorage.setItem('taskflow_token', response.data.token)
      setToken(response.data.token)
      setUser(response.data.user)
      setAuthForm({ email: '', password: '' })
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Authentication failed.')
    }
  }

  function logout() {
    localStorage.removeItem('taskflow_token')
    setToken(null)
    setUser(null)
    setTasks([])
  }

  const loadTasks = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setError('')
      const response = await api.get('/tasks', { params: filters })
      setTasks(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load tasks.')
    } finally {
      setLoading(false)
    }
  }, [filters, token])

  useEffect(() => {
    if (!token) return
    api.get('/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => logout())
    loadTasks()
  }, [loadTasks, token])

  function updateAuthForm(event) {
    setAuthForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updateFilters(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function createTask(event) {
    event.preventDefault()
    if (!form.title.trim()) return

    try {
      setSaving(true)
      setError('')
      const response = await api.post('/tasks', {
        ...form,
        dueDate: form.dueDate || null,
      })
      setTasks((current) => [response.data, ...current])
      setForm(initialForm)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to create task.')
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(task, status) {
    try {
      setError('')
      const response = await api.patch(`/tasks/${task.id}`, { status })
      setTasks((current) => current.map((item) => (item.id === task.id ? response.data : item)))
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to update task.')
    }
  }

  async function deleteTask(taskId) {
    try {
      setError('')
      await api.delete(`/tasks/${taskId}`)
      setTasks((current) => current.filter((task) => task.id !== taskId))
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to delete task.')
    }
  }

  if (!token) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Task management</p>
          <h1>TaskFlow</h1>
          <p className="subtitle">{authMode === 'login' ? 'Welcome back.' : 'Create your account.'}</p>
          {error && <div className="error-message" role="alert">{error}</div>}
          <form className="task-form" onSubmit={authenticate}>
            <label>
              Email
              <input name="email" type="email" value={authForm.email} onChange={updateAuthForm} required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={authForm.password} onChange={updateAuthForm} minLength="8" required />
            </label>
            <button className="primary-button" type="submit">
              {authMode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
          <button className="text-button auth-toggle" type="button" onClick={() => {
            setAuthMode((current) => current === 'login' ? 'register' : 'login')
            setError('')
          }}>
            {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Task management</p>
          <h1>TaskFlow</h1>
          <p className="subtitle">Keep your work moving forward.</p>
          {user && <p className="account-email">{user.email}</p>}
        </div>
        <div className="header-actions">
          <span className="task-count">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
          <button className="text-button" type="button" onClick={logout}>Log out</button>
        </div>
      </header>

      {error && <div className="error-message" role="alert">{error}</div>}

      <section className="content-grid">
        <form className="task-form" onSubmit={createTask}>
          <h2>Create a task</h2>
          <label>
            Title
            <input name="title" value={form.title} onChange={updateForm} placeholder="What needs to be done?" required />
          </label>
          <label>
            Description
            <textarea name="description" value={form.description} onChange={updateForm} placeholder="Add useful context" rows="4" />
          </label>
          <div className="form-row">
            <label>
              Priority
              <select name="priority" value={form.priority} onChange={updateForm}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <label>
              Due date
              <input name="dueDate" type="date" value={form.dueDate} onChange={updateForm} />
            </label>
          </div>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Add task'}
          </button>
        </form>

        <section className="task-list">
          <div className="section-heading">
            <h2>Your tasks</h2>
            <button className="text-button" type="button" onClick={loadTasks}>Refresh</button>
          </div>
          <div className="filters" aria-label="Task filters">
            <input
              name="search"
              value={filters.search}
              onChange={updateFilters}
              placeholder="Search tasks..."
              aria-label="Search tasks"
            />
            <select name="status" value={filters.status} onChange={updateFilters} aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select name="priority" value={filters.priority} onChange={updateFilters} aria-label="Filter by priority">
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <select name="sortBy" value={filters.sortBy} onChange={updateFilters} aria-label="Sort tasks by">
              <option value="createdAt">Created date</option>
              <option value="updatedAt">Updated date</option>
              <option value="dueDate">Due date</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            <select name="sortOrder" value={filters.sortOrder} onChange={updateFilters} aria-label="Sort direction">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          {loading && <p className="empty-state">Loading tasks...</p>}
          {!loading && tasks.length === 0 && <p className="empty-state">No tasks yet. Add your first one.</p>}
          <div className="tasks">
            {tasks.map((task) => (
              <article className={`task-card ${task.status === 'COMPLETED' ? 'completed' : ''}`} key={task.id}>
                <div className="task-card-top">
                  <div>
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                  </div>
                  <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority.toLowerCase()}</span>
                </div>
                <div className="task-card-footer">
                  <select aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => updateStatus(task, event.target.value)}>
                    <option value="TODO">To do</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                  <button className="delete-button" type="button" onClick={() => deleteTask(task.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
