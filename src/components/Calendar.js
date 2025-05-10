import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import { getEvaluations } from '../services/evaluationService';
import { supabase } from '../config/supabase';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';

function CalendarComponent() {
  const today = new Date();
  const [date, setDate] = useState(today);
  const [activeStartDate, setActiveStartDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState(() => {
    // 로컬 스토리지에서 저장된 반 번호를 불러옴
    const savedClass = localStorage.getItem('selectedClass');
    return savedClass ? parseInt(savedClass) : 1; // 저장된 값이 없으면 1반을 기본값으로
  });
  const [selectedGrade, setSelectedGrade] = useState(() => {
    const savedGrade = localStorage.getItem('selectedGrade');
    return savedGrade || '1';
  });
  const [selectedDate, setSelectedDate] = useState(null); // 선택된 날짜
  const [evaluations, setEvaluations] = useState([]);
  const [completedEvaluations, setCompletedEvaluations] = useState(() => {
    const saved = localStorage.getItem('completedEvaluations');
    return saved ? JSON.parse(saved) : [];
  });
  const [hiddenEvaluations, setHiddenEvaluations] = useState(() => {
    const saved = localStorage.getItem('hiddenEvaluations');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();

  const loadEvaluations = async () => {
    try {
      const data = await getEvaluations();
      setEvaluations(data);
    } catch (err) {
      console.error('수행평가 목록을 불러오는데 실패했습니다:', err);
    }
  };

  useEffect(() => {
    loadEvaluations();

    // Supabase 실시간 구독 설정
    const subscription = supabase
      .channel('evaluations_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'evaluations' 
        }, 
        (payload) => {
          console.log('변경 감지:', payload);
          loadEvaluations(); // 데이터 다시 로드
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 반 선택 핸들러
  const handleClassChange = (classNumber) => {
    setSelectedClass(classNumber);
    // 선택한 반 번호를 로컬 스토리지에 저장
    localStorage.setItem('selectedClass', classNumber.toString());
  };

  // 학년 선택 핸들러
  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    localStorage.setItem('selectedGrade', grade);
  };

  // 날짜 선택 핸들러
  const handleDateClick = (clickedDate) => {
    setSelectedDate(clickedDate);
  };

  // 완료 상태 토글 함수
  const toggleEvaluationComplete = (evaluationId, e) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    setCompletedEvaluations(prev => {
      const newCompleted = prev.includes(evaluationId)
        ? prev.filter(id => id !== evaluationId)
        : [...prev, evaluationId];
      localStorage.setItem('completedEvaluations', JSON.stringify(newCompleted));
      return newCompleted;
    });
  };

  const toggleEvaluationHidden = (evaluationId, e) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    setHiddenEvaluations(prev => {
      const newHidden = prev.includes(evaluationId)
        ? prev.filter(id => id !== evaluationId)
        : [...prev, evaluationId];
      localStorage.setItem('hiddenEvaluations', JSON.stringify(newHidden));
      return newHidden;
    });
  };

  const tileContent = ({ date }) => {
    // 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간 기준)
    const dateStr = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');

    // 오늘 날짜인지 확인
    const isToday = date.toDateString() === new Date().toDateString();

    // 선택된 학년과 반의 날짜에 해당하는 수행평가 찾기
    const dayEvaluations = evaluations.filter(evaluation => {
      // 숨긴 과제 필터링
      if (hiddenEvaluations.includes(evaluation.id)) {
        return false;
      }

      // 먼저 학년 필터링
      if (evaluation.grade !== selectedGrade) {
        return false;
      }

      if (evaluation.subject_type === 'elective') {
        // 선택과목인 경우 모든 반의 날짜 확인
        const hasClassDate = evaluation.class_dates?.some(cd => {
          if (evaluation.evaluation_type === 'period') {
            // 기간 수행평가인 경우 시작일과 종료일 사이에 있는지 확인
            const startDate = new Date(cd.date);
            const endDate = new Date(cd.end_date);
            return date >= startDate && date <= endDate;
          }
          return cd.date === dateStr;
        });
        // 반별 날짜가 없으면 default_date 확인
        if (!hasClassDate && evaluation.evaluation_type === 'period') {
          const startDate = new Date(evaluation.default_date);
          const endDate = new Date(evaluation.default_end_date);
          return date >= startDate && date <= endDate;
        }
        return hasClassDate || evaluation.default_date === dateStr;
      } else {
        // 일반과목인 경우 선택된 반의 날짜 확인
        const classDate = evaluation.class_dates?.find(cd => cd.class_number === selectedClass.toString());
        if (evaluation.evaluation_type === 'period') {
          // 기간 수행평가인 경우 시작일과 종료일 사이에 있는지 확인
          const startDate = new Date(classDate ? classDate.date : evaluation.default_date);
          const endDate = new Date(classDate ? classDate.end_date : evaluation.default_end_date);
          return date >= startDate && date <= endDate;
        }
        // 반별 날짜가 있으면 그 날짜를, 없으면 default_date 사용
        const evaluationDate = classDate ? classDate.date : evaluation.default_date;
        return evaluationDate === dateStr;
      }
    });
    
    return (
      <div className="evaluation-highlight">
        {isToday && <div className="today-text">오늘</div>}
        {dayEvaluations.length > 0 && (
          dayEvaluations.length <= 2 ? (
            // 2개 이하일 때는 원래처럼 표시
            dayEvaluations.map((evaluation, index) => {
              if (evaluation.subject_type === 'elective') {
                // 선택과목인 경우 모든 반 표시
                const classDates = evaluation.class_dates?.filter(cd => cd.date === dateStr) || [];
                const defaultDateClasses = ['A', 'B', 'C', 'D'].filter(classLetter => 
                  !evaluation.class_dates?.some(cd => cd.class_number === classLetter)
                );

                // 반별 날짜가 있는 경우
                if (classDates.length > 0) {
                  return classDates.map((classDate, classIndex) => (
                    <div 
                      key={`${index}-${classIndex}`}
                      className={`evaluation-text ${completedEvaluations.includes(evaluation.id) ? 'completed' : ''}`}
                      onClick={() => navigate(`/evaluation/${evaluation.id}`)}
                      style={{
                        '--highlight-color': evaluation.highlight_color || '#ffeb3b'
                      }}
                    >
                      {`${evaluation.subject}-${classDate.class_number}`}
                    </div>
                  ));
                }
                // 반별 날짜가 없고 default_date가 일치하는 경우
                else if (evaluation.default_date === dateStr) {
                  return defaultDateClasses.map((classLetter, classIndex) => (
                    <div 
                      key={`${index}-${classIndex}`}
                      className={`evaluation-text ${completedEvaluations.includes(evaluation.id) ? 'completed' : ''}`}
                      onClick={() => navigate(`/evaluation/${evaluation.id}`)}
                      style={{
                        '--highlight-color': evaluation.highlight_color || '#ffeb3b'
                      }}
                    >
                      {`${evaluation.subject}-${classLetter}`}
                    </div>
                  ));
                }
                return null;
              } else {
                // 일반과목인 경우 기존처럼 표시
                return (
                  <div 
                    key={index}
                    className={`evaluation-text ${completedEvaluations.includes(evaluation.id) ? 'completed' : ''}`}
                    onClick={() => navigate(`/evaluation/${evaluation.id}`)}
                    style={{
                      '--highlight-color': evaluation.highlight_color || '#ffeb3b'
                    }}
                  >
                    {evaluation.subject}
                  </div>
                );
              }
            })
          ) : (
            // 4개 이상일 때는 원형으로 표시
            <div 
              className="evaluation-circle"
              onClick={() => handleDateClick(date)}
            >
              {dayEvaluations.map((evaluation, index) => {
                const sliceAngle = 360 / dayEvaluations.length;
                const startAngle = sliceAngle * index;
                return (
                  <div
                    key={index}
                    className="evaluation-slice"
                    style={{
                      '--highlight-color': evaluation.highlight_color || '#ffeb3b',
                      '--angle': `${startAngle}deg`,
                      '--slice-angle': `${sliceAngle}deg`
                    }}
                  />
                );
              })}
              <span className="evaluation-count">{dayEvaluations.length}</span>
            </div>
          )
        )}
      </div>
    );
  };

  // 선택된 날짜의 수행평가 목록
  const selectedDateEvaluations = selectedDate ? evaluations.filter(evaluation => {
    // 숨긴 과제 필터링
    if (hiddenEvaluations.includes(evaluation.id)) {
      return false;
    }

    // 먼저 학년 필터링
    if (evaluation.grade !== selectedGrade) {
      return false;
    }

    const dateStr = selectedDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');

    if (evaluation.subject_type === 'elective') {
      // 선택과목인 경우 같은 학년의 모든 반(A,B,C,D)의 날짜 확인
      const classDates = evaluation.class_dates?.filter(cd => 
        ['A', 'B', 'C', 'D'].includes(cd.class_number)
      ) || [];

      if (evaluation.evaluation_type === 'period') {
        // 기간 수행평가인 경우 시작일과 종료일 사이에 있는지 확인
        return classDates.some(cd => {
          const startDate = new Date(cd.date);
          const endDate = new Date(cd.end_date);
          return selectedDate >= startDate && selectedDate <= endDate;
        }) || (
          // 반별 날짜가 없으면 default_date 확인
          selectedDate >= new Date(evaluation.default_date) && 
          selectedDate <= new Date(evaluation.default_end_date)
        );
      }

      // 반별 날짜가 있으면 그 날짜들을, 없으면 default_date 사용
      return classDates.some(cd => cd.date === dateStr) || 
             evaluation.default_date === dateStr;
    } else {
      // 일반과목인 경우 선택된 반의 날짜 확인
      const classDate = evaluation.class_dates?.find(cd => cd.class_number === selectedClass.toString());
      if (evaluation.evaluation_type === 'period') {
        // 기간 수행평가인 경우 시작일과 종료일 사이에 있는지 확인
        const startDate = new Date(classDate ? classDate.date : evaluation.default_date);
        const endDate = new Date(classDate ? classDate.end_date : evaluation.default_end_date);
        return selectedDate >= startDate && selectedDate <= endDate;
      }
      // 반별 날짜가 있으면 그 날짜를, 없으면 default_date 사용
      const evaluationDate = classDate ? classDate.date : evaluation.default_date;
      return evaluationDate === dateStr;
    }
  }) : [];

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="selection-controls">
          <div className="grade-selector">
            <label htmlFor="grade-select"></label>
            <select 
              id="grade-select" 
              value={selectedGrade} 
              onChange={(e) => handleGradeChange(e.target.value)}
              className="grade-select"
            >
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>
          </div>
          <div className="class-selector">
            <label htmlFor="class-select"></label>
            <select 
              id="class-select" 
              value={selectedClass} 
              onChange={(e) => handleClassChange(parseInt(e.target.value))}
              className="class-select"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num}반</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="calendar-content">
        <div className="calendar-wrapper">
          <div className="calendar-controls">
            <Calendar
              onChange={(newDate) => {
                setDate(newDate);
                setSelectedDate(newDate);
              }}
              onActiveStartDateChange={({ activeStartDate }) => setActiveStartDate(activeStartDate)}
              value={selectedDate || date}
              activeStartDate={activeStartDate}
              tileContent={tileContent}
              calendarType="US"
              formatShortWeekday={(locale, date) => {
                const days = ['일', '월', '화', '수', '목', '금', '토'];
                return days[date.getDay()];
              }}
              onClickDay={handleDateClick}
            />
            <div className="calendar-buttons">
              <button 
                className="today-button"
                onClick={() => {
                  setDate(today);
                  setSelectedDate(today);
                  setActiveStartDate(today);
                }}
              >
                오늘
              </button>
              <button 
                className="recent-changes-button"
                onClick={() => navigate('/recent-changes')}
              >
                최근 변경사항
              </button>
            </div>
          </div>
        </div>

        {/* 선택된 날짜의 수행평가 목록 */}
        <div className="selected-date-evaluations">
          {selectedDate ? (
            <>
              <h3>{selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 수행평가</h3>
              {selectedDateEvaluations.length > 0 ? (
                <ul>
                  {selectedDateEvaluations.map((evaluation, index) => (
                    <li 
                      key={index}
                      onClick={() => navigate(`/evaluation/${evaluation.id}`)}
                      style={{
                        '--highlight-color': evaluation.highlight_color || '#ffeb3b'
                      }}
                      className={completedEvaluations.includes(evaluation.id) ? 'completed' : ''}
                    >
                      {evaluation.subject} - {evaluation.title}
                      <div className="calendar-evaluation-badges">
                        <div className="calendar-button-group">
                          <button
                            className={`calendar-hide-button ${hiddenEvaluations.includes(evaluation.id) ? 'hidden' : ''}`}
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
                            className={`calendar-complete-button ${completedEvaluations.includes(evaluation.id) ? 'completed' : ''}`}
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
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-evaluation">해당 날짜에 수행평가가 없습니다.</p>
              )}
            </>
          ) : (
            <p className="no-date-selected">날짜를 선택해주세요.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarComponent;