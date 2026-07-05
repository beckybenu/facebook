import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Predictions } from './pages/Predictions'
import { Parlays } from './pages/Parlays'
import { Leagues } from './pages/Leagues'
import { WorldCup } from './pages/WorldCup'
import { MatchDetail } from './pages/MatchDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="predictions" element={<Predictions />} />
        <Route path="parlays" element={<Parlays />} />
        <Route path="leagues" element={<Leagues />} />
        <Route path="worldcup" element={<WorldCup />} />
        <Route path="match/:id" element={<MatchDetail />} />
      </Route>
    </Routes>
  )
}
