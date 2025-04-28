import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import { evaluations } from '../data/evaluations';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';

function CalendarComponent() {
  const [date, setDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(1); // 기본값 1반
  const navigate = useNavigate();

  // 반 선택 핸들러
  const handleClassChange = (e) => {
    setSelectedClass(parseInt(e.target.value));
  };

  const tileContent = ({ date }) => {
    // 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간 기준)
    const dateStr = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');

    // 선택된 반의 날짜에 해당하는 수행평가 찾기
    const dayEvaluations = evaluations.filter(evaluation => {
      const evaluationDate = evaluation.classDates[selectedClass] || evaluation.defaultDate;
      return evaluationDate === dateStr;
    });
    
    if (dayEvaluations.length > 0) {
      return (
        <div className="evaluation-highlight">
          {dayEvaluations.map(evaluation => (
            <div 
              key={evaluation.id}
              className="evaluation-text"
              onClick={() => navigate(`/evaluation/${evaluation.id}`)}
              style={{
                '--highlight-color': evaluation.highlightColor || '#ffeb3b'
              }}
            >
              {evaluation.subject}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

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

      <Calendar
        onChange={setDate}
        value={date}
        tileContent={tileContent}
        calendarType="US"
        formatShortWeekday={(locale, date) => {
          const days = ['일', '월', '화', '수', '목', '금', '토'];
          return days[date.getDay()];
        }}
      />
    </div>
  );
}

export default CalendarComponent;