import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import { getEvaluations } from '../services/evaluationService';
import { supabase } from '../config/supabase';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';

function CalendarComponent() {
  const [date, setDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(1); // 기본값 1반
  const [selectedDate, setSelectedDate] = useState(null); // 선택된 날짜
  const [evaluations, setEvaluations] = useState([]);
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
  const handleClassChange = (e) => {
    setSelectedClass(parseInt(e.target.value));
  };

  // 날짜 선택 핸들러
  const handleDateClick = (clickedDate) => {
    setSelectedDate(clickedDate);
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

    // 선택된 반의 날짜에 해당하는 수행평가 찾기
    const dayEvaluations = evaluations.filter(evaluation => {
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
                      className="evaluation-text"
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
                      className="evaluation-text"
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
                    className="evaluation-text"
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
    const dateStr = selectedDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');

    if (evaluation.subject_type === 'elective') {
      // 선택과목인 경우 모든 반의 날짜 확인
      const hasClassDate = evaluation.class_dates?.some(cd => {
        if (evaluation.evaluation_type === 'period') {
          // 기간 수행평가인 경우 시작일과 종료일 사이에 있는지 확인
          const startDate = new Date(cd.date);
          const endDate = new Date(cd.end_date);
          return selectedDate >= startDate && selectedDate <= endDate;
        }
        return cd.date === dateStr;
      });
      // 반별 날짜가 없으면 default_date 확인
      if (!hasClassDate && evaluation.evaluation_type === 'period') {
        const startDate = new Date(evaluation.default_date);
        const endDate = new Date(evaluation.default_end_date);
        return selectedDate >= startDate && selectedDate <= endDate;
      }
      return hasClassDate || evaluation.default_date === dateStr;
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
      {/* 반 선택 드롭다운 */}
      <div className="class-selector">
        <label htmlFor="class-select">반 선택: </label>
        <select 
          id="class-select" 
          value={selectedClass} 
          onChange={handleClassChange}
          className="class-select"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
            <option key={num} value={num}>{num}반</option>
          ))}
        </select>
      </div>

      <div className="calendar-content">
        <div className="calendar-wrapper">
          <Calendar
            onChange={setDate}
            value={date}
            tileContent={tileContent}
            calendarType="US"
            formatShortWeekday={(locale, date) => {
              const days = ['일', '월', '화', '수', '목', '금', '토'];
              return days[date.getDay()];
            }}
            onClickDay={handleDateClick}
          />
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
                    >
                      {evaluation.subject} - {evaluation.title}
                      {evaluation.evaluation_type === 'period' && (
                        <span className="period-badge">수행평가 기간</span>
                      )}
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