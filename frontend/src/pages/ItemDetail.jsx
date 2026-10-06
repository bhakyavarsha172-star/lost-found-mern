import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { IMAGE_BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ItemDetail() {
  const { id } = useParams();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get(`/items/${id}`).then(res => setItem(res.data)).catch(() => setError('Item not found'));
    api.get(`/items/${id}/matches`).then(res => setMatches(res.data)).catch(() => {});
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (error) return <div className="container"><p className="error-msg">{error}</p></div>;
  if (!item) return <div className="container"><p style={{ color: '#8a90a0' }}>Loading…</p></div>;

  const isOwner = isLoggedIn && item.reportedBy?._id === user.id;
  const dateStr = new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const claim = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post(`/items/${id}/claim`, { note: claimNote });
      setNotice('Claim submitted — the reporter can now see your contact details.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim item');
    } finally {
      setBusy(false);
    }
  };

  const markResolved = async () => {
    setBusy(true);
    try {
      await api.patch(`/items/${id}/status`, { status: 'resolved' });
      load();
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    setBusy(true);
    try {
      await api.patch(`/items/${id}/status`, { status: 'open' });
      load();
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async () => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    try {
      await api.delete(`/items/${id}`);
      navigate('/');
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <div className="card">
        <h2>
          {item.title}
          <span className={`badge ${item.type}`}>{item.type === 'lost' ? 'Lost' : 'Found'}</span>
          <span className={`badge ${item.status}`}>{item.status}</span>
        </h2>
        {notice && <p className="success-msg">{notice}</p>}
        {error && <p className="error-msg">{error}</p>}

        {item.images?.length > 0 && (
          <div className="image-grid">
            {item.images.map(img => (
              <img key={img._id} src={`${IMAGE_BASE_URL}/uploads/${img.storedName}`} alt={item.title} />
            ))}
          </div>
        )}

        <p>{item.description}</p>
        <div className="two-col" style={{ marginTop: 10 }}>
          <div><strong>Category:</strong> {item.category}</div>
          <div><strong>Location {item.type === 'lost' ? 'lost' : 'found'}:</strong> {item.location}</div>
          <div><strong>Date:</strong> {dateStr}</div>
          <div><strong>Reported by:</strong> {item.reportedBy?.name}</div>
        </div>

        <div className="card" style={{ background: '#f8f9fb', marginTop: 16 }}>
          <strong>Contact info</strong>
          <p style={{ margin: '6px 0' }}>{item.contactName}</p>
          {item.contactPhone && <p style={{ margin: '2px 0' }}>📞 {item.contactPhone}</p>}
          {item.contactEmail && <p style={{ margin: '2px 0' }}>✉️ {item.contactEmail}</p>}
        </div>

        {item.status === 'claimed' && item.claimedBy && (isOwner || item.claimedBy._id === user?.id) && (
          <div className="card" style={{ background: '#fff7e0', marginTop: 12 }}>
            <strong>Claimed by:</strong> {item.claimedBy.name} ({item.claimedBy.email}{item.claimedBy.phone ? `, ${item.claimedBy.phone}` : ''})
            {item.claimNote && <p style={{ marginTop: 6 }}>"{item.claimNote}"</p>}
          </div>
        )}

        <div className="form-row" style={{ marginTop: 16 }}>
          {isOwner && item.status !== 'resolved' && (
            <button className="secondary" onClick={markResolved} disabled={busy}>Mark Resolved</button>
          )}
          {isOwner && item.status === 'resolved' && (
            <button className="secondary" onClick={reopen} disabled={busy}>Reopen</button>
          )}
          {isOwner && <button className="danger" onClick={deleteItem}>Delete</button>}
        </div>

        {!isOwner && item.type === 'found' && item.status === 'open' && (
          <div style={{ marginTop: 16 }}>
            {isLoggedIn ? (
              <>
                <label style={{ fontSize: 12, color: '#667' }}>Optional note to the finder (e.g. proof it's yours)</label>
                <textarea value={claimNote} onChange={e => setClaimNote(e.target.value)} placeholder="Describe something only the owner would know…" />
                <button onClick={claim} disabled={busy}>This Is Mine — Claim It</button>
              </>
            ) : (
              <p><Link to="/login">Log in</Link> to claim this item.</p>
            )}
          </div>
        )}
      </div>

      {matches.length > 0 && (
        <div className="card">
          <h3>Possible matches</h3>
          <p style={{ fontSize: 13, color: '#667', marginTop: 0 }}>
            {item.type === 'lost' ? 'Found reports' : 'Lost reports'} that look similar, ranked by category, location, date and description overlap.
          </p>
          <div className="match-list">
            {matches.map(m => (
              <div key={m.item._id} className="match-item">
                <div>
                  <Link to={`/items/${m.item._id}`}>{m.item.title}</Link>
                  <div style={{ fontSize: 12, color: '#8a90a0' }}>{m.item.category} · {m.item.location}</div>
                </div>
                <span className="score-pill">{m.score}% match</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
