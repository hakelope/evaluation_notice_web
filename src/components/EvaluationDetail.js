import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { evaluations } from '../data/evaluations';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './EvaluationDetail.css';

function EvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const evaluation = evaluations.find(e => e.id === parseInt(id));

  if (!evaluation) {
    return <div>수행평가를 찾을 수 없습니다.</div>;
  }

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    adaptiveHeight: true
  };

  return (
    <div className="evaluation-detail">
      <button onClick={() => navigate('/')} className="back-button">
        ← 돌아가기
      </button>
      <h2>{evaluation.subject} : {evaluation.title}</h2>
      
      {/* 이미지 슬라이더 */}
      {evaluation.images && evaluation.images.length > 0 && (
        <div className="image-slider">
          <Slider {...sliderSettings}>
            {evaluation.images.map((image, index) => (
              <div key={index} className="slider-image">
                <img src={image} alt={`수행평가 이미지 ${index + 1}`} />
              </div>
            ))}
          </Slider>
        </div>
      )}

      <div className="evaluation-info">
        <p className="date">날짜: {evaluation.date}</p>
        <p className="subject">과목: {evaluation.subject}</p>
        <p className="title">제목: {evaluation.title}</p>
        
        <div className="details-section">
          <h3>상세 정보</h3>
          <p className="type">유형: {evaluation.details.type}</p>
          <p className="deadline">제출 기한: {evaluation.details.deadline}</p>
          
          <div className="requirements">
            <h4>요구사항</h4>
            <ul>
              {evaluation.details.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
          
          <div className="materials">
            <h4>준비물</h4>
            <ul>
              {evaluation.details.materials.map((mat, index) => (
                <li key={index}>{mat}</li>
              ))}
            </ul>
          </div>
          
          <div className="notes">
            <h4>참고사항</h4>
            <p>{evaluation.details.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EvaluationDetail; 