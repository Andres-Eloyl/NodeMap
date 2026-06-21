import { Routes, Route } from 'react-router-dom';
import { PeerView } from './views/PeerView';
import { DisplayView } from './views/DisplayView';
import { OrganizerView } from './views/OrganizerView';
import { BotView } from './views/BotView';
import { TestSignalingView } from './views/TestSignalingView';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PeerView />} />
      <Route path="/display.html" element={<DisplayView />} />
      <Route path="/display" element={<DisplayView />} />
      <Route path="/organizer.html" element={<OrganizerView />} />
      <Route path="/organizer" element={<OrganizerView />} />
      <Route path="/bot.html" element={<BotView />} />
      <Route path="/bot" element={<BotView />} />
      <Route path="/test-signaling.html" element={<TestSignalingView />} />
      <Route path="/test" element={<TestSignalingView />} />
    </Routes>
  );
}

export default App;
