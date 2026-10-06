import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import ItemCard from '../components/ItemCard';

export default function MyItems() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/items', { params: { mine: 'true' } })
      .then(res => setItems(res.data))
      .catch(() => setError('Failed to load your items'));
  }, []);

  return (
    <div className="container">
      <h2 style={{ marginTop: 0 }}>My Reports</h2>
      {error && <p className="error-msg">{error}</p>}
      {items.length === 0 && !error && <div className="card">You haven't reported any items yet.</div>}
      <div className="item-grid">
        {items.map(item => <ItemCard key={item._id} item={item} />)}
      </div>
    </div>
  );
}
