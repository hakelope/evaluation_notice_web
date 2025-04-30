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
        <Link to="/tutorial" className="nav-button active">
          사용 가이드
        </Link>
      </div>
      
      <div className="tutorial-container">
        <h2>수행평가 관리 시스템 사용 가이드</h2>
        
        <section className="tutorial-section">
          <h3>1. 수행평가 추가하기</h3>
          <div className="tutorial-content">
            <div className="tutorial-step">
              <h4>기본 정보 입력</h4>
              <div className="step-content">
                <div className="step-item">
                  <span className="step-label">과목 유형</span>
                  <p>일반과목 또는 선택과목을 선택합니다.</p>
                  <p className="note">* 일반과목의 경우, 자신이 선택한 반의 일정만 표시됩니다.</p>

                  <p className="note">* 선택과목의 경우, 모든 학생들에게 A, B, C, D반의 수행평가 일정이 모두 표시됩니다.</p>
                </div>
                <div className="step-item">
                  <span className="step-label">수행평가 유형</span>
                  <p>다음 중 하나를 선택합니다:</p>
                  <ul>
                    <li>제출 마감일: 과제 제출 마감일</li>
                    <li>실시일: 수행평가 실시일</li>
                    <li>수행평가 기간: 시작일부터 종료일까지의 기간</li>
                  </ul>
                </div>
                <div className="step-item">
                  <span className="step-label">기본 정보</span>
                  <ul>
                    <li>과목명 입력</li>
                    <li>수행평가 제목 입력</li>
                    <li>강조 색상 선택</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="tutorial-step">
              <h4>날짜 설정</h4>
              <div className="step-content">
                <div className="step-item">
                  <span className="step-label">기본 날짜</span>
                  <p>모든 반에 공통으로 적용되는 기본 날짜를 설정합니다.</p>
                  <ul>
                    <li>제출 마감일/실시일: 단일 날짜만 입력</li>
                    <li>수행평가 기간: 시작일과 종료일을 모두 입력</li>
                  </ul>
                </div>
                <div className="step-item">
                  <span className="step-label">반별 날짜</span>
                  <p>각 반별로 다른 날짜를 설정할 수 있습니다.</p>
                  <ul>
                    <li>반별 날짜를 설정하지 않은 반은 자동으로 기본 날짜가 적용됩니다.</li>
                    <li>특정 반만 시행하는 경우, 기본 날짜를 1900-01-01과 같이 외딴 날짜로 설정하고, 해당 반들만 원하는 날짜를 설정하시면 됩니다.</li>
                  </ul>
                  <p className="note">* 특정 반을 제외하고 모두 같은 날짜에 시행하는 경우 (ex : 1,2,3반은 미적분이 없음), 기본 날짜를 설정하고 1,2,3반만 1937년 같이 외딴 날짜로 보내버리면 됩니다.</p>
                  <p className="tip">💡 맨 오른쪽의 달력 모양을 클릭하면 편하게 날짜를 지정할 수 있습니다.</p>
                  <img src="/image.png" alt="날짜 선택 참고 이미지" style={{maxWidth: '100%', marginTop: '10px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}} />
                </div>
              </div>
            </div>

            <div className="tutorial-step">
              <h4>상세 정보 입력</h4>
              <div className="step-content">
                <div className="step-item">
                  <span className="step-label">필수 정보</span>
                  <ul>
                    <li>수행평가 유형 (필기시험, 실기평가, 발표 등)</li>
                  </ul>
                </div>
                <div className="step-item">
                  <span className="step-label">추가 정보</span>
                  <ul>
                    <li>요구사항: 여러 줄로 입력 가능</li>
                    <li>준비물: Enter 또는 추가 버튼으로 입력</li>
                    <li>비고: 추가 설명이 필요한 경우 입력</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="tutorial-step">
              <h4>이미지 첨부</h4>
              <div className="step-content">
                <div className="step-item">
                  <ul>
                    <li>이미지 파일 선택 (여러 개 동시 업로드 가능)</li>
                    <li>업로드된 이미지는 삭제 가능</li>
                  </ul>

                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="tutorial-section">
          <h3>2. 수행평가 수정하기</h3>
          <div className="tutorial-content">
            <div className="tutorial-step">
              <h4>수행평가 검색</h4>
              <div className="step-content">
                <div className="step-item">
                  <ul>
                    <li>과목명 또는 제목으로 검색</li>
                    <li>페이지네이션으로 목록 탐색</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="tutorial-step">
              <h4>수정 및 삭제</h4>
              <div className="step-content">
                <div className="step-item">
                  <span className="step-label">수정</span>
                  <ul>
                    <li>수정할 수행평가 선택</li>
                    <li>기존 정보 수정</li>
                    <li>저장 버튼으로 변경사항 적용</li>
                  </ul>
                </div>
                <div className="step-item">
                  <span className="step-label">삭제</span>
                  <ul>
                    <li>삭제 버튼 클릭</li>
                    <li>확인 후 삭제 완료</li>
                    <li className="warning">* 삭제된 수행평가는 복구할 수 없습니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TutorialPanel; 