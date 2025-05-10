import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { getEvaluations } from '../services/evaluationService';
import { getImages } from '../services/imageService';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './EvaluationDetail.css';

function EvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        const evaluations = await getEvaluations();
        const foundEvaluation = evaluations.find(e => e.id === id);
        if (foundEvaluation) {
          setEvaluation(foundEvaluation);
          // 이미지 로드
          const imageData = await getImages(foundEvaluation.id);
          setImages(imageData);
        } else {
          setError('수행평가를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('수행평가를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadEvaluation();
  }, [id]);

  const handleImageClick = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDownload = async (imageUrl, index) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `수행평가_이미지_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('이미지 다운로드 실패:', err);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!evaluation) {
    return <div className="error">수행평가를 찾을 수 없습니다.</div>;
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

  // requirements와 materials를 배열로 변환
  const requirements = evaluation.evaluation_details?.requirements 
    ? (Array.isArray(evaluation.evaluation_details.requirements) 
      ? evaluation.evaluation_details.requirements 
      : [evaluation.evaluation_details.requirements])
    : [];

  const materials = evaluation.evaluation_details?.materials
    ? (Array.isArray(evaluation.evaluation_details.materials)
      ? evaluation.evaluation_details.materials
      : [evaluation.evaluation_details.materials])
    : [];

  return (
    <div className="evaluation-detail">
      <button onClick={() => navigate('/')} className="back-button">
        ← 돌아가기
      </button>
      <h2>{evaluation.subject} : {evaluation.title}</h2>
      
      <div className="evaluation-info">
        <div className="evaluation-header-info">
          <div className="info-row">
            <span className="info-label">학년</span>
            <span className="info-value">{evaluation.grade}학년</span>
          </div>
          <div className="info-row">
            <span className="info-label">평가 유형</span>
            <span className={`info-value evaluation-type ${evaluation.evaluation_type}`}>
              {evaluation.evaluation_type === 'period' && '수행평가 기간'}
              {evaluation.evaluation_type === 'submission' && '제출 마감일'}
              {evaluation.evaluation_type === 'implementation' && '실시일'}
            </span>
          </div>
        </div>

        <div className="details-section">
          {images && images.length > 0 && (
            <div className="images-section">
              <h4>첨부 이미지</h4>
              <div className="image-slider">
                <Slider {...sliderSettings}>
                  {images.map((image, index) => (
                    <div key={index} className="slider-image">
                      <div className="image-container">
                        <img 
                          src={image.url} 
                          alt={`수행평가 이미지 ${index + 1}`}
                          onClick={() => handleImageClick(index)}
                        />
                        <button 
                          className="download-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(image.url, index);
                          }}
                        >
                          다운로드
                        </button>
                      </div>
                    </div>
                  ))}
                </Slider>
              </div>
            </div>
          )}

          <div className="requirements-section">
            <h4>요구사항</h4>
            {requirements.length > 0 ? (
              <ul className="requirements-list">
                {requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            ) : (
              <p className="no-content">요구사항이 없습니다.</p>
            )}
          </div>

          <div className="materials-section">
            <h4>준비물</h4>
            {materials.length > 0 ? (
              <ul className="materials-list">
                {materials.map((mat, index) => (
                  <li key={index} className="material-item">{mat}</li>
                ))}
              </ul>
            ) : (
              <p className="no-content">준비물이 없습니다.</p>
            )}
          </div>

          {evaluation.evaluation_details?.notes && (
            <div className="notes-section">
              <h4>참고사항</h4>
              <div className="notes-content">
                {evaluation.evaluation_details.notes}
              </div>
            </div>
          )}
        </div>

        <div className="submission-notice">
          <p>제출은 리로스쿨로 진행해주세요.</p>
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={images.map(image => ({ src: image.url }))}
        carousel={{ finite: true }}
        controller={{ closeOnBackdropClick: true }}
        toolbar={{
          buttons: [
            <button
              key="download"
              onClick={() => handleDownload(images[lightboxIndex].url, lightboxIndex)}
              style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              다운로드
            </button>
          ]
        }}
      />
    </div>
  );
}

export default EvaluationDetail; 