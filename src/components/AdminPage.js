import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkAuth, signIn } from '../config/supabase';
import './AdminPage.css';

function AdminPage() {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const auth = await checkAuth();
    setIsAuthenticated(auth);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(loginForm.email, loginForm.password);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('로그인 에러:', err);
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // 모든 Supabase 관련 인증 토큰 삭제
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        localStorage.removeItem(key)
      }
    })
    
    setIsAuthenticated(false);
    setLoginForm({ email: '', password: '' });
  };

  if (isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h2>관리자 페이지</h2>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
        <div className="admin-buttons">
          <Link to="/admin/add" className="admin-button">
            <div className="button-content">
              <h3>수행평가 추가하기</h3>
              <p>새로운 수행평가를 등록합니다.</p>
            </div>
          </Link>
          <Link to="/admin/edit" className="admin-button">
            <div className="button-content">
              <h3>수행평가 수정하기</h3>
              <p>기존 수행평가를 수정하거나 삭제합니다.</p>
            </div>
          </Link>
          <Link to="/tutorial" className="admin-button">
            <div className="button-content">
              <h3>사용 가이드</h3>
              <p>시스템 사용 방법을 확인합니다.</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2>관리자 로그인</h2>
      <div className="login-info">
        <p>이 페이지는 관리자 전용 페이지입니다.</p>
        <p>관리자 인증이 필요합니다. <br/>(계정이 없으신 선생님께서는, 30402 김기륭에게 연락 주세요.)</p>
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label>이메일</label>
          <input
            type="email"
            value={loginForm.email}
            onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label>비밀번호</label>
          <input
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}

export default AdminPage;