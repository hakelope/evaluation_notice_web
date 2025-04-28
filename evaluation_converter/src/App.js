import React, { useState } from 'react';
import './App.css';

function App() {
  const [evaluation, setEvaluation] = useState({
    subject: '',
    title: '',
    type: '',
    deadline: '',
    requirements: [''],
    materials: [''],
    notes: ''
  });

  const [convertedData, setConvertedData] = useState(null);

  // 요구사항 추가
  const handleAddRequirement = () => {
    setEvaluation({
      ...evaluation,
      requirements: [...evaluation.requirements, '']
    });
  };

  // 요구사항 수정
  const handleRequirementChange = (index, value) => {
    const updatedRequirements = [...evaluation.requirements];
    updatedRequirements[index] = value;
    setEvaluation({
      ...evaluation,
      requirements: updatedRequirements
    });
  };

  // 요구사항 삭제
  const handleDeleteRequirement = (index) => {
    const updatedRequirements = evaluation.requirements.filter((_, i) => i !== index);
    setEvaluation({
      ...evaluation,
      requirements: updatedRequirements
    });
  };

  // 준비물 추가
  const handleAddMaterial = () => {
    setEvaluation({
      ...evaluation,
      materials: [...evaluation.materials, '']
    });
  };

  // 준비물 수정
  const handleMaterialChange = (index, value) => {
    const updatedMaterials = [...evaluation.materials];
    updatedMaterials[index] = value;
    setEvaluation({
      ...evaluation,
      materials: updatedMaterials
    });
  };

  // 준비물 삭제
  const handleDeleteMaterial = (index) => {
    const updatedMaterials = evaluation.materials.filter((_, i) => i !== index);
    setEvaluation({
      ...evaluation,
      materials: updatedMaterials
    });
  };

  // 데이터 변환
  const handleConvert = () => {
    // 날짜 형식 변환 함수
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      const formattedHours = hours % 12 || 12;
      
      return `${year}-${month}-${day}, ${ampm}${formattedHours}:${minutes}`;
    };

    const converted = {
      subject: evaluation.subject,
      title: evaluation.title,
      highlightColor: '#ffeb3b',
      images: [],
      classDates: {
        1: formatDate(evaluation.deadline),
        2: formatDate(evaluation.deadline),
        3: formatDate(evaluation.deadline),
        4: formatDate(evaluation.deadline),
        5: formatDate(evaluation.deadline),
        6: formatDate(evaluation.deadline),
        7: formatDate(evaluation.deadline),
        8: formatDate(evaluation.deadline)
      },
      defaultDate: formatDate(evaluation.deadline),
      details: {
        type: evaluation.type,
        deadline: evaluation.deadline,
        requirements: evaluation.requirements.filter(req => req.trim() !== ''),
        materials: evaluation.materials.filter(mat => mat.trim() !== ''),
        notes: evaluation.notes
      }
    };
    setConvertedData(converted);
  };

  return (
    <div className="app">
      <h1>수행평가 변환기</h1>
      
      <div className="input-form">
        <div className="form-group">
          <label>과목:</label>
          <input
            type="text"
            value={evaluation.subject}
            onChange={(e) => setEvaluation({...evaluation, subject: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>제목:</label>
          <input
            type="text"
            value={evaluation.title}
            onChange={(e) => setEvaluation({...evaluation, title: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>유형:</label>
          <input
            type="text"
            value={evaluation.type}
            onChange={(e) => setEvaluation({...evaluation, type: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>제출 기한:</label>
          <input
            type="datetime-local"
            value={evaluation.deadline}
            onChange={(e) => setEvaluation({...evaluation, deadline: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>요구사항:</label>
          <div className="list-input">
            {evaluation.requirements.map((req, index) => (
              <div key={index} className="list-item">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                />
                <button type="button" onClick={() => handleDeleteRequirement(index)}>
                  삭제
                </button>
              </div>
            ))}
            <button type="button" onClick={handleAddRequirement}>
              요구사항 추가
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>준비물:</label>
          <div className="list-input">
            {evaluation.materials.map((mat, index) => (
              <div key={index} className="list-item">
                <input
                  type="text"
                  value={mat}
                  onChange={(e) => handleMaterialChange(index, e.target.value)}
                />
                <button type="button" onClick={() => handleDeleteMaterial(index)}>
                  삭제
                </button>
              </div>
            ))}
            <button type="button" onClick={handleAddMaterial}>
              준비물 추가
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>참고사항:</label>
          <textarea
            value={evaluation.notes}
            onChange={(e) => setEvaluation({...evaluation, notes: e.target.value})}
          />
        </div>

        <button className="convert-button" onClick={handleConvert}>
          변환하기
        </button>
      </div>

      {convertedData && (
        <div className="converted-data">
          <h2>변환된 데이터</h2>
          <pre>{JSON.stringify(convertedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App; 