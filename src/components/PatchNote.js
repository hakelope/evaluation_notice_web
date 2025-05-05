import React from 'react';
import './PatchNote.css';

function PatchNote() {
  const patches = [
    {
      version: '1.4.0',
      date: '2025-05-04',
      changes: [
        '메인 페이지 추가',
        '수행평가 검색 페이지 및 검색 기능 추가'
      ]
    },
    {
      version: '1.3.0',
      date: '2025-05-03',
      changes: [
        '로그아웃 시 인증 토큰 삭제가 안 되던 버그 수정',
        '완료한 과제 체크 기능 추가',
        '수행평가 추가 및 수정 시, 미리보기 추가'
      ]
    },
    {
      version: '1.2.0',
      date: '2025-05-02',
      changes: [
        '최근 1주일간 변경 사항 확인 기능 추가'
      ]
    },
    {
      version: '1.1.0',
      date: '2025-05-01',
      changes: [
        '학년별 필터링 기능 추가 -> 전학년이 웹 사용 가능',
        '학년별 수행평가 등록 기능 추가',
        '수행평가 검색 시 학년 필터링 기능 추가'
      ]
    },
    {
      version: '1.0.0',
      date: '2025-04-30',
      changes: [
        '관리자 계정 안내 기능 추가',
        '날짜 선택 팁 추가',
        '가독성 개선 및 오늘 버튼 추가',
        '수행평가 기간/실시일/마감일 구분 기능 추가',
        '튜토리얼 페이지 추가',
        '관리자 페이지 가독성 개선'
      ]
    },
    {
      version: '0.9.0',
      date: '2025-04-29',
      changes: [
        '개발자가 직접 과제를 추가해야 했음 -> Supabase 데이터베이스 연동으로 웹 내에서 추가 가능',
        '수행평가 수정 페이지 분리',
        '수행평가 검색 기능 추가',
        '페이지네이션 기능 개선',
        '카카오톡 오픈채팅 링크 추가',
        '이미지 확대 및 다운로드 기능 추가',
        '관리자 패널 개선'
      ]
    },
    {
      version: '0.8.0',
      date: '2025-04-28',
      changes: [
        '네비게이션 바 버튼 추가',
        '수행평가 ID 시스템 개선',
        '파일 구조 정리',
        '수행평가 추가 변환기 개발',
        '기본 페이지 구현'
      ]
    }
  ];

  return (
    <div className="patch-note-container">
      <h2>패치 노트</h2>
      <div className="patches">
        {patches.map((patch, index) => (
          <div key={index} className="patch-item">
            <div className="patch-header">
              <h3>v{patch.version}</h3>
              <span className="patch-date">{patch.date}</span>
            </div>
            <ul className="patch-changes">
              {patch.changes.map((change, changeIndex) => (
                <li key={changeIndex}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatchNote; 