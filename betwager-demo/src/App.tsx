import { Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import { Login, Register } from "./pages/Auth";
import { GamesList, GameDetail } from "./pages/Games";
import { WagersLobby, WagerCreate, WagerDetail } from "./pages/Wagers";
import { TournamentsList, TournamentDetail } from "./pages/Tournaments";
import Leaderboard from "./pages/Leaderboard";
import { Wallet, Notifications } from "./pages/Wallet";
import { MyProfile, PublicProfile } from "./pages/Profile";
import {
  AdminDashboard,
  AdminDisputes,
  AdminTournaments,
  AdminUsers,
} from "./pages/Admin";
import {
  About,
  FAQ,
  HowItWorks,
  Privacy,
  Support,
  Terms,
} from "./pages/Static";
import { EmptyState } from "./ui";
import { Link } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="games" element={<GamesList />} />
        <Route path="games/:slug" element={<GameDetail />} />
        <Route path="wagers" element={<WagersLobby />} />
        <Route path="wagers/create" element={<WagerCreate />} />
        <Route path="wagers/:id" element={<WagerDetail />} />
        <Route path="tournaments" element={<TournamentsList />} />
        <Route path="tournaments/:id" element={<TournamentDetail />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="players/:username" element={<PublicProfile />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/disputes" element={<AdminDisputes />} />
        <Route path="admin/tournaments" element={<AdminTournaments />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="about" element={<About />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="support" element={<Support />} />
        <Route
          path="*"
          element={
            <EmptyState
              title="Page introuvable"
              action={
                <Link to="/" className="btn-primary">
                  Retour à l'accueil
                </Link>
              }
            />
          }
        />
      </Route>
    </Routes>
  );
}
