import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useAuthGuard } from "@/utils/useAuthGuard";
import { authFetch } from "@/utils/authFetch";
import TopBar from "../../components/TopBar";
import YouTubeVideo from "../../components/orientation/YouTubeVideo";
import { ORIENTATION_MODULES, FINAL_ASSESSMENT } from "../../data/orientationModules";

export default function OrientationPage() {
  const { ready, user } = useAuthGuard("student");
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState({});
  const [selected, setSelected] = useState(1);
  const [answers, setAnswers] = useState({});
  const [finalAnswers, setFinalAnswers] = useState({});
  const [view, setView] = useState("modules");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const module = useMemo(() => ORIENTATION_MODULES.find(m => m.id === selected) || ORIENTATION_MODULES[0], [selected]);

  async function load() {
    setLoading(true);
    try {
      const [studentRes, progressRes] = await Promise.all([authFetch("/api/student/me"), authFetch("/api/orientation/progress")]);
      const student = await studentRes.json(); const p = await progressRes.json();
      if (!studentRes.ok) throw new Error(student.error || "Unable to load student profile");
      if (!progressRes.ok) throw new Error(p.error || "Unable to load orientation progress");
      setProfile(student.row); setProgress(p.progress || {});
    } catch (e) { setMessage(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (ready) load(); }, [ready]);

  async function saveModule(id, payload) {
    const res = await authFetch(`/api/orientation/module/${id}`, { method:"POST", body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to save progress");
    setProgress(data.progress || {}); return data;
  }

  async function completeSelfCheck() {
    const q = module.questions[0]; const selectedAnswer = answers[module.id];
    if (selectedAnswer === undefined) return setMessage("Please select an answer first.");
    const correct = Number(selectedAnswer) === q.correct;
    await saveModule(module.id, { quizCompleted: true, quizScore: correct ? 100 : 0 });
    setMessage(correct ? "Correct — module self-check completed." : `Not quite. ${q.feedback}`);
  }

  async function markContent() { await saveModule(module.id, { contentRead:true }); setMessage("Content recorded. Complete the activity/self-check to finish the module."); }
  async function markActivity() { await saveModule(module.id, { activityCompleted:true }); setMessage("Activity recorded."); }
  async function videoCompleted(percent) { if (percent >= 90) await saveModule(module.id, { videoCompleted:true, videoPercent:percent }); }

  async function finishModule() {
    const p = progress[module.id] || {};
    if (!(p.contentRead && p.activityCompleted && p.quizCompleted && (p.quizScore || 0) >= 70)) return setMessage("Complete the content, activity and self-check with at least 70% before completing this module.");
    await saveModule(module.id, { acknowledge:true });
    setMessage("Module completed ✓");
  }

  async function submitFinal() {
    let score = 0;
    FINAL_ASSESSMENT.forEach((q,i) => { if (Number(finalAnswers[i]) === q.correct) score++; });
    const pct = Math.round((score / FINAL_ASSESSMENT.length) * 100);
    const res = await authFetch("/api/orientation/final-assessment", { method:"POST", body:JSON.stringify({score:pct}) });
    const data = await res.json();
    setMessage(data.message || `Final score: ${pct}%`); await load();
  }

  if (!ready || loading) return <div className="min-h-screen flex items-center justify-center">Loading Orientation…</div>;
  if (!profile) return <div className="p-8 text-red-600">{message || "Unable to load profile."}</div>;

  const completed = ORIENTATION_MODULES.filter(m => progress[m.id]?.completed).length;
  const percent = Math.round((completed / ORIENTATION_MODULES.length) * 100);

  return <>
    <TopBar user={user} />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push("/student")} className="text-sm text-purple-700 mb-4">← Back to PPBMS Dashboard</button>
        <div className="rounded-3xl bg-gradient-to-r from-[#53257f] via-indigo-600 to-blue-600 text-white p-7 shadow-xl">
          <p className="text-xs uppercase tracking-[.2em] text-purple-100">PKTAAB • Universiti Sains Malaysia</p>
          <h1 className="text-3xl font-bold mt-2">Welcome, {profile.student_name} 👋</h1>
          <p className="mt-2 text-purple-100">Postgraduate Research Student Orientation & Onboarding</p>
          <div className="mt-6"><div className="flex justify-between text-xs mb-2"><span>Orientation progress</span><span>{completed}/{ORIENTATION_MODULES.length} modules • {percent}%</span></div><div className="h-3 bg-white/20 rounded-full"><div className="h-3 bg-[#ffb703] rounded-full" style={{width:`${percent}%`}} /></div></div>
        </div>

        {message && <div className="mt-5 rounded-2xl border bg-white p-4 text-sm shadow-sm">{message}</div>}

        <div className="grid lg:grid-cols-[320px_1fr] gap-6 mt-6">
          <aside className="bg-white rounded-3xl shadow p-4 h-fit lg:sticky lg:top-4">
            <button onClick={()=>setView("modules")} className={`w-full text-left p-3 rounded-xl mb-2 ${view==="modules"?"bg-purple-50 text-purple-700":"hover:bg-slate-50"}`}>🎓 Orientation Modules</button>
            <button onClick={()=>setView("final")} className={`w-full text-left p-3 rounded-xl mb-4 ${view==="final"?"bg-purple-50 text-purple-700":"hover:bg-slate-50"}`}>📝 Final Knowledge Check</button>
            <div className="space-y-2">{ORIENTATION_MODULES.map(m => <button key={m.id} onClick={()=>{setSelected(m.id);setView("modules");}} className={`w-full text-left p-3 rounded-xl border ${selected===m.id&&view==="modules"?"border-purple-400 bg-purple-50":"border-transparent hover:bg-slate-50"}`}><div className="flex gap-3"><span className="font-bold text-purple-600">{String(m.id).padStart(2,"0")}</span><div className="min-w-0"><p className="font-semibold text-sm">{m.title}</p><p className="text-xs text-slate-500">{progress[m.id]?.completed?"✓ Completed":"Not completed"}</p></div></div></button>)}</div>
          </aside>

          <main className="bg-white rounded-3xl shadow p-6 md:p-8">
            {view === "final" ? <div><span className="text-xs uppercase tracking-widest text-purple-600 font-bold">Final Assessment</span><h2 className="text-2xl font-bold mt-2">Knowledge Check</h2><p className="text-slate-600 mt-2">Answer all questions. A score of 70% or above is required.</p><div className="space-y-6 mt-6">{FINAL_ASSESSMENT.map((q,i)=><div key={i} className="border rounded-2xl p-5"><p className="font-semibold">{i+1}. {q.q}</p>{q.options.map((o,j)=><label key={j} className="flex gap-3 mt-3 text-sm cursor-pointer"><input type="radio" name={`final-${i}`} checked={Number(finalAnswers[i])===j} onChange={()=>setFinalAnswers({...finalAnswers,[i]:j})}/><span>{o}</span></label>)}</div>)}</div><button onClick={submitFinal} className="mt-7 px-6 py-3 rounded-xl bg-purple-700 text-white font-semibold">Submit Final Assessment</button></div> : <div>
              <div className="flex flex-col md:flex-row md:justify-between gap-4"><div><span className="text-xs uppercase tracking-widest text-purple-600 font-bold">Module {module.id}</span><h2 className="text-3xl font-bold mt-2">{module.title}</h2><p className="text-slate-500 mt-1">{module.subtitle} • {module.minutes} min</p></div><div className="rounded-2xl bg-slate-50 p-4 text-sm">Status: <b>{progress[module.id]?.completed?"Completed":"In progress"}</b></div></div>
              <div className="mt-7 rounded-2xl bg-purple-50 p-5"><b>Why this matters</b><p className="text-sm text-slate-700 mt-1">{module.why}</p></div>
              <section className="mt-7"><h3 className="font-bold text-xl">What you will be able to do</h3><ul className="list-disc pl-6 mt-3 text-sm space-y-2">{module.outcomes.map((x,i)=><li key={i}>{x}</li>)}</ul></section>
              <section className="mt-7"><h3 className="font-bold text-xl">Learn</h3><div className="space-y-4 mt-3">{module.content.map((x,i)=><p key={i} className="leading-7 text-slate-700">{x}</p>)}</div><button onClick={markContent} className="mt-4 px-4 py-2 rounded-xl border border-purple-200 text-purple-700">Mark content reviewed</button></section>
              <section className="mt-8"><h3 className="font-bold text-xl">Video</h3><p className="text-sm text-slate-500 mt-1">Watch the required video if one has been configured.</p><div className="mt-4"><YouTubeVideo videoId={module.videoId} onCompleted={videoCompleted}/></div></section>
              <section className="mt-8"><h3 className="font-bold text-xl">Guided Activity</h3><div className="mt-3 rounded-2xl border p-5 bg-slate-50"><p className="text-sm">Write one action you will take after this module in your research journey. You can record it in your research notes/PPBMS plan.</p><button onClick={markActivity} className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white">I completed the activity</button></div></section>
              <section className="mt-8"><h3 className="font-bold text-xl">Self-Check</h3><div className="mt-3 border rounded-2xl p-5"><p className="font-semibold">{module.questions[0].q}</p>{module.questions[0].options.map((o,i)=><label key={i} className="flex gap-3 mt-3 text-sm cursor-pointer"><input type="radio" name={`q-${module.id}`} checked={Number(answers[module.id])===i} onChange={()=>setAnswers({...answers,[module.id]:i})}/><span>{o}</span></label>)}<button onClick={completeSelfCheck} className="mt-5 px-4 py-2 rounded-xl bg-purple-700 text-white">Check my answer</button></div></section>
              <div className="mt-8 flex flex-wrap gap-3"><button onClick={finishModule} className="px-6 py-3 rounded-xl bg-[#53257f] text-white font-semibold">Complete Module ✓</button>{module.id<12&&<button onClick={()=>setSelected(module.id+1)} className="px-6 py-3 rounded-xl border">Next Module →</button>}</div>
            </div>}
          </main>
        </div>
      </div>
    </div>
  </>;
}
