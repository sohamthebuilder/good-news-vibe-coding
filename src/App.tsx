import { useState } from 'react';
import { Header } from './components/Header';
import { FeedPage } from './components/FeedPage';
import { SettingsPanel } from './components/SettingsPage';
import { Footer } from './components/Footer';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900">
      <Header
        onSettingsToggle={() => setSettingsOpen((o) => !o)}
        settingsOpen={settingsOpen}
      />

      <FeedPage onOpenSettings={() => setSettingsOpen(true)} />

      <Footer />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
