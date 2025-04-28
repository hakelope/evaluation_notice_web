// 수행평가 데이터
export const evaluations = [
  {
    id: 1,
    subject: '국어',
    title: '자료 해석과 주제 통합적 논점 구성',
    highlightColor: '#ffeb3b',  // 노란색 형광펜
    images: [],
    // 반별 날짜 정보
    classDates: {
      1: '2025-05-01',  // 1반 날짜
      2: '2025-05-03',  // 2반 날짜
      3: '2025-05-05',  // 3반 날짜
      4: '2025-05-07',  // 4반 날짜
      5: '2025-05-09',  // 5반 날짜
      6: '2025-05-11',  // 6반 날짜
      7: '2025-05-13',  // 7반 날짜
      8: '2025-05-15'   // 8반 날짜
    },
    defaultDate: '2025-05-01',  // 입력하지 않은 반의 기본 날짜
    details: {
      type: '프로젝트',
      deadline: '2025-05-01 23:59',
      requirements: [
        '수학 문제 풀이',
        '해설 작성',
        '발표 준비'
      ],
      materials: [
        '교과서',
        '참고서',
        '계산기'
      ],
      notes: '팀 프로젝트로 진행됩니다. 3-4명으로 팀을 구성하세요.'
    }
  },
  {
    id: 2,
    subject: '영단어',
    title: '1차 수행평가',
    highlightColor: '#a5d6a7',  // 연한 초록색 형광펜
    images: [
      '/images/evaluation2-1.jpg',
      '/images/evaluation2-2.jpg'
    ],
    // 반별 날짜 정보
    classDates: {

    },
    defaultDate: '2025-05-02',  // 입력하지 않은 반의 기본 날짜
    details: {
      type: '발표',
      deadline: '2025-05-02 23:59',
      requirements: [
        '영어 에세이 작성',
        '발표 자료 준비',
        '발표 연습'
      ],
      materials: [
        '영어 사전',
        '발표 자료 템플릿'
      ],
      notes: '개인 발표로 진행됩니다. 5분 이내로 발표하세요.'
    }
  }
]; 