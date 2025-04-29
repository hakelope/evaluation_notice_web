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
      
      {/* 이미지 슬라이더 */}
      {images && images.length > 0 && (
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
      )}

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

      <div className="evaluation-info">
        <p className="type">유형: {evaluation.evaluation_details?.type}</p>

        <div className="details-section">
          <h3>상세 정보</h3>
          
          <div className="requirements">
            <h4>요구사항</h4>
            {requirements.length > 0 ? (
              <ul>
                {requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            ) : (
              <p>요구사항이 없습니다.</p>
            )}
          </div>

          <div className="materials">
            <h4>준비물</h4>
            {materials.length > 0 ? (
              <ul>
                {materials.map((mat, index) => (
                  <li key={index}>{mat}</li>
                ))}
              </ul>
            ) : (
              <p>준비물이 없습니다.</p>
            )}
          </div>

          <div className="notes">
            <h4>참고사항</h4>
            <p>{evaluation.evaluation_details?.notes || '없음'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EvaluationDetail; 