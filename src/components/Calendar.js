import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import { evaluations } from '../data/evaluations';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';

function CalendarComponent() {
  const [date, setDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(1); // 기본값 1반
  const [selectedDate, setSelectedDate] = useState(null); // 선택된 날짜
  const navigate = useNavigate();

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
      const evaluationDate = evaluation.classDates[selectedClass] || evaluation.defaultDate;
      return evaluationDate === dateStr;
    });
    
    return (
      <div className="evaluation-highlight">
        {isToday && <div className="today-text">오늘</div>}
        {dayEvaluations.length > 0 && (
          dayEvaluations.length <= 2 ? (
            // 2개 이하일 때는 원래처럼 표시
            dayEvaluations.map((evaluation, index) => (
              <div 
                key={index}
                className="evaluation-text"
                onClick={() => navigate(`/evaluation/${evaluations.indexOf(evaluation)}`)}
                style={{
                  '--highlight-color': evaluation.highlightColor || '#ffeb3b'
                }}
              >
                {evaluation.subject}
              </div>
            ))
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
                      '--highlight-color': evaluation.highlightColor || '#ffeb3b',
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
    const evaluationDate = evaluation.classDates[selectedClass] || evaluation.defaultDate;
    return evaluationDate === dateStr;
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
                      onClick={() => navigate(`/evaluation/${evaluations.indexOf(evaluation)}`)}
                      style={{
                        '--highlight-color': evaluation.highlightColor || '#ffeb3b'
                      }}
                    >
                      {evaluation.subject} - {evaluation.title}
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