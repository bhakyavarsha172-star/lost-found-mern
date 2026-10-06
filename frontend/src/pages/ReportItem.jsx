import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const todayStr = () => new Date().toISOString().split('T')[0];

export default function ReportItem() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(todayStr());
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/items/categories').then(res => {
      setCategories(res.data);
      if (res.data.length) setCategory(res.data[0]);
    }).catch(() => {});
  }, []);

  const onFilesSelected = (e) => {
    setError('');
    const picked = Array.from(e.target.files || []);
    const combined = [...files, ...picked];

    if (combined.length > MAX_FILES) {
      setError(`You can attach at most ${MAX_FILES} images.`);
      return;
    }
    for (const f of combined) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(`"${f.name}" isn't a supported image type (JPG, PNG, WEBP, GIF only).`);
        return;
      }
      if (f.size > MAX_SIZE) {
        setError(`"${f.name}" is larger than 5 MB.`);
        return;
      }
    }
    setFiles(combined);
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 3) return setError('Title must be at least 3 characters.');
    if (description.trim().length < 10) return setError('Description must be at least 10 characters.');
    if (!location.trim()) return setError('Location is required.');
    if (!date) return setError('Date is required.');
    if (new Date(date) > new Date()) return setError('Date cannot be in the future.');
    if (!contactName.trim()) return setError('Contact name is required.');

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('location', location.trim());
      formData.append('date', date);
      formData.append('contactName', contactName.trim());
      formData.append('contactPhone', contactPhone.trim());
      formData.append('contactEmail', contactEmail.trim());
      files.forEach(f => formData.append('images', f));

      const { data } = await api.post('/items', formData);
      navigate(`/items/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="card">
        <h2>Report an Item</h2>
        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={onSubmit}>
          <div className="form-row" style={{ marginBottom: 16 }}>
            <button type="button" onClick={() => setType('lost')} className={type === 'lost' ? '' : 'secondary'}>I Lost Something</button>
            <button type="button" onClick={() => setType('found')} className={type === 'found' ? '' : 'secondary'}>I Found Something</button>
          </div>

          <label style={{ fontSize: 12, color: '#667' }}>Title</label>
          <input placeholder="e.g. Blue backpack, Black wallet, House keys" value={title} onChange={e => setTitle(e.target.value)} required />

          <label style={{ fontSize: 12, color: '#667' }}>Description</label>
          <textarea placeholder="Describe the item — color, brand, distinguishing marks, contents…" value={description} onChange={e => setDescription(e.target.value)} required />

          <div className="two-col">
            <div>
              <label style={{ fontSize: 12, color: '#667' }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#667' }}>Date {type === 'lost' ? 'lost' : 'found'}</label>
              <input type="date" max={todayStr()} value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          <label style={{ fontSize: 12, color: '#667' }}>Location {type === 'lost' ? 'lost' : 'found'}</label>
          <input placeholder="e.g. Central Library, 2nd floor" value={location} onChange={e => setLocation(e.target.value)} required />

          <div className="two-col">
            <div>
              <label style={{ fontSize: 12, color: '#667' }}>Your name</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#667' }}>Phone (optional)</label>
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
            </div>
          </div>
          <label style={{ fontSize: 12, color: '#667' }}>Email (optional, defaults to your account email)</label>
          <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />

          <label style={{ fontSize: 12, color: '#667' }}>Photos (up to 5, 5 MB each)</label>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFilesSelected} />
          {files.length > 0 && (
            <div className="image-grid" style={{ marginTop: 10 }}>
              {files.map((f, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(f)} alt={f.name} />
                  <button type="button" className="danger" style={{ position: 'absolute', top: 4, right: 4, padding: '2px 8px', fontSize: 11 }}
                          onClick={() => removeFile(i)}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button type="submit" disabled={saving}>{saving ? 'Submitting…' : `Submit ${type === 'lost' ? 'Lost' : 'Found'} Report`}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
