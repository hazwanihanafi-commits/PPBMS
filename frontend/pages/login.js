import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage(){
  const router = useRouter();
  useEffect(()=> {
    // Simple instruction page. Implement Google Sign-In on frontend and call /auth/verify on backend.
  },[]);
  return (
    <div>
      <h2>Login (instructions)</h2>
      <p>This demo expects the frontend to obtain an ID token from Google Sign-In (client) and POST it to <code>/auth/verify</code>.</p>
      <ol>
        <li>Create OAuth client ID in Google Cloud and set NEXT_PUBLIC_GOOGLE_CLIENT_ID.</li>
        <li>Use Google Sign-In on the client to get idToken.</li>
        <li>POST to <code>{process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/auth/verify</code> with body <code>{{ idToken }}</code>.</li>
        <li>Save returned JWT in localStorage and attach <code>Authorization: Bearer &lt;token&gt;</code> to API requests.</li>
      </ol>
    </div>
  );
}
