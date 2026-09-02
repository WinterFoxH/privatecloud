import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Files } from './pages/Files';
import { Media } from './pages/Media';
import { Sync } from './pages/Sync';
import { Sharing } from './pages/Sharing';
import { Dashboard } from './pages/admin/Dashboard';
import { DiskPool } from './pages/admin/DiskPool';
import { UseCaseDiagram } from './pages/UseCaseDiagram';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/files" replace />} />
              <Route path="files" element={<Files />} />
              <Route path="media" element={<Media />} />
              <Route path="sync" element={<Sync />} />
              <Route path="sharing" element={<Sharing />} />
              <Route path="admin/dashboard" element={<Dashboard />} />
              <Route path="admin/disks" element={<DiskPool />} />
              <Route path="diagram" element={<UseCaseDiagram />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
