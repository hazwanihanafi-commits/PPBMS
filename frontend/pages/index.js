import Link from 'next/link';
  export default function Home() {
  return (
    <div style={{ padding: 40 }}>
      <h1>PPBMS Dashboard</h1>
      <p>You are logged in.</p>
      <a href="/admin">Admin Dashboard</a><br/>
      <a href="/student">Student Dashboard</a>
    </div>
  );
}

  
