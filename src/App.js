import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Calendar from './components/Calendar';
import EvaluationDetail from './components/EvaluationDetail';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>창신고 수행평가 공지</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Calendar />} />
            <Route path="/evaluation/:id" element={<EvaluationDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 