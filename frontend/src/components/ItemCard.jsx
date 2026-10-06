import React from 'react';
import { Link } from 'react-router-dom';
import { IMAGE_BASE_URL } from '../api/axios';

export default function ItemCard({ item }) {
  const thumb = item.images && item.images[0];
  const dateStr = new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="card item-card">
      {thumb ? (
        <img className="thumb" src={`${IMAGE_BASE_URL}/uploads/${thumb.storedName}`} alt={item.title} />
      ) : (
        <div className="thumb-placeholder">No photo</div>
      )}
      <div className="body">
        <h3>
          {item.title}
          <span className={`badge ${item.type}`}>{item.type === 'lost' ? 'Lost' : 'Found'}</span>
          <span className={`badge ${item.status}`}>{item.status}</span>
        </h3>
        <p>{item.category}</p>
        <p>📍 {item.location}</p>
        <div className="meta-row">🗓 {dateStr}</div>
        <div style={{ marginTop: 10 }}>
          <Link to={`/items/${item._id}`}><button>View Details</button></Link>
        </div>
      </div>
    </div>
  );
}
