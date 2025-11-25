import Link from 'next/link';
export default function Home(){
  return (
    <div>
      <div className="header">
        <h1>AMDI PPBMS</h1>
        <nav>
          <Link href="/login">Login</Link> | <Link href="/student/timeline">Student Timeline (demo)</Link> | <Link href="/admin">Admin</Link>
        </nav>
      </div>
      <p>Welcome. Use Login to sign in with your USM Google account.</p>
    </div>
  );
}
