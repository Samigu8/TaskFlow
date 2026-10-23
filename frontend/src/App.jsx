import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})

const initialForm = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  dueDate: '',
}

function App() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadTasks() {
    try {
      setError('')
      const response = await api.get('/tasks')
      setTasks(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load tasks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
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

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Task management</p>
          <h1>TaskFlow</h1>
          <p className="subtitle">Keep your work moving forward.</p>
        </div>
        <span className="task-count">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
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
