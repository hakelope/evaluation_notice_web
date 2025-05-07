import React, { useEffect } from 'react';
import './Credit.css';

function Credit() {
  useEffect(() => {
    const cards = document.querySelectorAll('.credit-item');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${rect.width / 2}px`);
      card.style.setProperty('--mouse-y', '0px');
    });
  }, []);

  const handleMouseEnter = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.classList.add('active');
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.classList.remove('active');
  };

  return (
    <div className="credit-page">
      <div className="credit-content">
        <h1>크레딧</h1>
        
        <div className="credit-section">
          <h2>개발</h2>
          <div className="credit-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3>30402 김기륭</h3>
            <p>프론트엔드 개발, 디자인</p>
          </div>
        </div>

        <div className="credit-section">
          <h2>기여</h2>
          <div className="credit-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3>창신고등학교 학생들</h3>
            <p>피드백 및 제안</p>
          </div>
          <div className="credit-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3>김아름 선생님</h3>
            <p>전체적 피드백 및 1학년 설문조사 참여 독려</p>
          </div>
          <div className="credit-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3>2학년부 선생님들</h3>
            <p>2학년 설문조사 참여 독려</p>
          </div>
          <div className="credit-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3>3학년부 선생님들</h3>
            <p>3학년 설문조사 참여 독려</p>
          </div>
          <div className="credit-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3>창신고의 모든 선생님</h3>
            <p>웹 도입 관련 설문 조사 참여</p>
          </div>
        </div>

        <div className="credit-section">
          <h2>사용된 기술</h2>
          <div className="credit-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3>Frontend</h3>
            <p>React, CSS3</p>
          </div>
          <div className="credit-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3>Backend</h3>
            <p>Supabase</p>
          </div>
        </div>

        <div className="credit-section">
          <h2>AI 도구</h2>
          <div className="credit-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3>Cursor.AI</h3>
            <p>개발 및 디자인 지원</p>
          </div>
        </div>

        <div className="credit-section">
          <h2>특별 감사</h2>
          <div className="credit-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3>창신고등학교</h3>
            <p>이 서비스를 사용할 수 있게 해주셔서 감사합니다.</p>
          </div>
        </div>

        <div className="credit-footer">
          <p>changSINON-창신고등학교 수행평가 알리미</p>
          <p>버전 1.5.1</p>
        </div>
      </div>
    </div>
  );
}

export default Credit; 