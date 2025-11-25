import useSWR from 'swr';
import { Chart } from 'react-google-charts';

const fetcher = url => fetch(url, { headers: { Authorization: 'Bearer ' + localStorage.getItem('ppbms_token') } }).then(r=>r.json());

export default function Timeline(){
  const { data, error } = useSWR('/api/student/me', fetcher);
  if(error) return <div>Error loading: {error.message}</div>;
  if(!data) return <div>Loading...</div>;
  const row = data.row;
  // build gantt demo from planned_* fields
  const milestones = ['ETHICS','PROPOSAL','DATA1','DATA2','SEMINAR','PROGRESS1','THESIS'].map(code=>({
    code, title: code, start: row[`planned_${code}`] || null, end: row[`planned_${code}`] || row.start_date
  })).filter(m=>m.start);
  const chartData = [[{type:'string', label:'Task ID'}, {type:'string', label:'Task Name'}, {type:'date', label:'Start Date'}, {type:'date', label:'End Date'}]];
  for(const m of milestones){
    const s = new Date(m.start);
    const e = new Date(m.end || m.start);
    chartData.push([m.code, m.title, s, e]);
  }
  return (
    <div>
      <h2>My Timeline</h2>
      <div className='card'>
        <strong>{row.student_name}</strong> ({row.programme}) - Supervisor: {row.main_supervisor}
      </div>
      <Chart chartType="Gantt" width="100%" height={300} data={chartData} />
    </div>
  );
}
