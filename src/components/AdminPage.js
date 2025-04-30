import React from 'react';
import { Link } from 'react-router-dom';
import './AdminPage.css';

function AdminPage() {
  return (
    <div className="admin-page">
      <h2>관리자 페이지</h2>
      <div className="admin-buttons">
        <Link to="/admin/add" className="admin-button">
          <div className="button-content">
            <h3>수행평가 추가하기</h3>
            <p>새로운 수행평가를 추가합니다.</p>
          </div>
        </Link>
        <Link to="/admin/edit" className="admin-button">
          <div className="button-content">
            <h3>수행평가 수정하기</h3>
            <p>기존 수행평가를 수정합니다.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default AdminPage;