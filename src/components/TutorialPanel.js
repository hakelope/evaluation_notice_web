import React from 'react';
import { Link } from 'react-router-dom';
import './AdminPanel.css';

function TutorialPanel() {
  return (
    <div className="admin-panel">
      <div className="admin-nav">
        <Link to="/admin/add" className="nav-button">
          수행평가 추가하기
        </Link>
        <Link to="/admin/edit" className="nav-button">
          수행평가 수정하기
        </Link>
        <Link to="/admin/tutorial" className="nav-button active">
          사용 가이드
        </Link>
      </div>
      
      <div className="tutorial-container">
        <h2>수행평가 관리 시스템 튜토리얼</h2>
        
        <section className="tutorial-section">
          <h3>수행평가 추가하기</h3>
          <div className="tutorial-content">
            <h4>1. 기본 정보 입력</h4>
            <ul>
              <li>과목 유형 선택: 일반과목 또는 선택과목</li>
              <li>수행평가 유형 선택: 하루 수행평가 또는 기간 수행평가</li>
              <li>과목명 입력</li>
              <li>수행평가 제목 입력</li>
              <li>강조 색상 선택 (선택사항)</li>
            </ul>

            <h4>2. 날짜 설정</h4>
            <ul>
              <li>기본 날짜는 반드시 입력해야 합니다.</li>
              <li>하루 수행평가: 단일 날짜만 입력</li>
              <li>기간 수행평가: 시작일과 종료일을 모두 입력</li>
              <li>반별 날짜를 설정하지 않은 반은 자동으로 기본 날짜가 적용됩니다.</li>
              <li>특정 반만 시행하는 수행평가의 경우, 기본 날짜를 1900-01-01과 같이 외딴 날짜로 설정하고, 해당 반들만 원하는 날짜를 설정할 수 있습니다.</li>
              <li>선택과목의 경우, 모든 학생들에게 A, B, C, D반의 수행평가 일정이 모두 표시됩니다.</li>
              <li>기간 수행평가는 캘린더에서 시작일부터 종료일까지 연속된 기간으로 표시됩니다.</li>
            </ul>

            <h4>3. 상세 정보 입력</h4>
            <ul>
              <li>수행평가 유형 입력</li>
              <li>요구사항 입력 (여러 줄 가능)</li>
              <li>준비물 추가 (Enter 또는 추가 버튼으로 입력)</li>
              <li>비고 사항 입력</li>
            </ul>

            <h4>이미지 첨부</h4>
            <ul>
              <li>이미지 파일 선택</li>
              <li>여러 이미지 동시 업로드 가능</li>
              <li>이미지 삭제 가능</li>
            </ul>
          </div>
        </section>

        <section className="tutorial-section">
          <h3>2. 수행평가 수정하기</h3>
          <div className="tutorial-content">
            <h4>수행평가 검색</h4>
            <ul>
              <li>과목명 또는 제목으로 검색</li>
              <li>페이지네이션으로 목록 탐색</li>
            </ul>

            <h4>수정 방법</h4>
            <ul>
              <li>수정할 수행평가 선택</li>
              <li>기존 정보 수정</li>
              <li>저장 버튼으로 변경사항 적용</li>
            </ul>

            <h4>삭제 방법</h4>
            <ul>
              <li>삭제 버튼 클릭</li>
              <li>확인 후 삭제 완료</li>
            </ul>
          </div>
        </section>

        <section className="tutorial-section">
          <h3>3. 주의사항</h3>
          <div className="tutorial-content">
            <ul>
              <li>수정 시 기존 정보가 모두 유지됩니다.</li>
              <li>삭제된 수행평가는 복구할 수 없습니다.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TutorialPanel; 