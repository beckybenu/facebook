import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AiFab from './components/AiFab'

// Auth
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Signup from './pages/Signup'

// App
import Home from './pages/Home'
import TableauBord from './pages/TableauBord'
import Profile from './pages/Profile'
import Pointage from './pages/Pointage'
import Chantiers from './pages/Chantiers'
import TaskDetail from './pages/TaskDetail'
import Documents from './pages/Documents'
import Absences from './pages/Absences'
import Planning from './pages/Planning'
import NotesFrais from './pages/NotesFrais'
import Annonces from './pages/Annonces'
import Vehicules from './pages/Vehicules'
import Rappels from './pages/Rappels'
import Notifications from './pages/Notifications'
import ServerSettings from './pages/ServerSettings'
import AIAssistant from './pages/AIAssistant'
import LlmSettings from './pages/LlmSettings'
import ConnectorSettings from './pages/ConnectorSettings'
import DevisList from './pages/DevisList'
import DevisEdit from './pages/DevisEdit'
import DevisView from './pages/DevisView'

// Admin
import NasSearch from './pages/NasSearch'
import AdminHome from './pages/admin/AdminHome'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserEdit from './pages/admin/AdminUserEdit'
import AdminTasks from './pages/admin/AdminTasks'
import AdminTaskEdit from './pages/admin/AdminTaskEdit'
import AdminDocs from './pages/admin/AdminDocs'
import AdminDocEdit from './pages/admin/AdminDocEdit'
import AdminPointages from './pages/admin/AdminPointages'
import AdminWorkerHours from './pages/admin/AdminWorkerHours'

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Chargement…</div>

  return (
    <>
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
          <ProtectedRoute cap="pointer">
            <Pointage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chantiers"
        element={
          <ProtectedRoute cap="chantiers">
            <Chantiers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chantiers/:id"
        element={
          <ProtectedRoute cap="chantiers">
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

      {/* Module RH */}
      <Route
        path="/tableau-de-bord"
        element={
          <ProtectedRoute cap="tableauBord">
            <TableauBord />
          </ProtectedRoute>
        }
      />
      <Route
        path="/absences"
        element={
          <ProtectedRoute cap="absences">
            <Absences />
          </ProtectedRoute>
        }
      />
      <Route
        path="/planning"
        element={
          <ProtectedRoute cap="planning">
            <Planning />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes-frais"
        element={
          <ProtectedRoute cap="frais">
            <NotesFrais />
          </ProtectedRoute>
        }
      />
      <Route
        path="/annonces"
        element={
          <ProtectedRoute cap="annonces">
            <Annonces />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicules"
        element={
          <ProtectedRoute cap="vehicules">
            <Vehicules />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rappels"
        element={
          <ProtectedRoute cap="rappels">
            <Rappels />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute cap="staff">
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parametres"
        element={
          <ProtectedRoute>
            <ServerSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute cap="assistant">
            <AIAssistant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ia-config"
        element={
          <ProtectedRoute cap="assistant">
            <LlmSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/connecteur"
        element={
          <ProtectedRoute cap="assistant">
            <ConnectorSettings />
          </ProtectedRoute>
        }
      />

      {/* Devis — accessibles aux employés (ouvrier/admin) */}
      <Route
        path="/devis"
        element={
          <ProtectedRoute cap="devis">
            <DevisList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/devis/new"
        element={
          <ProtectedRoute cap="devis">
            <DevisEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/devis/:id"
        element={
          <ProtectedRoute cap="devis">
            <DevisView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/devis/:id/edit"
        element={
          <ProtectedRoute cap="devis">
            <DevisEdit />
          </ProtectedRoute>
        }
      />


      {/* Recherche NAS : administrateur autorisé, en mode serveur uniquement */}
      <Route
        path="/admin/nas"
        element={
          <ProtectedRoute roles={['admin']}>
            {user?.id === 'usr_mw0gfrh4_4lb1v9' && !!localStorage.getItem('sp_server_url')
              ? <NasSearch />
              : <Navigate to="/home" replace />}
          </ProtectedRoute>
        }
      />

      {/* Espace admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute cap="manageUsers">
            <AdminHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute cap="manageUsers">
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <ProtectedRoute cap="manageUsers">
            <AdminUserEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/taches"
        element={
          <ProtectedRoute cap="manageUsers">
            <AdminTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/taches/:id"
        element={
          <ProtectedRoute cap="manageUsers">
            <AdminTaskEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/documents"
        element={
          <ProtectedRoute cap="manageUsers">
            <AdminDocs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pointages"
        element={
          <ProtectedRoute cap="manageUsers">
            <AdminPointages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pointages/:userId"
        element={
          <ProtectedRoute cap="manageUsers">
            <AdminWorkerHours />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/documents/:id"
        element={
          <ProtectedRoute cap="manageUsers">
            <AdminDocEdit />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <AiFab />
    </>
  )
}
