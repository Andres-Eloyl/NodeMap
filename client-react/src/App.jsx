import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { HomeView } from './views/HomeView';
import { PeerView } from './views/PeerView';
import { DisplayView } from './views/DisplayView';
import { OrganizerView } from './views/OrganizerView';
import { BotView } from './views/BotView';
import { TestSignalingView } from './views/TestSignalingView';
import { WorkLoginView } from './views/WorkLoginView';
import { WorkDashboardView } from './views/WorkDashboardView';
import { NetworkBackground } from './components/NetworkBackground';
import { initLocalDB } from './utils/localDB';
import { solicitarPermiso } from './utils/notificaciones';

function App() {
  useEffect(() => {
    initLocalDB().catch(console.error);
    solicitarPermiso().catch(console.error);
  }, []);

  return (
    <>
      <NetworkBackground />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/map" element={<PeerView />} />
        <Route path="/work/login" element={<WorkLoginView />} />
        <Route path="/work/app" element={<WorkDashboardView />} />
        
        {/* Legacy / Direct Routes */}
        <Route path="/display.html" element={<DisplayView />} />
        <Route path="/display" element={<DisplayView />} />
        <Route path="/organizer.html" element={<OrganizerView />} />
        <Route path="/organizer" element={<OrganizerView />} />
        <Route path="/bot.html" element={<BotView />} />
        <Route path="/bot" element={<BotView />} />
        <Route path="/test-signaling.html" element={<TestSignalingView />} />
        <Route path="/test" element={<TestSignalingView />} />
      </Routes>
    </>
  );
}

export default App;
