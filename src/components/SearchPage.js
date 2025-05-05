import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchPage.css';

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 로컬 스토리지에서 수행평가 데이터 가져오기
    const storedEvaluations = JSON.parse(localStorage.getItem('evaluations')) || [];
    // 날짜순으로 정렬
    const sortedEvaluations = storedEvaluations.sort((a, b) => 
      new Date(b.startDate) - new Date(a.startDate)
    );
    setEvaluations(sortedEvaluations);
  }, []);

  useEffect(() => {
    // 검색어가 없으면 모든 수행평가 표시
    if (!searchTerm.trim()) {
      setFilteredEvaluations(evaluations);
      return;
    }

    // 검색어에 따라 수행평가 필터링
    const filtered = evaluations.filter(evaluation => 
      evaluation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvaluations(filtered);
  }, [searchTerm, evaluations]);

  const handleEvaluationClick = (id) => {
    navigate(`/evaluation/${id}`);
  };

  return (
    <div className="search-page-container">
      <div className="search-box">
        <input
          type="text"
          placeholder="수행평가 제목, 과목, 내용으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="search-results">
        <div className="board-header">
          <div className="header-item title">제목</div>
          <div className="header-item subject">과목</div>
          <div className="header-item grade">학년/반</div>
          <div className="header-item period">기간</div>
        </div>
        
        {filteredEvaluations.length > 0 ? (
          filteredEvaluations.map((evaluation) => (
            <div 
              key={evaluation.id} 
              className="evaluation-item"
              onClick={() => handleEvaluationClick(evaluation.id)}
            >
              <div className="item-title">{evaluation.title}</div>
              <div className="item-subject">{evaluation.subject}</div>
              <div className="item-grade">{evaluation.grade}학년 {evaluation.class}반</div>
              <div className="item-period">
                {new Date(evaluation.startDate).toLocaleDateString()} ~ {new Date(evaluation.endDate).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage; 