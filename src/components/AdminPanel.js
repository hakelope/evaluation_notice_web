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
  const [successMessage, setSuccessMessage] = useState('');
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    highlightColor: '#61dafb',
    defaultDate: '',
    defaultEndDate: '',
    classDates: {},
    classEndDates: {},
    useDefaultDates: {
      '1': true, '2': true, '3': true, '4': true,
      '5': true, '6': true, '7': true, '8': true,
      'A': true, 'B': true, 'C': true, 'D': true
    },
    useDefaultEndDates: {
      '1': true, '2': true, '3': true, '4': true,
      '5': true, '6': true, '7': true, '8': true,
      'A': true, 'B': true, 'C': true, 'D': true
    },
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
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [newMaterial, setNewMaterial] = useState('');

  const [selectedClass, setSelectedClass] = useState('1'); // 선택된 반 상태 추가

  const [isClassDatesOpen, setIsClassDatesOpen] = useState(false); // 아코디언 상태 추가

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
      setIsAuthenticated(false);
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('로그아웃 에러:', err);
      setError('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };

      // 기본 날짜가 변경되었을 때 반별 날짜 업데이트
      if (name === 'defaultDate' || name === 'defaultEndDate') {
        const updatedClassDates = { ...prev.classDates };
        const updatedClassEndDates = { ...prev.classEndDates };
        const isStartDate = name === 'defaultDate';

        // 일반과목인 경우
        if (prev.subjectType === 'general') {
          [1, 2, 3, 4, 5, 6, 7, 8].forEach(classNumber => {
            if (isStartDate && prev.useDefaultDates[classNumber]) {
              updatedClassDates[classNumber] = value;
            }
            if (!isStartDate && prev.evaluationType === 'period' && prev.useDefaultEndDates[classNumber]) {
              updatedClassEndDates[classNumber] = value;
            }
          });
        } 
        // 선택과목인 경우
        else {
          ['A', 'B', 'C', 'D'].forEach(classLetter => {
            if (isStartDate && prev.useDefaultDates[classLetter]) {
              updatedClassDates[classLetter] = value;
            }
            if (!isStartDate && prev.evaluationType === 'period' && prev.useDefaultEndDates[classLetter]) {
              updatedClassEndDates[classLetter] = value;
            }
          });
        }

        newFormData.classDates = updatedClassDates;
        newFormData.classEndDates = updatedClassEndDates;
      }

      return newFormData;
    });
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
      },
      useDefaultDates: {
        ...prev.useDefaultDates,
        [classNumber]: false
      }
    }));
  };

  const handleClassEndDateChange = (classNumber, date) => {
    setFormData(prev => ({
      ...prev,
      classEndDates: {
        ...prev.classEndDates,
        [classNumber]: date
      },
      useDefaultEndDates: {
        ...prev.useDefaultEndDates,
        [classNumber]: false
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
    e.stopPropagation();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    // 필수 입력란 검사
    const requiredFields = {
      'subject': '과목',
      'title': '제목',
      'defaultDate': '기본 날짜',
      'type': '유형',
      'evaluationType': '수행평가 유형'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      const value = field === 'type' ? formData.details.type : formData[field];
      if (!value) {
        setError(`${label}을(를) 입력해주세요!`);
        setLoading(false);
        return;
      }
    }

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
      setSuccessMessage('추가가 완료되었습니다!');
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
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
      useDefaultDates: {
        '1': true, '2': true, '3': true, '4': true,
        '5': true, '6': true, '7': true, '8': true,
        'A': true, 'B': true, 'C': true, 'D': true
      },
      useDefaultEndDates: {
        '1': true, '2': true, '3': true, '4': true,
        '5': true, '6': true, '7': true, '8': true,
        'A': true, 'B': true, 'C': true, 'D': true
      },
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
      useDefaultDates: {},
      useDefaultEndDates: {},
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

    // class_dates 배열을 객체로 변환하면서 기본 날짜 사용 여부도 설정
    evaluation.class_dates?.forEach(cd => {
      formData.classDates[cd.class_number] = cd.date;
      // 기본 날짜와 일치하면 기본 날짜 사용으로 설정
      formData.useDefaultDates[cd.class_number] = cd.date === evaluation.default_date;
      if (evaluation.evaluation_type === 'period') {
        formData.classEndDates[cd.class_number] = cd.end_date;
        formData.useDefaultEndDates[cd.class_number] = cd.end_date === evaluation.default_end_date;
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
      classEndDates: {},
      useDefaultDates: {},
      useDefaultEndDates: {}
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

  const toggleDefaultDate = (classNumber, isStartDate = true) => {
    setFormData(prev => {
      const key = isStartDate ? 'useDefaultDates' : 'useDefaultEndDates';
      const defaultDate = isStartDate ? prev.defaultDate : prev.defaultEndDate;
      
      const newUseDefaultDates = { ...prev[key] };
      newUseDefaultDates[classNumber] = !newUseDefaultDates[classNumber];

      const newDates = { ...prev.classDates };
      if (newUseDefaultDates[classNumber]) {
        newDates[classNumber] = defaultDate;
      } else {
        delete newDates[classNumber];
      }

      return {
        ...prev,
        [key]: newUseDefaultDates,
        classDates: newDates
      };
    });
  };

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
    <div className="admin-panel edit-and-add">
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
        <h2>창신고 수행평가 공지</h2>
        <button className="logout-button" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit(e);
        return false;
      }} className="evaluation-form">
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
          <div className="color-picker-container">
            <input
              type="color"
              name="highlightColor"
              value={formData.highlightColor}
              onChange={handleInputChange}
              className="color-input"
            />
            <div className="color-value">{formData.highlightColor}</div>
            <div className="preview-calendar-container">
              <div className="preview-calendar">
                <div className="preview-date">15</div>
                <div className="preview-evaluation-highlight">
                  <div 
                    className="preview-evaluation-text"
                    style={{ '--highlight-color': formData.highlightColor }}
                  >
                    {formData.subject || '과목명'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>기본 날짜 <span className="required">*</span></label>
          {formData.evaluationType === 'period' ? (
            <div className="date-range-inputs">
              <div className="date-input">
                <label>시작일</label>
                <div className={`date-input-with-default ${formData.useDefaultDates['1'] ? 'using-default' : ''}`}>
                  <input
                    type="date"
                    name="defaultDate"
                    value={formData.defaultDate}
                    onChange={handleInputChange}
                    required
                    onClick={() => formData.useDefaultDates['1'] && toggleDefaultDate('1', true)}
                  />
                  <button
                    type="button"
                    className={`default-date-button ${formData.useDefaultDates['1'] ? 'active' : ''}`}
                    onClick={() => toggleDefaultDate('1', true)}
                  >
                    {formData.useDefaultDates['1'] ? '기본 날짜 사용 중' : '기본 날짜'}
                  </button>
                </div>
              </div>
              <div className="date-input">
                <label>종료일</label>
                <div className={`date-input-with-default ${formData.useDefaultEndDates['1'] ? 'using-default' : ''}`}>
                  <input
                    type="date"
                    name="defaultEndDate"
                    value={formData.defaultEndDate}
                    onChange={handleInputChange}
                    required
                    onClick={() => formData.useDefaultEndDates['1'] && toggleDefaultDate('1', false)}
                  />
                  <button
                    type="button"
                    className={`default-date-button ${formData.useDefaultEndDates['1'] ? 'active' : ''}`}
                    onClick={() => toggleDefaultDate('1', false)}
                  >
                    {formData.useDefaultEndDates['1'] ? '기본 날짜 사용 중' : '기본 날짜'}
                  </button>
                </div>
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
          <div 
            className="class-dates-header"
            onClick={() => setIsClassDatesOpen(!isClassDatesOpen)}
            aria-expanded={isClassDatesOpen}
          >
            <span>반 별 일정 변경</span>
            <span className="arrow"></span>
          </div>
          <div 
            className="class-dates-content"
            aria-expanded={isClassDatesOpen}
          >
            {formData.subjectType === 'general' ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(classNumber => (
                <div key={classNumber} className="class-date-item">
                  <div className="class-number">{classNumber}반</div>
                  <div className="class-date-input">
                    {formData.evaluationType === 'period' ? (
                      <div className="date-range-inputs">
                        <div className="date-input">
                          <label>시작일</label>
                          <div className={`date-input-with-default ${formData.useDefaultDates[classNumber] ? 'using-default' : ''}`}>
                            <input
                              type="date"
                              value={formData.classDates[classNumber] || ''}
                              onChange={(e) => handleClassDateChange(classNumber, e.target.value)}
                              placeholder="시작일"
                              onClick={() => formData.useDefaultDates[classNumber] && toggleDefaultDate(classNumber, true)}
                            />
                            <button
                              type="button"
                              className={`default-date-button ${formData.useDefaultDates[classNumber] ? 'active' : ''}`}
                              onClick={() => toggleDefaultDate(classNumber, true)}
                            >
                              {formData.useDefaultDates[classNumber] ? '기본 날짜 사용 중' : '기본 날짜'}
                            </button>
                          </div>
                        </div>
                        <div className="date-input">
                          <label>종료일</label>
                          <div className={`date-input-with-default ${formData.useDefaultEndDates[classNumber] ? 'using-default' : ''}`}>
                            <input
                              type="date"
                              value={formData.classEndDates[classNumber] || ''}
                              onChange={(e) => handleClassEndDateChange(classNumber, e.target.value)}
                              placeholder="종료일"
                              onClick={() => formData.useDefaultEndDates[classNumber] && toggleDefaultDate(classNumber, false)}
                            />
                            <button
                              type="button"
                              className={`default-date-button ${formData.useDefaultEndDates[classNumber] ? 'active' : ''}`}
                              onClick={() => toggleDefaultDate(classNumber, false)}
                            >
                              {formData.useDefaultEndDates[classNumber] ? '기본 날짜 사용 중' : '기본 날짜'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`date-input-with-default ${formData.useDefaultDates[classNumber] ? 'using-default' : ''}`}>
                        <input
                          type="date"
                          value={formData.classDates[classNumber] || ''}
                          onChange={(e) => handleClassDateChange(classNumber, e.target.value)}
                          onClick={() => formData.useDefaultDates[classNumber] && toggleDefaultDate(classNumber, true)}
                        />
                        <button
                          type="button"
                          className={`default-date-button ${formData.useDefaultDates[classNumber] ? 'active' : ''}`}
                          onClick={() => toggleDefaultDate(classNumber, true)}
                        >
                          {formData.useDefaultDates[classNumber] ? '기본 날짜 사용 중' : '기본 날짜'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              ['A', 'B', 'C', 'D'].map(classLetter => (
                <div key={classLetter} className="class-date-item">
                  <div className="class-number">{classLetter}반</div>
                  <div className="class-date-input">
                    {formData.evaluationType === 'period' ? (
                      <div className="date-range-inputs">
                        <div className="date-input">
                          <label>시작일</label>
                          <div className={`date-input-with-default ${formData.useDefaultDates[classLetter] ? 'using-default' : ''}`}>
                            <input
                              type="date"
                              value={formData.classDates[classLetter] || ''}
                              onChange={(e) => handleClassDateChange(classLetter, e.target.value)}
                              placeholder="시작일"
                              onClick={() => formData.useDefaultDates[classLetter] && toggleDefaultDate(classLetter, true)}
                            />
                            <button
                              type="button"
                              className={`default-date-button ${formData.useDefaultDates[classLetter] ? 'active' : ''}`}
                              onClick={() => toggleDefaultDate(classLetter, true)}
                            >
                              {formData.useDefaultDates[classLetter] ? '기본 날짜 사용 중' : '기본 날짜'}
                            </button>
                          </div>
                        </div>
                        <div className="date-input">
                          <label>종료일</label>
                          <div className={`date-input-with-default ${formData.useDefaultEndDates[classLetter] ? 'using-default' : ''}`}>
                            <input
                              type="date"
                              value={formData.classEndDates[classLetter] || ''}
                              onChange={(e) => handleClassEndDateChange(classLetter, e.target.value)}
                              placeholder="종료일"
                              onClick={() => formData.useDefaultEndDates[classLetter] && toggleDefaultDate(classLetter, false)}
                            />
                            <button
                              type="button"
                              className={`default-date-button ${formData.useDefaultEndDates[classLetter] ? 'active' : ''}`}
                              onClick={() => toggleDefaultDate(classLetter, false)}
                            >
                              {formData.useDefaultEndDates[classLetter] ? '기본 날짜 사용 중' : '기본 날짜'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`date-input-with-default ${formData.useDefaultDates[classLetter] ? 'using-default' : ''}`}>
                        <input
                          type="date"
                          value={formData.classDates[classLetter] || ''}
                          onChange={(e) => handleClassDateChange(classLetter, e.target.value)}
                          onClick={() => formData.useDefaultDates[classLetter] && toggleDefaultDate(classLetter, true)}
                        />
                        <button
                          type="button"
                          className={`default-date-button ${formData.useDefaultDates[classLetter] ? 'active' : ''}`}
                          onClick={() => toggleDefaultDate(classLetter, true)}
                        >
                          {formData.useDefaultDates[classLetter] ? '기본 날짜 사용 중' : '기본 날짜'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
      {successMessage && <div className="success-message bottom">{successMessage}</div>}
    </div>
  );
}

export default AdminPanel; 