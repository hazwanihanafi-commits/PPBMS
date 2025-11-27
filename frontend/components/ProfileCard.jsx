// components/ProfileCard.jsx
export default function ProfileCard({ name, programme, supervisor, email, status }) {
  const initials = (name || "NA").split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase();
  // avatar colors use gradient background via inline style
  const avatarStyle = { background: "linear-gradient(90deg,#7a39a6,#ff7a3d)" };

  return (
    <div className="gradient-card">
      <div style={{display:'flex', gap:16, alignItems:'center'}}>
        <div className="avatar" style={avatarStyle}>{initials}</div>
        <div>
          <div style={{fontSize:18,fontWeight:700}}>{name}</div>
          <div className="muted small">{programme}</div>
        </div>
      </div>

      <div style={{marginTop:14}}>
        <div><strong>Supervisor:</strong> <span className="muted">{supervisor}</span></div>
        <div style={{marginTop:6}}><strong>Email:</strong> <a href={`mailto:${email}`} className="muted">{email}</a></div>
        <div style={{marginTop:8}}><strong>Status:</strong> <span style={{marginLeft:8,fontWeight:700}}>{status || '—'}</span></div>
      </div>

      <div><strong>Field:</strong> {row.field || "—"}</div>
      <div><strong>Department:</strong> {row.department || "—"}</div>

      <div style={{marginTop:12, display:'flex', gap:10}}>
        <div className="pill">✔ On Track</div>
        <div className="pill">🧾 Profile</div>
      </div>
    </div>
  );
}
