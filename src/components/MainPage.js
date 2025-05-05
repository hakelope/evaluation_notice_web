import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

function MainPage() {
  const navigate = useNavigate();

  return (
    <div className="main-page">
      <div className="main-content">
        <h1 className="main-title">창신고등학교<br/>수행평가 알리미</h1>
        <p className="main-description">
          수행평가 일정을 한눈에 확인하고 관리하세요.
        </p>
        
        <div className="main-buttons">
          <button 
            className="main-button calendar-btn"
            onClick={() => navigate('/calendar')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm2 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
            </svg>
            수행평가 일정 확인하기
          </button>
          
          <button 
            className="main-button suggestion-btn"
            onClick={() => navigate('/suggestion')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
            </svg>
            건의하기
          </button>
          
          <button 
            className="main-button admin-btn"
            onClick={() => navigate('/admin')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            관리자 페이지
          </button>
          
          <button 
            className="main-button patch-btn"
            onClick={() => navigate('/patchnote')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            패치 노트
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainPage; 