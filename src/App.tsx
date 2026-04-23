import { Routes, Route } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import Vote from './pages/Vote';
import Results from './pages/Results';
import Layout from './components/Layout';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/oyla" element={<Vote />} />
        <Route path="/sonuc" element={<Results />} />
      </Routes>
    </Layout>
  );
}
