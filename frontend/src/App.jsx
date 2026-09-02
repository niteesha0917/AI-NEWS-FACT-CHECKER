import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import CheckNews from './pages/CheckNews';
import Analysis from './pages/Analysis';
import Dashboard from './pages/Dashboard';
import About from './pages/About';

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<Navigate to="/dashboard?tab=history" replace />} />
        <Route path="/analytics" element={<Navigate to="/dashboard?tab=analytics" replace />} />
        <Route path="/profile" element={<Navigate to="/dashboard?tab=profile" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard?tab=settings" replace />} />
        <Route path="/check" element={<CheckNews />} />
        <Route path="/analysis/:id" element={<Analysis />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
