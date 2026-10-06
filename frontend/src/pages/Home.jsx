import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import ItemCard from '../components/ItemCard';
import FilterBar from '../components/FilterBar';

const emptyFilters = { q: '', type: '', category: '', location: '', status: '', from: '', to: '' };

export default function Home() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await api.get('/items', { params });
      setItems(data);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce filter changes
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="container">
      <FilterBar filters={filters} onChange={setFilters} />
      {error && <p className="error-msg">{error}</p>}
      {loading && <p style={{ color: '#8a90a0' }}>Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="card">No items match these filters yet.</div>
      )}
      <div className="item-grid">
        {items.map(item => <ItemCard key={item._id} item={item} />)}
      </div>
    </div>
  );
}
