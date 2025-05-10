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
  const [hiddenEvaluations, setHiddenEvaluations] = useState(() => {
    const saved = localStorage.getItem('hiddenEvaluations');
    return saved ? JSON.parse(saved) : [];
  });
  const [filters, setFilters] = useState(() => {
    const savedGrade = localStorage.getItem('selectedGrade');
    const savedClass = localStorage.getItem('selectedClass');
    
    // 로컬 스토리지에 저장된 값이 없으면 기본값 설정
    if (!savedGrade) {
      localStorage.setItem('selectedGrade', '1');
    }
    if (!savedClass) {
      localStorage.setItem('selectedClass', '1');
    }

    return {
      grade: savedGrade || '1',
      type: '',
      sortOrder: 'desc',
      class: savedClass || '1'
    };
  });
  const [showHidden, setShowHidden] = useState(false);
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

    // 기간이 지난 수행평가 필터링
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(evaluation => {
      if (!showHidden) {
        if (evaluation.evaluation_type === 'period') {
          const classDate = evaluation.class_dates?.find(cd => cd.class_number === filters.class);
          const endDate = classDate?.end_date || evaluation.default_end_date;
          return new Date(endDate) >= today;
        } else {
          const classDate = evaluation.class_dates?.find(cd => cd.class_number === filters.class);
          const date = classDate?.date || evaluation.default_date;
          return new Date(date) >= today;
        }
      }
      return true;
    });

    // 숨긴 과제 필터링
    if (showHidden) {
      // 숨겨진 과제만 보이도록 필터링
      filtered = filtered.filter(evaluation => hiddenEvaluations.includes(evaluation.id));
    } else {
      // 숨겨진 과제 제외
      filtered = filtered.filter(evaluation => !hiddenEvaluations.includes(evaluation.id));
    }

    // 날짜 정렬
    filtered.sort((a, b) => {
      const dateA = new Date(a.default_date);
      const dateB = new Date(b.default_date);
      return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredEvaluations(filtered);
  }, [searchTerm, evaluations, filters, showHidden, hiddenEvaluations]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: value
      };

      // 학년이나 반이 변경되면 로컬 스토리지에 저장
      if (filterType === 'grade') {
        localStorage.setItem('selectedGrade', value);
      } else if (filterType === 'class') {
        localStorage.setItem('selectedClass', value);
      }

      return newFilters;
    });
  };

  const resetFilters = () => {
    setFilters({
      grade: '1',
      type: '',
      sortOrder: 'desc',
      class: '1'
    });
    setSearchTerm('');
    setShowHidden(false);
    setHiddenEvaluations([]);
    localStorage.removeItem('hiddenEvaluations');
  };

  const toggleHidden = () => {
    setShowHidden(prev => !prev);
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

  const toggleEvaluationHidden = (id, e) => {
    e.stopPropagation();
    setHiddenEvaluations(prev => {
      const newHidden = prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id];
      localStorage.setItem('hiddenEvaluations', JSON.stringify(newHidden));
      return newHidden;
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
          <div className="filter-selects">
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
              <option value="desc">먼 순</option>
              <option value="asc">가까운 순</option>
            </select>

            <select 
              value={filters.class}
              onChange={(e) => handleFilterChange('class', e.target.value)}
              className="filter-select"
            >
              <option value="">모든 반</option>
              <option value="1">1반</option>
              <option value="2">2반</option>
              <option value="3">3반</option>
              <option value="4">4반</option>
              <option value="5">5반</option>
              <option value="6">6반</option>
              <option value="7">7반</option>
              <option value="8">8반</option>
              <option value="A">A반</option>
              <option value="B">B반</option>
              <option value="C">C반</option>
              <option value="D">D반</option>
            </select>
          </div>

          <button 
            onClick={toggleHidden}
            className={`hidden-button ${showHidden ? 'active' : ''}`}
          >
            {showHidden ? '숨겨진 과제 숨기기' : '숨겨진 과제 보기'}
          </button>
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
                  ? (() => {
                      const classDate = evaluation.class_dates?.find(cd => cd.class_number === filters.class);
                      if (classDate) {
                        return `${new Date(classDate.date).toLocaleDateString()} ~ ${classDate.end_date ? new Date(classDate.end_date).toLocaleDateString() : ''}`;
                      }
                      return `${new Date(evaluation.default_date).toLocaleDateString()} ~ ${evaluation.default_end_date ? new Date(evaluation.default_end_date).toLocaleDateString() : ''}`;
                    })()
                  : (() => {
                      const classDate = evaluation.class_dates?.find(cd => cd.class_number === filters.class);
                      return classDate ? new Date(classDate.date).toLocaleDateString() : new Date(evaluation.default_date).toLocaleDateString();
                    })()
                }
              </div>
              <div className="evaluation-badges">
                <div className="button-group">
                  <button
                    className={`hide-button ${hiddenEvaluations.includes(evaluation.id) ? 'hidden' : ''}`}
                    onClick={(e) => toggleEvaluationHidden(evaluation.id, e)}
                    title={hiddenEvaluations.includes(evaluation.id) ? '숨기기 취소' : '숨기기'}
                  >
                    {hiddenEvaluations.includes(evaluation.id) ? (
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                      </svg>
                    )}
                  </button>
                  <button
                    className={`complete-button ${completedEvaluations.includes(evaluation.id) ? 'completed' : ''}`}
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
                </div>
                {evaluation.evaluation_type === 'period' && (
                  <span className="period-badge">수행평가 기간</span>
                )}
                {evaluation.evaluation_type === 'submission' && (
                  <span className="submission-badge">제출 마감일</span>
                )}
                {evaluation.evaluation_type === 'implementation' && (
                  <span className="implementation-badge">실시일</span>
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