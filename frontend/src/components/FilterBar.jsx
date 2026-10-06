import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function FilterBar({ filters, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/items/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const update = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <div className="card">
      <div className="filter-bar">
        <div>
          <label>Keyword</label>
          <input placeholder="e.g. wallet, phone, dog" value={filters.q}
                 onChange={e => update('q', e.target.value)} />
        </div>
        <div>
          <label>Type</label>
          <select value={filters.type} onChange={e => update('type', e.target.value)}>
            <option value="">All</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>
        <div>
          <label>Category</label>
          <select value={filters.category} onChange={e => update('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Location contains</label>
          <input placeholder="e.g. library" value={filters.location}
                 onChange={e => update('location', e.target.value)} />
        </div>
        <div>
          <label>Status</label>
          <select value={filters.status} onChange={e => update('status', e.target.value)}>
            <option value="">Any</option>
            <option value="open">Open</option>
            <option value="claimed">Claimed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label>From date</label>
          <input type="date" value={filters.from} onChange={e => update('from', e.target.value)} />
        </div>
        <div>
          <label>To date</label>
          <input type="date" value={filters.to} onChange={e => update('to', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
