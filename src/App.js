import React from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Calendar from './components/Calendar';
import EvaluationDetail from './components/EvaluationDetail';
import AdminPanel from './components/AdminPanel';
import EditPanel from './components/EditPanel';
import EditEvaluation from './components/EditEvaluation';
import AdminPage from './components/AdminPage';
import TutorialPanel from './components/TutorialPanel';
import PatchNote from './components/PatchNote';
import RecentChanges from './components/RecentChanges';
import MainPage from './components/MainPage';
import SearchPage from './components/SearchPage';
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
      <div className="suggestion-boxes">
        <div className="suggestion-box">
          <h2>기능 건의</h2>
          <p className="notice-text">
            필요한 기능이 있다면 편하게 건의해주세요.
          </p>
          <a 
            href="https://open.kakao.com/o/sBWuTFth" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="kakao-button"
          >
            개발자 오픈채팅으로 건의하기
          </a>
        </div>
        <div className="suggestion-box">
          <h2>오류 제보</h2>
          <p className="notice-text">
            수행평가 일정 등에 오류가 있다면 제보해주세요.
          </p>
          <a 
            href="https://open.kakao.com/o/sE2WiUth" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="kakao-button bug-report"
          >
            오픈채팅으로 오류 제보하기
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <Link to="/" className="header-title">
            <h1>창신고 수행평가 공지</h1>
          </Link>
          <nav className="nav-bar">
            <Link to="/calendar" className="nav-button">
              수행평가 일정 확인
            </Link>
            <Link to="/search" className="nav-button">
              수행평가 검색
            </Link>
            <Link to="/suggestion" className="nav-button">
              건의하기
            </Link>
            <Link to="/admin" className="nav-button">
              관리자
            </Link>
            <Link to="/patchnote" className="nav-button">
              패치 노트
            </Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/evaluation/:id" element={<EvaluationDetail />} />
            <Route path="/suggestion" element={<SuggestionPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/add" element={<AdminPanel />} />
            <Route path="/admin/edit" element={<EditPanel />} />
            <Route path="/admin/edit/:id" element={<EditEvaluation />} />
            <Route path="/tutorial" element={<TutorialPanel />} />
            <Route path="/patchnote" element={<PatchNote />} />
            <Route path="/recent-changes" element={<RecentChanges />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 