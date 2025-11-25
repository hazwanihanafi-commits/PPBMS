import cron from 'node-cron';
import { runLatenessCheck } from '../jobs/lateness.js';

export function scheduleCronJobs(){
  // daily at 06:00
  cron.schedule('0 6 * * *', async ()=> {
    console.log('[cron] running daily lateness check');
    try { await runLatenessCheck(); } catch(e){ console.error('cron error', e.message); }
  });
  console.log('Cron jobs scheduled (daily lateness check @ 06:00).');
}
