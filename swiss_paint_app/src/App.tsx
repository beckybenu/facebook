import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Auth
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Signup from './pages/Signup'

// App
import Home from './pages/Home'
import Profile from './pages/Profile'
import Pointage from './pages/Pointage'
import Chantiers from './pages/Chantiers'
import TaskDetail from './pages/TaskDetail'
import Documents from './pages/Documents'

// Admin
import AdminHome from './pages/admin/AdminHome'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserEdit from './pages/admin/AdminUserEdit'
import AdminTasks from './pages/admin/AdminTasks'
import AdminTaskEdit from './pages/admin/AdminTaskEdit'
import AdminDocs from './pages/admin/AdminDocs'
import AdminDocEdit from './pages/admin/AdminDocEdit'

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Chargement…</div>

  return (
    <Routes>
      {/* Écrans publics (auth) */}
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <Welcome />} />
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/inscription" element={user ? <Navigate to="/home" replace /> : <Signup />} />

      {/* Écrans connectés */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profil"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pointage"
        element={
          <ProtectedRoute roles={['ouvrier', 'admin']}>
            <Pointage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chantiers"
        element={
          <ProtectedRoute roles={['ouvrier', 'admin']}>
            <Chantiers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chantiers/:id"
        element={
          <ProtectedRoute roles={['ouvrier', 'admin']}>
            <TaskDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        }
      />

      {/* Espace admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminUserEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/taches"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/taches/:id"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminTaskEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/documents"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDocs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/documents/:id"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDocEdit />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
