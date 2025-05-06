import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import './RecentChanges.css';

function RecentChanges() {
  const [changes, setChanges] = useState([]);
  const [filteredChanges, setFilteredChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    grade: 'all',
    evaluationType: 'all',
    changeType: 'all'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchChanges();
  }, []);

  useEffect(() => {
    filterChanges();
  }, [changes, filters]);

  const filterChanges = () => {
    let filtered = [...changes];
    
    if (filters.grade !== 'all') {
      filtered = filtered.filter(change => change.details?.grade === filters.grade);
    }
    
    if (filters.evaluationType !== 'all') {
      filtered = filtered.filter(change => change.details?.evaluation_type === filters.evaluationType);
    }
    
    if (filters.changeType !== 'all') {
      filtered = filtered.filter(change => change.change_type === filters.changeType);
    }
    
    setFilteredChanges(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchChanges = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString();

      const { data, error } = await supabase
        .from('evaluation_changes')
        .select(`
          *,
          evaluation:evaluation_id (
            id,
            title,
            subject,
            grade,
            evaluation_type
          )
        `)
        .gte('created_at', oneWeekAgoStr)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // evaluation_id와 evaluation 정보를 직접 데이터에 추가
      const processedData = data.map(change => ({
        ...change,
        evaluation_id: change.evaluation?.id,
        title: change.title || change.evaluation?.title,
        details: {
          ...change.details,
          subject: change.details?.subject || change.evaluation?.subject,
          grade: change.details?.grade || change.evaluation?.grade,
          evaluation_type: change.details?.evaluation_type || change.evaluation?.evaluation_type
        }
      }));
      
      setChanges(processedData || []);
    } catch (error) {
      console.error('변경 사항을 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeTypeText = (type) => {
    switch (type) {
      case 'add':
        return '추가됨';
      case 'update':
        return '수정됨';
      case 'delete':
        return '삭제됨';
      default:
        return type;
    }
  };

  const handleTitleClick = (evaluationId) => {
    if (evaluationId) {
      navigate(`/evaluation/${evaluationId}`);
    }
  };

  return (
    <div className="recent-changes-container">
      <h2>최근 1주일간의 수행평가 변경 사항</h2>
      
      <div className="recent-filters-container">
        <div className="recent-filter-group">
          <label>학년</label>
          <select name="grade" value={filters.grade} onChange={handleFilterChange}>
            <option value="all">전체</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>
        </div>
        
        <div className="recent-filter-group">
          <label>평가 유형</label>
          <select name="evaluationType" value={filters.evaluationType} onChange={handleFilterChange}>
            <option value="all">전체</option>
            <option value="period">수행평가 기간</option>
            <option value="submission">제출 마감일</option>
            <option value="implementation">실시일</option>
          </select>
        </div>
        
        <div className="recent-filter-group">
          <label>수정 유형</label>
          <select name="changeType" value={filters.changeType} onChange={handleFilterChange}>
            <option value="all">전체</option>
            <option value="add">추가됨</option>
            <option value="update">수정됨</option>
            <option value="delete">삭제됨</option>
          </select>
        </div>
      </div>

      <div className="changes-list">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : filteredChanges.length > 0 ? (
          filteredChanges.map((change) => (
            <div key={change.id} className="change-item">
              <div className="change-header">
                <span className="change-type" data-type={change.change_type}>
                  {getChangeTypeText(change.change_type)}
                </span>
                <span className="change-date">{formatDate(change.created_at)}</span>
              </div>
              <div className="change-content">
                <h3 
                  className={change.evaluation_id ? 'clickable-title' : ''}
                  onClick={() => change.evaluation_id && handleTitleClick(change.evaluation_id)}
                >
                  {change.title}
                </h3>
                {change.details && (
                  <div className="change-details">
                    <div className="detail-item">
                      <span className="detail-label">평가 유형</span>
                      <span className={`detail-value evaluation-type-badge ${change.details.evaluation_type}`}>
                        {change.details.evaluation_type === 'period' && '수행평가 기간'}
                        {change.details.evaluation_type === 'submission' && '제출 마감일'}
                        {change.details.evaluation_type === 'implementation' && '실시일'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">학년</span>
                      <span className="detail-value grade-badge">
                        {change.details.grade}학년
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">과목</span>
                      <span className="detail-value subject-badge">
                        {change.details.subject}
                      </span>
                    </div>
                  </div>
                )}
                {change.details?.changes && change.details.changes.length > 0 && (
                  <div className="changes-list">
                    {change.details.changes.map((changeItem, index) => (
                      <span key={index} className="change-item-text">{changeItem}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-changes">
            {changes.length > 0 ? '선택한 필터에 맞는 변경 사항이 없습니다.' : '최근 1주일간 변경된 수행평가가 없습니다.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentChanges; 