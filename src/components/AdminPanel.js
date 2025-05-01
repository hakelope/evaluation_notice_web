import React, { useState, useEffect } from 'react';
import { getEvaluations, addEvaluation, updateEvaluation, deleteEvaluation } from '../services/evaluationService';
import { uploadImage, getImages, deleteImage } from '../services/imageService';
import { checkAuth, signIn, signOut } from '../config/supabase';
import { Link, useNavigate } from 'react-router-dom';
import './AdminPanel.css';

function AdminPanel() {
  const [evaluations, setEvaluations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    highlightColor: '#61dafb',
    defaultDate: '',
    defaultEndDate: '',
    classDates: {},
    classEndDates: {},
    details: {
      type: '',
      requirements: [],
      materials: [],
      notes: ''
    },
    subjectType: 'general',
    evaluationType: '',
    grade: '1'  // 기본값 1학년
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [newMaterial, setNewMaterial] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const auth = await checkAuth();
    setIsAuthenticated(auth);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(loginForm.email, loginForm.password);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('로그인 에러:', err);
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
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

  const handleClassEndDateChange = (classNumber, date) => {
    setFormData(prev => ({
      ...prev,
      classEndDates: {
        ...prev.classEndDates,
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
      // 수행평가 저장
      const evaluationData = {
        ...formData,
        evaluation_type: formData.evaluationType,
        default_end_date: formData.evaluationType === 'period' ? formData.defaultEndDate : null,
        class_dates: Object.entries(formData.classDates).map(([classNumber, date]) => ({
          class_number: classNumber,
          date: date,
          end_date: formData.evaluationType === 'period' ? formData.classEndDates[classNumber] : null
        }))
      };

      const savedEvaluation = await addEvaluation(evaluationData);
      
      // 이미지 업로드
      const imageFiles = document.querySelector('input[type="file"]').files;
      if (imageFiles && imageFiles.length > 0) {
        for (let file of imageFiles) {
          await uploadImage(savedEvaluation.id, file);
        }
      }
      
      resetForm();
    } catch (err) {
      console.error('수행평가 저장 중 에러:', err);
      setError(`수행평가 저장에 실패했습니다: ${err.message}`);
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
      defaultEndDate: '',
      classDates: {},
      classEndDates: {},
      details: {
        type: '',
        requirements: [],
        materials: [],
        notes: ''
      },
      subjectType: 'general',
      evaluationType: '',
      grade: '1'
    });
    setImages([]);
  };

  const handleEdit = (evaluation) => {
    setIsEditing(true);
    // 데이터 구조 변환
    const formData = {
      id: evaluation.id,
      subject: evaluation.subject,
      title: evaluation.title,
      highlightColor: evaluation.highlight_color,
      defaultDate: evaluation.default_date,
      defaultEndDate: evaluation.default_end_date,
      classDates: {},
      classEndDates: {},
      details: {
        type: evaluation.evaluation_details?.type || '',
        requirements: evaluation.evaluation_details?.requirements || [],
        materials: evaluation.evaluation_details?.materials || [],
        notes: evaluation.evaluation_details?.notes || ''
      },
      subjectType: evaluation.subject_type || 'general',
      evaluationType: evaluation.evaluation_type || 'single',
      grade: evaluation.grade || '1'
    };

    // class_dates 배열을 객체로 변환
    evaluation.class_dates?.forEach(cd => {
      formData.classDates[cd.class_number] = cd.date;
      if (evaluation.evaluation_type === 'period') {
        formData.classEndDates[cd.class_number] = cd.end_date;
      }
    });

    setFormData(formData);
    loadImages(evaluation.id);
  };

  const loadImages = async (evaluationId) => {
    try {
      console.log('이미지 로드 시도:', evaluationId);
      const imageData = await getImages(evaluationId);
      console.log('로드된 이미지 데이터:', imageData);
      setImages(imageData);
    } catch (err) {
      console.error('이미지 로드 에러:', err);
      setError('이미지를 불러오는데 실패했습니다.');
    }
  };

  const handleAddMaterial = () => {
    if (newMaterial.trim()) {
      setFormData(prev => ({
        ...prev,
        details: {
          ...prev.details,
          materials: [...prev.details.materials, newMaterial.trim()]
        }
      }));
      setNewMaterial('');
    }
  };

  const handleRemoveMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        materials: prev.details.materials.filter((_, i) => i !== index)
      }
    }));
  };

  const handleMaterialKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMaterial();
    }
  };

  const handleDeleteEvaluation = async (id) => {
    if (window.confirm('정말로 이 수행평가를 삭제하시겠습니까?')) {
      try {
        setLoading(true);
        await deleteEvaluation(id);
        // 삭제 후 목록 즉시 업데이트
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

  const handleSubjectTypeChange = (e) => {
    const subjectType = e.target.value;
    setFormData(prev => ({
      ...prev,
      subjectType,
      classDates: {},
      classEndDates: {}
    }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
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

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <h2>수행평가 추가하기</h2>
        <div className="login-info">
          <p>이 페이지는 수행평가를 추가하는 관리자 전용 페이지입니다.</p>
          <p>관리자 인증이 필요합니다.</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-nav">
        <Link to="/admin/add" className="nav-button active">
          수행평가 추가하기
        </Link>
        <Link to="/admin/edit" className="nav-button">
          수행평가 수정하기
        </Link>
        <Link to="/tutorial" className="nav-button">
          사용 가이드
        </Link>
      </div>
      <div className="admin-header">
        <h2>수행평가 추가하기</h2>
        <button onClick={handleLogout} className="logout-button">
          로그아웃
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
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
          <label>학년 <span className="required">*</span></label>
          <div className="subject-type-buttons">
            <label className="subject-type-label">
              <input
                type="radio"
                name="grade"
                value="1"
                checked={formData.grade === '1'}
                onChange={handleInputChange}
                required
              />
              <span>1학년</span>
            </label>
            <label className="subject-type-label">
              <input
                type="radio"
                name="grade"
                value="2"
                checked={formData.grade === '2'}
                onChange={handleInputChange}
                required
              />
              <span>2학년</span>
            </label>
            <label className="subject-type-label">
              <input
                type="radio"
                name="grade"
                value="3"
                checked={formData.grade === '3'}
                onChange={handleInputChange}
                required
              />
              <span>3학년</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>수행평가 유형 <span className="required">*</span></label>
          <div className="subject-type-buttons">
            <label className="subject-type-label">
              <input
                type="radio"
                name="evaluationType"
                value="submission"
                checked={formData.evaluationType === 'submission'}
                onChange={handleInputChange}
                required
              />
              <span>제출 마감일</span>
            </label>
            <label className="subject-type-label">
              <input
                type="radio"
                name="evaluationType"
                value="implementation"
                checked={formData.evaluationType === 'implementation'}
                onChange={handleInputChange}
                required
              />
              <span>실시일</span>
            </label>
            <label className="subject-type-label">
              <input
                type="radio"
                name="evaluationType"
                value="period"
                checked={formData.evaluationType === 'period'}
                onChange={handleInputChange}
                required
              />
              <span>수행평가 기간</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>과목 <span className="required">*</span></label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="예: 수학, 영어, 과학"
            required
          />
        </div>

        <div className="form-group">
          <label>제목 <span className="required">*</span></label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="예: 1학기 중간고사"
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
          <label>기본 날짜 <span className="required">*</span></label>
          {formData.evaluationType === 'period' ? (
            <div className="date-range-inputs">
              <div className="date-input">
                <label>시작일</label>
                <input
                  type="date"
                  name="defaultDate"
                  value={formData.defaultDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="date-input">
                <label>종료일</label>
                <input
                  type="date"
                  name="defaultEndDate"
                  value={formData.defaultEndDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          ) : (
            <input
              type="date"
              name="defaultDate"
              value={formData.defaultDate}
              onChange={handleInputChange}
              required
            />
          )}
        </div>

        <div className="form-group">
          <label>반 별 날짜 (공백 시 해당 반은 기본 날짜)</label>
          {formData.subjectType === 'general' ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map(classNumber => (
              <div key={classNumber} className="class-date-input">
                <label>{classNumber}반</label>
                {formData.evaluationType === 'period' ? (
                  <div className="date-range-inputs">
                    <div className="date-input">
                      <input
                        type="date"
                        value={formData.classDates[classNumber] || ''}
                        onChange={(e) => handleClassDateChange(classNumber, e.target.value)}
                        placeholder="시작일"
                      />
                    </div>
                    <div className="date-input">
                      <input
                        type="date"
                        value={formData.classEndDates[classNumber] || ''}
                        onChange={(e) => handleClassEndDateChange(classNumber, e.target.value)}
                        placeholder="종료일"
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={formData.classDates[classNumber] || ''}
                    onChange={(e) => handleClassDateChange(classNumber, e.target.value)}
                  />
                )}
              </div>
            ))
          ) : (
            ['A', 'B', 'C', 'D'].map(classLetter => (
              <div key={classLetter} className="class-date-input">
                <label>{classLetter}반</label>
                {formData.evaluationType === 'period' ? (
                  <div className="date-range-inputs">
                    <div className="date-input">
                      <input
                        type="date"
                        value={formData.classDates[classLetter] || ''}
                        onChange={(e) => handleClassDateChange(classLetter, e.target.value)}
                        placeholder="시작일"
                      />
                    </div>
                    <div className="date-input">
                      <input
                        type="date"
                        value={formData.classEndDates[classLetter] || ''}
                        onChange={(e) => handleClassEndDateChange(classLetter, e.target.value)}
                        placeholder="종료일"
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={formData.classDates[classLetter] || ''}
                    onChange={(e) => handleClassDateChange(classLetter, e.target.value)}
                  />
                )}
              </div>
            ))
          )}
        </div>

        <div className="form-group">
          <label>유형 <span className="required">*</span></label>
          <input
            type="text"
            name="type"
            value={formData.details.type}
            onChange={handleDetailsChange}
            placeholder="예: 필기시험, 실기평가, 발표"
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
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              onKeyPress={handleMaterialKeyPress}
              placeholder="준비물을 입력하고 Enter 또는 추가 버튼을 클릭하세요"
            />
            <button type="button" onClick={handleAddMaterial} className="add-button">
              추가
            </button>
          </div>
          <div className="materials-list">
            {formData.details.materials.map((material, index) => (
              <div key={index} className="material-item">
                <span>{material}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(index)}
                  className="remove-button"
                >
                  ×
                </button>
              </div>
            ))}
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
            초기화
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminPanel; 