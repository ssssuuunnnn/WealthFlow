import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { DashboardPage } from './pages/DashboardPage';
import { DataEntryPage } from './pages/DataEntryPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent = () => {
  const { currentPage } = useApp();

  const pages = {
    dashboard: <DashboardPage />,
    'data-entry': <DataEntryPage />,
    history: <HistoryPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <TopNavbar />
      <main className="ml-56 pt-14 p-6 min-h-screen">
        {pages[currentPage]}
      </main>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
