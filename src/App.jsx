import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SaudaForm from './pages/SaudaForm';
import DoGenerate from './pages/DoGenerate';
import GateIn from './pages/GateIn';
import TyreWeight from './pages/TyreWeight';
import GetLoading1st from './pages/GetLoading1st';
import GetLoading2nd from './pages/GetLoading2nd';
import FinalWeight from './pages/FinalWeight';
import QC from './pages/QC';
import MakeInvoice from './pages/MakeInvoice';
import GetOut from './pages/GetOut';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="sauda-form" element={<SaudaForm />} />
          <Route path="do-generate" element={<DoGenerate />} />
          <Route path="gate-in" element={<GateIn />} />
          <Route path="tyre-weight" element={<TyreWeight />} />
          <Route path="get-loading-1st" element={<GetLoading1st />} />
          <Route path="get-loading-2nd" element={<GetLoading2nd />} />
          <Route path="final-weight" element={<FinalWeight />} />
          <Route path="qc" element={<QC />} />
          <Route path="make-invoice" element={<MakeInvoice />} />
          <Route path="get-out" element={<GetOut />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;