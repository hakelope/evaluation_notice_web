import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvaluations } from '../services/evaluationService';
import './SearchPage.css';

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedEvaluations, setCompletedEvaluations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const data = await getEvaluations();
        // 날짜순으로 정렬
        const sortedEvaluations = data.sort((a, b) => 
          new Date(b.default_date) - new Date(a.default_date)
        );
        setEvaluations(sortedEvaluations);
        setFilteredEvaluations(sortedEvaluations);
      } catch (error) {
        console.error('수행평가 목록을 불러오는데 실패했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
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
      (evaluation.evaluation_details?.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvaluations(filtered);
  }, [searchTerm, evaluations]);

  const handleEvaluationClick = (id) => {
    navigate(`/evaluation/${id}`);
  };

  const toggleEvaluationComplete = (id, e) => {
    e.stopPropagation();
    if (completedEvaluations.includes(id)) {
      setCompletedEvaluations(completedEvaluations.filter((i) => i !== id));
    } else {
      setCompletedEvaluations([...completedEvaluations, id]);
    }
  };

  if (loading) {
    return (
      <div className="search-page-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

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
          <div className="header-item grade">학년</div>
          <div className="header-item period">기간/일시</div>
        </div>
        
        {filteredEvaluations.length > 0 ? (
          filteredEvaluations.map((evaluation) => (
            <div className="search-evaluation-item"
              key={evaluation.id} 
              onClick={() => handleEvaluationClick(evaluation.id)}
              style={{
                '--highlight-color': evaluation.highlight_color || '#ffeb3b'
              }}
            >
              <div className="search-item-title">
                {evaluation.title}
                <span className="search-item-period-mobile">
                  {evaluation.evaluation_type === 'period' 
                    ? `${new Date(evaluation.default_date).toLocaleDateString()} ~ ${evaluation.default_end_date ? new Date(evaluation.default_end_date).toLocaleDateString() : ''}`
                    : new Date(evaluation.default_date).toLocaleDateString()
                  }
                </span>
              </div>
              <div className="search-item-subject">{evaluation.subject}</div>
              <div className="search-item-grade">{evaluation.grade}학년</div>
              <div className="search-item-period">
                {evaluation.evaluation_type === 'period' 
                  ? `${new Date(evaluation.default_date).toLocaleDateString()} ~ ${evaluation.default_end_date ? new Date(evaluation.default_end_date).toLocaleDateString() : ''}`
                  : new Date(evaluation.default_date).toLocaleDateString()
                }
              </div>
              <div className="search-evaluation-badges">
                <button
                  className={`search-complete-button ${completedEvaluations.includes(evaluation.id) ? 'completed' : ''}`}
                  onClick={(e) => toggleEvaluationComplete(evaluation.id, e)}
                  title={completedEvaluations.includes(evaluation.id) ? '완료 취소' : '완료하기'}
                >
                  {completedEvaluations.includes(evaluation.id) ? (
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  )}
                </button>
                {evaluation.evaluation_type === 'period' && (
                  <span className="search-period-badge">수행평가 기간</span>
                )}
                {evaluation.evaluation_type === 'submission' && (
                  <span className="search-submission-badge">제출 마감일</span>
                )}
                {evaluation.evaluation_type === 'implementation' && (
                  <span className="search-implementation-badge">실시일</span>
                )}
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