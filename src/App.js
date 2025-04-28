import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Calendar from './components/Calendar';
import EvaluationDetail from './components/EvaluationDetail';
import AdminPanel from './components/AdminPanel';
import './App.css';

function AddEvaluationPage() {
  return (
    <div className="add-evaluation-page">
      <h2>수행평가 추가 안내</h2>
      <p className="notice-text">
        현재 개발자의 데이터베이스 지식이 부족해, 개발자가 직접 웹에 추가하는 방법으로만 수행평가를 추가할 수 있습니다. 죄송합니다,,

        <br/><br/>  2025/04/29 01:36 - 데이터베이스를 배워서 추가햇습니다. 관리자 탭을 확인해주세요.
      </p>
    </div>
  );
}

function SuggestionPage() {
  return (
    <div className="suggestion-page">
      <h2>기능 건의</h2>
      <p className="notice-text">
        필요한 기능이 있다면 편하게 건의해주세요.
      </p>
      <a 
        href="https://open.kakao.com/your-chat-link" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="kakao-button"
      >
        개발자 오픈채팅으로 건의하기
      </a>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>창신고 수행평가 공지</h1>
          <nav className="nav-bar">
            <Link to="/" className="nav-button">
              수행평가 일정 확인
            </Link>
            <Link to="/suggestion" className="nav-button">
              건의하기
            </Link>
            <Link to="/admin" className="nav-button">
              수행평가 추가하기
            </Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Calendar />} />
            <Route path="/evaluation/:id" element={<EvaluationDetail />} />
            <Route path="/suggestion" element={<SuggestionPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Calendar />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 