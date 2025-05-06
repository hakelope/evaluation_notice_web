import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvaluations } from '../services/evaluationService';
import './SearchPage.css';

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedEvaluations, setCompletedEvaluations] = useState(() => {
    const saved = localStorage.getItem('completedEvaluations');
    return saved ? JSON.parse(saved) : [];
  });
  const [filters, setFilters] = useState({
    grade: '',
    type: '',
    sortOrder: 'desc'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const data = await getEvaluations();
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
    let filtered = evaluations;

    // 검색어 필터링
    if (searchTerm.trim()) {
      filtered = filtered.filter(evaluation => 
        evaluation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (evaluation.evaluation_details?.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 학년 필터링
    if (filters.grade) {
      filtered = filtered.filter(evaluation => 
        String(evaluation.grade) === filters.grade
      );
    }

    // 평가 유형 필터링
    if (filters.type) {
      filtered = filtered.filter(evaluation => 
        evaluation.evaluation_type === filters.type
      );
    }

    // 날짜 정렬
    filtered.sort((a, b) => {
      const dateA = new Date(a.default_date);
      const dateB = new Date(b.default_date);
      return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredEvaluations(filtered);
  }, [searchTerm, evaluations, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      grade: '',
      type: '',
      sortOrder: 'desc'
    });
    setSearchTerm('');
  };

  const handleEvaluationClick = (id) => {
    navigate(`/evaluation/${id}`);
  };

  const toggleEvaluationComplete = (id, e) => {
    e.stopPropagation();
    setCompletedEvaluations(prev => {
      const newCompleted = prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id];
      localStorage.setItem('completedEvaluations', JSON.stringify(newCompleted));
      return newCompleted;
    });
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

      <div className="filter-section">
        <div className="filter-group">
          <select 
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
            className="filter-select"
          >
            <option value="">모든 학년</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>

          <select 
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="filter-select"
          >
            <option value="">모든 유형</option>
            <option value="period">수행평가 기간</option>
            <option value="submission">제출 마감일</option>
            <option value="implementation">실시일</option>
          </select>

          <select 
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="filter-select"
          >
            <option value="desc">가까운 순</option>
            <option value="asc">먼 순</option>
          </select>
        </div>

        <button 
          onClick={resetFilters}
          className="reset-filters-button"
        >
          필터 초기화
        </button>
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