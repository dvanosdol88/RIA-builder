import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import ConstructionZone from './ConstructionZone';
import CapacityCalculator from './components/CapacityCalculator';

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<ConstructionZone />} />
          <Route path="/calculator" element={<CapacityCalculator />} />
          <Route path="*" element={<ConstructionZone />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
