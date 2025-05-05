import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluations, updateEvaluation } from '../services/evaluationService';
import { uploadImage, getImages, deleteImage } from '../services/imageService';
import { checkAuth, signOut } from '../config/supabase';
import './AdminPanel.css';

function EditEvaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
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
    evaluationType: 'single',
    grade: '1'
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClassDatesOpen, setIsClassDatesOpen] = useState(false);

  useEffect(() => {
    checkAuthentication();
    loadEvaluation();
  }, [id]);

  const checkAuthentication = async () => {
    const auth = await checkAuth();
    setIsAuthenticated(auth);
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

  const loadEvaluation = async () => {
    try {
      const evaluations = await getEvaluations();
      const evaluation = evaluations.find(e => e.id === id);
      if (evaluation) {
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

        evaluation.class_dates?.forEach(cd => {
          formData.classDates[cd.class_number] = cd.date;
          if (evaluation.evaluation_type === 'period') {
            formData.classEndDates[cd.class_number] = cd.end_date;
          }
        });

        setFormData(formData);
        loadImages(evaluation.id);
      } else {
        setError('수행평가를 찾을 수 없습니다.');
      }
    } catch (err) {
      setError('수행평가를 불러오는데 실패했습니다.');
    }
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
    setSuccessMessage('');

    try {
      await updateEvaluation(formData.id, formData);
      setSuccessMessage('수정이 완료되었습니다!');
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => {
        navigate('/admin/edit');
      }, 1500);
    } catch (err) {
      console.error('수행평가 수정 중 에러:', err);
      setError(`수행평가 수정에 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/edit');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <h2>수행평가 수정하기</h2>
        <div className="login-info">
          <p>이 페이지는 수행평가를 수정하는 관리자 전용 페이지입니다.</p>
          <p>관리자 인증이 필요합니다.</p>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>수행평가 수정하기</h2>
        <button onClick={handleLogout} className="logout-button">
          로그아웃
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
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
          <label>수행평가 유형</label>
          <div className="subject-type-buttons">
            <label className="subject-type-label">
              <input
                type="radio"
                name="evaluationType"
                value="submission"
                checked={formData.evaluationType === 'submission'}
                onChange={handleInputChange}
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
          <div 
            className="class-dates-header"
            onClick={() => setIsClassDatesOpen(!isClassDatesOpen)}
          >
            <span>반 별 일정 변경</span>
            <span className="arrow">{isClassDatesOpen ? '^' : 'v'}</span>
          </div>
          {isClassDatesOpen && (
            <div className="class-dates-content">
              {formData.subjectType === 'general' ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map(classNumber => (
                  <div key={classNumber} className="class-date-item">
                    <div className="class-number">{classNumber}반</div>
                    <div className="class-date-input">
                      {formData.evaluationType === 'period' ? (
                        <div className="date-range-inputs">
                          <div className="date-input">
                            <label>시작일</label>
                            <input
                              type="date"
                              value={formData.classDates[classNumber] || ''}
                              onChange={(e) => handleClassDateChange(classNumber, e.target.value)}
                              placeholder="시작일"
                            />
                          </div>
                          <div className="date-input">
                            <label>종료일</label>
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
                            <input
                              type="date"
                              value={formData.classDates[classLetter] || ''}
                              onChange={(e) => handleClassDateChange(classLetter, e.target.value)}
                              placeholder="시작일"
                            />
                          </div>
                          <div className="date-input">
                            <label>종료일</label>
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
                  </div>
                ))
              )}
            </div>
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
          <button type="button" onClick={handleCancel}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditEvaluation; 