import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getEvaluations, updateEvaluation, deleteEvaluation } from '../services/evaluationService';
import { uploadImage, getImages, deleteImage } from '../services/imageService';
import { checkAuth, signOut } from '../config/supabase';
import './AdminPanel.css';

function EditPanel() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    highlightColor: '#61dafb',
    defaultDate: '',
    classDates: {},
    details: {
      type: '',
      requirements: [],
      materials: [],
      notes: ''
    },
    subjectType: 'general'
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    checkAuthentication();
    loadEvaluations();
  }, []);

  const checkAuthentication = async () => {
    const auth = await checkAuth();
    setIsAuthenticated(auth);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin');
    } catch (err) {
      console.error('로그아웃 에러:', err);
      setError('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const loadEvaluations = async () => {
    try {
      const data = await getEvaluations();
      setEvaluations(data);
    } catch (err) {
      setError('수행평가 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getFilteredEvaluations = () => {
    return evaluations.filter(evaluation => 
      evaluation.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getPaginatedEvaluations = () => {
    const filteredEvaluations = getFilteredEvaluations();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEvaluations.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredEvaluations().length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [name]: value
      }
    }));
  };

  const handleClassDateChange = (classNumber, date) => {
    setFormData(prev => ({
      ...prev,
      classDates: {
        ...prev.classDates,
        [classNumber]: date
      }
    }));
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    setLoading(true);
    setError(null);

    try {
      if (!formData.id) {
        setError('먼저 수행평가를 저장해주세요.');
        return;
      }

      for (let file of files) {
        const imageData = await uploadImage(formData.id, file);
        setImages(prev => [...prev, imageData]);
      }
    } catch (err) {
      console.error('이미지 업로드 에러:', err);
      if (err.message === '인증이 필요합니다. 로그인해주세요.') {
        setError('이미지를 업로드하려면 로그인이 필요합니다.');
      } else {
        setError('이미지 업로드에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateEvaluation(formData.id, formData);
      await loadEvaluations();
      resetForm();
    } catch (err) {
      console.error('수행평가 수정 중 에러:', err);
      setError(`수행평가 수정에 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      title: '',
      highlightColor: '#61dafb',
      defaultDate: '',
      classDates: {},
      details: {
        type: '',
        requirements: [],
        materials: [],
        notes: ''
      },
      subjectType: 'general'
    });
    setImages([]);
  };

  const handleEdit = (evaluation) => {
    navigate(`/admin/edit/${evaluation.id}`);
  };

  const loadImages = async (evaluationId) => {
    try {
      const imageData = await getImages(evaluationId);
      setImages(imageData);
    } catch (err) {
      console.error('이미지 로드 에러:', err);
      setError('이미지를 불러오는데 실패했습니다.');
    }
  };

  const handleDeleteEvaluation = async (id) => {
    if (window.confirm('정말로 이 수행평가를 삭제하시겠습니까?')) {
      try {
        setLoading(true);
        await deleteEvaluation(id);
        setEvaluations(prev => prev.filter(evaluation => evaluation.id !== id));
        setError(null);
      } catch (err) {
        console.error('수행평가 삭제 중 에러:', err);
        setError('수행평가 삭제에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <h2>수행평가 수정하기</h2>
        <div className="login-info">
          <p>이 페이지는 수행평가를 수정하고 관리하는 관리자 전용 페이지입니다.</p>
          <p>관리자 인증이 필요합니다.</p>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-nav">
        <Link to="/admin/add" className="nav-button">
          수행평가 추가하기
        </Link>
        <Link to="/admin/edit" className="nav-button active">
          수행평가 수정하기
        </Link>
        <Link to="/tutorial" className="nav-button">
          사용 가이드
        </Link>
      </div>
      <div className="admin-header">
        <h2>수행평가 수정하기</h2>
        <button onClick={handleLogout} className="logout-button">
          로그아웃
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="evaluations-list">
        <h3>등록된 수행평가</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="과목명 또는 제목으로 검색"
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        <div className="evaluations-container">
          {getPaginatedEvaluations().map(evaluation => (
            <div key={evaluation.id} className="evaluation-item">
              <h4>{evaluation.title}</h4>
              <p>과목: {evaluation.subject}</p>
              <p>날짜: {evaluation.default_date}</p>
              <div className="evaluation-type">
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
              <div className="evaluation-actions">
                <button onClick={() => handleEdit(evaluation)}>수정</button>
                <button onClick={() => handleDeleteEvaluation(evaluation.id)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="page-button"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`page-button ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="page-button"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {formData.id && (
        <form onSubmit={handleSubmit} className="evaluation-form">
          <div className="form-group">
            <label>과목 유형</label>
            <div className="subject-type-buttons">
              <label className="subject-type-label">
                <input
                  type="radio"
                  name="subjectType"
                  value="general"
                  checked={formData.subjectType === 'general'}
                  onChange={handleInputChange}
                />
                <span>일반과목</span>
              </label>
              <label className="subject-type-label">
                <input
                  type="radio"
                  name="subjectType"
                  value="elective"
                  checked={formData.subjectType === 'elective'}
                  onChange={handleInputChange}
                />
                <span>선택과목</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>과목</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>색상</label>
            <input
              type="color"
              name="highlightColor"
              value={formData.highlightColor}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>기본 날짜</label>
            <input
              type="date"
              name="defaultDate"
              value={formData.defaultDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>수업 일정</label>
            {formData.subjectType === 'general' ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(classNumber => (
                <div key={classNumber} className="class-date-input">
                  <label>{classNumber}반</label>
                  <input
                    type="date"
                    value={formData.classDates[classNumber] || ''}
                    onChange={(e) => handleClassDateChange(classNumber, e.target.value)}
                  />
                </div>
              ))
            ) : (
              ['A', 'B', 'C', 'D'].map(classLetter => (
                <div key={classLetter} className="class-date-input">
                  <label>{classLetter}반</label>
                  <input
                    type="date"
                    value={formData.classDates[classLetter] || ''}
                    onChange={(e) => handleClassDateChange(classLetter, e.target.value)}
                  />
                </div>
              ))
            )}
          </div>

          <div className="form-group">
            <label>유형</label>
            <input
              type="text"
              name="type"
              value={formData.details.type}
              onChange={handleDetailsChange}
              required
            />
          </div>

          <div className="form-group">
            <label>요구사항</label>
            <textarea
              name="requirements"
              value={formData.details.requirements.join('\n')}
              onChange={(e) => handleDetailsChange({
                target: {
                  name: 'requirements',
                  value: e.target.value.split('\n')
                }
              })}
            />
          </div>

          <div className="form-group">
            <label>준비물</label>
            <div className="materials-input">
              <input
                type="text"
                value={formData.details.materials.join(', ')}
                onChange={(e) => handleDetailsChange({
                  target: {
                    name: 'materials',
                    value: e.target.value.split(',').map(item => item.trim())
                  }
                })}
                placeholder="준비물을 쉼표로 구분하여 입력하세요"
              />
            </div>
          </div>

          <div className="form-group">
            <label>비고</label>
            <textarea
              name="notes"
              value={formData.details.notes}
              onChange={handleDetailsChange}
            />
          </div>

          <div className="form-group">
            <label>이미지</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={loading}
            />
            <div className="image-preview">
              {images.map(image => (
                <div key={image.id} className="image-item">
                  <img src={image.url} alt="업로드된 이미지" />
                  <button
                    type="button"
                    onClick={() => deleteImage(image.id)}
                    className="delete-button"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </button>
            <button type="button" onClick={resetForm}>
              취소
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default EditPanel; 