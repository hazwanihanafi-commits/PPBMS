import useSWR from 'swr';
const fetcher = url => fetch(url, { headers: { Authorization: 'Bearer ' + localStorage.getItem('ppbms_token') } }).then(r=>r.json());

export default function Admin(){
  const { data } = useSWR('/api/admin/students', fetcher);
  if(!data) return <div>Loading...</div>;
  const rows = data.rows || [];
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div>
        {rows.map(r=>(
          <div key={r.matric||r.student_name} className='card'>
            <div><strong>{r.student_name}</strong> ({r.programme})</div>
            <div>Supervisor: {r.main_supervisor} - Email: {r.student_email}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
