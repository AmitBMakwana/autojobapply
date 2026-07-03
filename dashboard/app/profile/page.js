'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

/* ─── helpers ─── */
const parseJSON = (v, fallback) => { try { return JSON.parse(v || JSON.stringify(fallback)); } catch { return fallback; } };

/* ── Skill category colour palettes ── */
const CAT_COLORS = [
  { pill: 'bg-violet-500/15 text-violet-300 border-violet-500/30', header: 'text-violet-400', border: 'border-l-violet-500' },
  { pill: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',       header: 'text-cyan-400',   border: 'border-l-cyan-500' },
  { pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', header: 'text-emerald-400', border: 'border-l-emerald-500' },
  { pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',    header: 'text-amber-400',  border: 'border-l-amber-500' },
  { pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30',       header: 'text-rose-400',   border: 'border-l-rose-500' },
  { pill: 'bg-sky-500/15 text-sky-300 border-sky-500/30',          header: 'text-sky-400',    border: 'border-l-sky-500' },
];

function normalise(r) {
  if (!r) return null;
  return {
    ...r,
    skills:         Array.isArray(r.skills)         ? r.skills         : parseJSON(r.skills, []),
    workHistory:    Array.isArray(r.workHistory)    ? r.workHistory    : parseJSON(r.workHistory, []),
    education:      Array.isArray(r.education)      ? r.education      : parseJSON(r.education, []),
    certifications: Array.isArray(r.certifications) ? r.certifications : parseJSON(r.certifications, []),
    projects:       Array.isArray(r.projects)       ? r.projects       : parseJSON(r.projects, []),
    additionalInfo: (r.additionalInfo && typeof r.additionalInfo === 'object') ? r.additionalInfo : parseJSON(r.additionalInfo, { languages: [], hobbies: [] }),
  };
}

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/* ─── shared style tokens ─── */
const inp  = 'w-full px-4 py-3 bg-[#0a0b14] border border-white/8 focus:border-purple-500/60 rounded-xl text-gray-200 text-sm outline-none transition placeholder-gray-600';
const ta   = `${inp} resize-none leading-relaxed`;
const lbl  = 'block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5';
const addB = 'text-purple-400 hover:text-purple-300 text-xs font-bold transition cursor-pointer flex items-center gap-1';
const delB = 'text-gray-600 hover:text-red-400 transition cursor-pointer shrink-0 text-xs';

const TABS = [
  { id: 'info',       label: 'Personal',   icon: '👤' },
  { id: 'summary',    label: 'Summary',    icon: '📝' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'education',  label: 'Education',  icon: '🎓' },
  { id: 'skills',     label: 'Skills',     icon: '⚡' },
  { id: 'projects',   label: 'Projects',   icon: '🛠' },
  { id: 'extra',      label: 'Extra',      icon: '📌' },
];

export default function ResumesPage() {
  const [resumes, setResumes]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab]           = useState('info');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]           = useState({ type: '', text: '' });
  const [menuId, setMenuId]     = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function loadList() {
    try {
      setLoading(true);
      const data = await api.listResumes();
      setResumes(data);
      if (data.length > 0) setSelected(normalise(data[0]));
    } catch (e) { flash('error', e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (localStorage.getItem('jobforge_logged_in') !== 'true') { window.location.href = '/login'; return; }
    loadList();
  }, []);

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 4000); };
  const selectResume = (r) => { setSelected(normalise(r)); setTab('info'); setMenuId(null); };

  const handleCreate = async () => {
    try {
      const r = await api.createResume(`Resume ${resumes.length + 1}`);
      setResumes(prev => [normalise(r), ...prev]);
      setSelected(normalise(r)); setTab('info');
    } catch (e) { flash('error', e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume version?')) return;
    try {
      await api.deleteResume(id);
      const next = resumes.filter(r => r.id !== id);
      setResumes(next);
      if (selected?.id === id) setSelected(next.length > 0 ? normalise(next[0]) : null);
      setMenuId(null);
    } catch (e) { flash('error', e.message); }
  };

  const handleDuplicate = async (id) => {
    try {
      const copy = await api.duplicateResume(id);
      setResumes(prev => [normalise(copy), ...prev]);
      setSelected(normalise(copy)); setMenuId(null);
      flash('success', 'Resume duplicated!');
    } catch (e) { flash('error', e.message); }
  };

  const commitRename = async () => {
    if (!renaming) return;
    try {
      const updated = await api.updateResume(renaming.id, { name: renaming.value });
      setResumes(prev => prev.map(r => r.id === renaming.id ? normalise(updated) : r));
      if (selected?.id === renaming.id) setSelected(p => ({ ...p, name: renaming.value }));
      setRenaming(null); setMenuId(null);
    } catch (e) { flash('error', e.message); }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.setDefaultResume(id);
      setResumes(prev => prev.map(r => ({ ...r, isDefault: r.id === id })));
      setMenuId(null); flash('success', 'Default resume updated.');
    } catch (e) { flash('error', e.message); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    try {
      setUploading(true);
      const { resume } = await api.uploadToResume(selected.id, file);
      const norm = normalise(resume);
      setSelected(norm);
      setResumes(prev => prev.map(r => r.id === norm.id ? norm : r));
      flash('success', 'Resume parsed and loaded!');
    } catch (e) { flash('error', e.message); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      setSaving(true);
      const updated = await api.updateResume(selected.id, selected);
      const norm = normalise(updated);
      setSelected(norm);
      setResumes(prev => prev.map(r => r.id === norm.id ? norm : r));
      flash('success', 'Saved successfully!');
    } catch (e) { flash('error', e.message); }
    finally { setSaving(false); }
  };

  /* ─── field mutators ─── */
  const set = (f, v) => setSelected(p => ({ ...p, [f]: v }));

  const setWork   = (wi, f, v) => setSelected(p => { const h=[...p.workHistory]; h[wi]={...h[wi],[f]:v}; return {...p,workHistory:h}; });
  const setBullet = (wi, bi, v) => setSelected(p => { const h=[...p.workHistory]; const b=[...(h[wi].bullets||[])]; b[bi]=v; h[wi]={...h[wi],bullets:b}; return {...p,workHistory:h}; });
  const addBullet = (wi) => setSelected(p => { const h=[...p.workHistory]; h[wi]={...h[wi],bullets:[...(h[wi].bullets||[]),'']}; return {...p,workHistory:h}; });
  const delBullet = (wi, bi) => setSelected(p => { const h=[...p.workHistory]; const b=[...h[wi].bullets]; b.splice(bi,1); h[wi]={...h[wi],bullets:b}; return {...p,workHistory:h}; });
  const addWork   = () => setSelected(p => ({...p,workHistory:[...(p.workHistory||[]),{company:'',title:'',location:'',dates:'',bullets:['']}]}));
  const delWork   = (i) => setSelected(p => { const h=[...p.workHistory]; h.splice(i,1); return {...p,workHistory:h}; });

  const setEdu = (i,f,v) => setSelected(p => { const e=[...p.education]; e[i]={...e[i],[f]:v}; return {...p,education:e}; });
  const addEdu = () => setSelected(p => ({...p,education:[...(p.education||[]),{institution:'',degree:'',field:'',dates:'',gpa:'',achievements:''}]}));
  const delEdu = (i) => setSelected(p => { const e=[...p.education]; e.splice(i,1); return {...p,education:e}; });

  const setSkillCat  = (g,v) => setSelected(p => { const s=[...p.skills]; s[g]={...s[g],category:v}; return {...p,skills:s}; });
  const addSkillGroup= () => setSelected(p => ({...p,skills:[...(p.skills||[]),{category:'',items:[]}]}));
  const delSkillGroup= (g) => setSelected(p => { const s=[...p.skills]; s.splice(g,1); return {...p,skills:s}; });
  const addSkillItem = (g) => setSelected(p => { const s=[...p.skills]; s[g]={...s[g],items:[...(s[g].items||[]),'']}; return {...p,skills:s}; });
  const delSkillItem = (g,i) => setSelected(p => { const s=[...p.skills]; const items=[...(s[g].items||[])]; items.splice(i,1); s[g]={...s[g],items}; return {...p,skills:s}; });

  const setProj = (i,f,v) => setSelected(p => { const pr=[...p.projects]; pr[i]={...pr[i],[f]:v}; return {...p,projects:pr}; });
  const addProj = () => setSelected(p => ({...p,projects:[...(p.projects||[]),{name:'',role:'',tech:'',link:'',github:'',dates:'',status:'',description:'',highlights:['']}]}));
  const delProj = (i) => setSelected(p => { const pr=[...p.projects]; pr.splice(i,1); return {...p,projects:pr}; });
  const addProjHL = (i) => setSelected(p => { const pr=[...p.projects]; pr[i]={...pr[i],highlights:[...(pr[i].highlights||[]),'']}; return {...p,projects:pr}; });
  const delProjHL = (i,hi) => setSelected(p => { const pr=[...p.projects]; const hl=[...(pr[i].highlights||[])]; hl.splice(hi,1); pr[i]={...pr[i],highlights:hl}; return {...p,projects:pr}; });
  const setProjHL = (i,hi,v) => setSelected(p => { const pr=[...p.projects]; const hl=[...(pr[i].highlights||[])]; hl[hi]=v; pr[i]={...pr[i],highlights:hl}; return {...p,projects:pr}; });

  const setAddl = (f,i,v) => setSelected(p => { const info={...p.additionalInfo}; const arr=[...(info[f]||[])]; arr[i]=v; info[f]=arr; return {...p,additionalInfo:info}; });
  const addAddl = (f) => setSelected(p => { const info={...p.additionalInfo}; info[f]=[...(info[f]||[]),''];  return {...p,additionalInfo:info}; });
  const delAddl = (f,i) => setSelected(p => { const info={...p.additionalInfo}; const arr=[...(info[f]||[])]; arr.splice(i,1); info[f]=arr; return {...p,additionalInfo:info}; });

  const setCert = (i,v) => setSelected(p => { const c=[...p.certifications]; c[i]=v; return {...p,certifications:c}; });
  const addCert = () => setSelected(p => ({...p,certifications:[...(p.certifications||[]),'']}));
  const delCert = (i) => setSelected(p => { const c=[...p.certifications]; c.splice(i,1); return {...p,certifications:c}; });

  /* ─── render ─── */
  return (
    <div className="w-full h-[calc(100vh-56px)] flex flex-col">

      {/* toast */}
      {msg.text && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl border animate-fade-in ${
          msg.type === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
        }`}>
          {msg.type === 'error' ? '⚠️' : '✅'} {msg.text}
        </div>
      )}

      <div className="flex flex-1 min-h-0">

        {/* ══════ LEFT SIDEBAR ══════ */}
        <aside className="w-[220px] shrink-0 border-r border-white/6 flex flex-col bg-[#0a0b14]">
          <div className="px-4 py-4 border-b border-white/6">
            <h2 className="text-[11px] font-black text-gray-300 uppercase tracking-widest">My Resumes</h2>
            <p className="text-[10px] text-gray-600 mt-0.5">{resumes.length} version{resumes.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin' }}>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
              </div>
            ) : resumes.map(r => (
              <div
                key={r.id}
                onClick={() => selectResume(r)}
                className={`relative mx-2 mb-1 px-3 py-3 rounded-xl cursor-pointer transition-all group border ${
                  selected?.id === r.id ? 'bg-purple-900/25 border-purple-500/40' : 'border-transparent hover:bg-white/4 hover:border-white/8'
                }`}
              >
                {renaming?.id === r.id ? (
                  <input
                    autoFocus value={renaming.value}
                    onChange={e => setRenaming(p => ({ ...p, value: e.target.value }))}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null); }}
                    className="w-full bg-[#0a0a0f] border border-purple-500/50 rounded-lg px-2 py-1 text-xs text-white outline-none"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-200 truncate leading-tight">{r.name}</p>
                        {r.isDefault && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/25 rounded">Default</span>
                        )}
                        <p className="text-[10px] text-gray-600 mt-1">{formatDate(r.updatedAt)}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setMenuId(menuId === r.id ? null : r.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs cursor-pointer shrink-0"
                      >⋯</button>
                    </div>

                    {menuId === r.id && (
                      <div ref={menuRef} className="absolute right-2 top-10 z-50 w-44 bg-[#1a1b2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1" onClick={e => e.stopPropagation()}>
                        {[
                          { icon: '✏️', label: 'Rename',         action: () => { setRenaming({ id: r.id, value: r.name }); setMenuId(null); } },
                          { icon: '📋', label: 'Duplicate',      action: () => handleDuplicate(r.id) },
                          { icon: '⭐', label: 'Set as Default', action: () => handleSetDefault(r.id), hide: r.isDefault },
                          { icon: '🗑', label: 'Delete',         action: () => handleDelete(r.id), danger: true },
                        ].filter(x => !x.hide).map(item => (
                          <button key={item.label} onClick={item.action}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition cursor-pointer ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:bg-white/8'}`}
                          >
                            <span>{item.icon}</span>{item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {resumes.length === 0 && !loading && (
              <div className="px-4 py-8 text-center text-xs text-gray-600">No resumes yet.<br />Click below to create one.</div>
            )}
          </div>

          <div className="p-3 border-t border-white/6">
            <button onClick={handleCreate} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-purple-500/20">
              + New Resume
            </button>
          </div>
        </aside>

        {/* ══════ MAIN EDITOR ══════ */}
        {selected ? (
          <form onSubmit={handleSave} className="flex-1 min-w-0 flex flex-col bg-[#0d0e1a]">

            {/* top bar: name + tabs */}
            <div className="border-b border-white/6 bg-[#0a0b14] px-6 py-3 flex items-center gap-6 shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white truncate">{selected.name}</p>
                <p className="text-[10px] text-gray-600">Updated {formatDate(selected.updatedAt)}</p>
              </div>
              <div className="flex gap-0.5 flex-wrap flex-1">
                {TABS.map(t => (
                  <button key={t.id} type="button" onClick={() => setTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      tab === t.id ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* scrollable editor body */}
            <div className="flex-1 overflow-y-auto px-7 py-6" style={{ scrollbarWidth: 'thin' }}>

              {/* ── PERSONAL INFO ── */}
              {tab === 'info' && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg font-black text-white">
                        {(selected.personName || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Personal Details</h3>
                        <p className="text-[10px] text-gray-500">Your contact information</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name',    field: 'personName', type: 'text',  ph: 'John Smith' },
                        { label: 'Email',        field: 'email',      type: 'email', ph: 'john@example.com' },
                        { label: 'Phone',        field: 'phone',      type: 'text',  ph: '+1 (555) 000-0000' },
                        { label: 'Location',     field: 'location',   type: 'text',  ph: 'New York, USA' },
                        { label: 'LinkedIn URL', field: 'linkedin',   type: 'text',  ph: 'linkedin.com/in/john' },
                        { label: 'GitHub / Portfolio', field: 'portfolio', type: 'text', ph: 'github.com/john' },
                      ].map(({ label, field, type, ph }) => (
                        <div key={field}>
                          <label className={lbl}>{label}</label>
                          <input type={type} value={selected[field] || ''} onChange={e => set(field, e.target.value)} className={inp} placeholder={ph} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SUMMARY ── */}
              {tab === 'summary' && (
                <div className="max-w-2xl space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-purple-500/8 border border-purple-500/15 rounded-2xl">
                    <span className="text-2xl">💡</span>
                    <p className="text-xs text-gray-400 leading-relaxed">A strong summary grabs recruiter attention in the first 6 seconds. Keep it 3–4 sentences, highlight your years of experience, top skills, and what you uniquely bring.</p>
                  </div>
                  <div>
                    <label className={lbl}>Professional Summary</label>
                    <textarea value={selected.summary || ''} onChange={e => set('summary', e.target.value)} rows={10} className={ta} placeholder="Experienced software engineer with 5+ years building scalable web applications…" />
                    <p className="text-[10px] text-gray-600 mt-2 text-right">{(selected.summary || '').length} chars</p>
                  </div>
                </div>
              )}

              {/* ── EXPERIENCE ── */}
              {tab === 'experience' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{selected.workHistory?.length || 0} roles</p>
                    <button type="button" onClick={addWork} className="px-4 py-2 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-600/25 transition cursor-pointer">+ Add Role</button>
                  </div>
                  {selected.workHistory?.map((work, wi) => (
                    <div key={wi} className="bg-[#12131f] border border-white/6 rounded-2xl overflow-hidden">
                      {/* role header */}
                      <div className="px-5 py-3 bg-white/3 border-b border-white/6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-xs">💼</div>
                          <span className="text-xs font-bold text-gray-300">{work.title || 'New Role'} {work.company ? `@ ${work.company}` : ''}</span>
                        </div>
                        <button type="button" onClick={() => delWork(wi)} className="text-gray-600 hover:text-red-400 text-xs cursor-pointer px-2 py-1 hover:bg-red-500/10 rounded transition">Remove</button>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { lbl: 'Job Title',  f: 'title',    ph: 'Software Engineer' },
                            { lbl: 'Company',    f: 'company',  ph: 'Acme Corp' },
                            { lbl: 'Location',   f: 'location', ph: 'Remote / New York' },
                            { lbl: 'Date Range', f: 'dates',    ph: 'Jan 2021 – Present' },
                          ].map(({ lbl: l, f, ph }) => (
                            <div key={f}>
                              <label className={lbl}>{l}</label>
                              <input type="text" value={work[f] || ''} onChange={e => setWork(wi, f, e.target.value)} className={inp} placeholder={ph} />
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2 pt-3 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bullet Points</label>
                            <button type="button" onClick={() => addBullet(wi)} className={addB}>+ Add Bullet</button>
                          </div>
                          {work.bullets?.map((b, bi) => (
                            <div key={bi} className="flex gap-2 items-start">
                              <span className="text-purple-500 mt-3.5 text-xs shrink-0">▸</span>
                              <textarea value={b} onChange={e => setBullet(wi, bi, e.target.value)} rows={2} className={`${ta} flex-1`} placeholder="Achieved X by doing Y, resulting in Z% improvement…" />
                              <button type="button" onClick={() => delBullet(wi, bi)} className={`${delB} mt-2`}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selected.workHistory || selected.workHistory.length === 0) && (
                    <div className="py-16 text-center border border-dashed border-white/8 rounded-2xl text-gray-600 text-sm">No roles yet. Click <strong className="text-gray-400">+ Add Role</strong>.</div>
                  )}
                </div>
              )}

              {/* ── EDUCATION ── */}
              {tab === 'education' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button type="button" onClick={addEdu} className="px-4 py-2 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-600/25 transition cursor-pointer">+ Add Education</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selected.education?.map((edu, i) => (
                      <div key={i} className="bg-[#12131f] border border-white/6 rounded-2xl overflow-hidden">
                        <div className="px-5 py-2.5 bg-white/3 border-b border-white/6 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🎓</span>
                            <span className="text-xs font-bold text-gray-300 truncate">{edu.institution || 'New Degree'}</span>
                          </div>
                          <button type="button" onClick={() => delEdu(i)} className="text-gray-600 hover:text-red-400 text-[10px] cursor-pointer">Remove</button>
                        </div>
                        <div className="p-4 space-y-3">
                          <div><label className={lbl}>Degree / Qualification</label><input type="text" value={edu.degree || ''} onChange={e => setEdu(i, 'degree', e.target.value)} className={inp} placeholder="B.Sc. Computer Science" /></div>
                          <div><label className={lbl}>Field of Study</label><input type="text" value={edu.field || ''} onChange={e => setEdu(i, 'field', e.target.value)} className={inp} placeholder="Information Technology" /></div>
                          <div><label className={lbl}>Institution</label><input type="text" value={edu.institution || ''} onChange={e => setEdu(i, 'institution', e.target.value)} className={inp} placeholder="MIT" /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className={lbl}>Dates</label><input type="text" value={edu.dates || ''} onChange={e => setEdu(i, 'dates', e.target.value)} className={inp} placeholder="2016–2020" /></div>
                            <div><label className={lbl}>GPA / Grade</label><input type="text" value={edu.gpa || ''} onChange={e => setEdu(i, 'gpa', e.target.value)} className={inp} placeholder="3.9/4.0" /></div>
                          </div>
                          <div><label className={lbl}>Achievements / Notes</label><textarea value={edu.achievements || ''} onChange={e => setEdu(i, 'achievements', e.target.value)} rows={2} className={ta} placeholder="Dean's List, Valedictorian, thesis topic…" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(!selected.education || selected.education.length === 0) && (
                    <div className="py-16 text-center border border-dashed border-white/8 rounded-2xl text-gray-600 text-sm">No education entries yet.</div>
                  )}
                </div>
              )}

              {/* ── SKILLS ── */}
              {tab === 'skills' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{selected.skills?.length || 0} categor{selected.skills?.length === 1 ? 'y' : 'ies'}</p>
                    <button type="button" onClick={addSkillGroup} className="px-4 py-2 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-600/25 transition cursor-pointer">+ Add Category</button>
                  </div>
                  {selected.skills?.map((group, gIdx) => {
                    const col = CAT_COLORS[gIdx % CAT_COLORS.length];
                    return (
                      <div key={gIdx} className={`bg-[#12131f] border border-white/6 border-l-4 ${col.border} rounded-2xl p-5 space-y-4`}>
                        <div className="flex items-center gap-3">
                          <input type="text" value={group.category || ''} onChange={e => setSkillCat(gIdx, e.target.value)}
                            className={`flex-1 bg-transparent text-sm font-extrabold outline-none border-b border-white/10 focus:border-purple-500/50 py-1 placeholder-gray-700 ${col.header}`}
                            placeholder="Category name (e.g. Programming Languages)"
                          />
                          <button type="button" onClick={() => delSkillGroup(gIdx)} className="text-gray-600 hover:text-red-400 text-[10px] font-semibold cursor-pointer px-2 py-1 rounded hover:bg-red-500/10 transition">Remove</button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[36px]">
                          {group.items?.filter(s => s.trim()).map((item, iIdx) => (
                            <div key={iIdx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${col.pill}`}>
                              <span>{item}</span>
                              <button type="button" onClick={() => delSkillItem(gIdx, iIdx)} className="opacity-50 hover:opacity-100 hover:text-red-400 transition text-[10px] font-bold cursor-pointer">✕</button>
                            </div>
                          ))}
                          {(!group.items || group.items.filter(s => s.trim()).length === 0) && (
                            <p className="text-xs text-gray-700 italic">No skills yet — type below to add.</p>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-white/5">
                          <input type="text" placeholder="Type skill + press Enter or comma…"
                            className="flex-1 px-3 py-2 bg-[#0a0b14] border border-white/8 focus:border-purple-500/60 rounded-lg text-gray-200 text-xs outline-none transition placeholder-gray-700"
                            onKeyDown={e => {
                              if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
                                e.preventDefault();
                                const val = e.target.value.trim().replace(/,$/, '');
                                addSkillItem(gIdx);
                                setSelected(p => { const s=[...p.skills]; const items=[...(s[gIdx].items||[])]; items[items.length-1]=val; s[gIdx]={...s[gIdx],items}; return {...p,skills:s}; });
                                e.target.value = '';
                              }
                            }}
                          />
                          <button type="button"
                            onClick={e => {
                              const input = e.currentTarget.previousSibling;
                              const val = input.value.trim();
                              if (!val) return;
                              addSkillItem(gIdx);
                              setSelected(p => { const s=[...p.skills]; const items=[...(s[gIdx].items||[])]; items[items.length-1]=val; s[gIdx]={...s[gIdx],items}; return {...p,skills:s}; });
                              input.value = '';
                            }}
                            className={`px-4 py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${col.pill}`}
                          >Add</button>
                        </div>
                      </div>
                    );
                  })}
                  {(!selected.skills || selected.skills.length === 0) && (
                    <div className="py-16 text-center border border-dashed border-white/8 rounded-2xl text-gray-600 text-sm">No skill categories yet. Click <strong className="text-gray-400">+ Add Category</strong> to start.</div>
                  )}
                </div>
              )}

              {/* ── PROJECTS ── */}
              {tab === 'projects' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{selected.projects?.length || 0} project{selected.projects?.length === 1 ? '' : 's'}</p>
                    <button type="button" onClick={addProj} className="px-4 py-2 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-600/25 transition cursor-pointer">+ Add Project</button>
                  </div>
                  {selected.projects?.map((proj, pi) => (
                    <div key={pi} className="bg-[#12131f] border border-white/6 rounded-2xl overflow-hidden">
                      {/* project header bar */}
                      <div className="px-5 py-3 bg-gradient-to-r from-purple-900/20 to-cyan-900/10 border-b border-white/6 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs">🛠</div>
                          <span className="text-xs font-bold text-gray-300">{proj.name || 'New Project'}</span>
                          {proj.status && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              proj.status === 'Completed' ? 'bg-green-500/15 text-green-400 border-green-500/25' :
                              proj.status === 'In Progress' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
                              'bg-gray-500/15 text-gray-400 border-gray-500/25'
                            }`}>{proj.status}</span>
                          )}
                        </div>
                        <button type="button" onClick={() => delProj(pi)} className="text-gray-600 hover:text-red-400 text-[10px] cursor-pointer px-2 py-1 hover:bg-red-500/10 rounded transition">Remove</button>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* row 1: name + role */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><label className={lbl}>Project Name</label><input type="text" value={proj.name || ''} onChange={e => setProj(pi, 'name', e.target.value)} className={inp} placeholder="My Awesome Project" /></div>
                          <div><label className={lbl}>Your Role</label><input type="text" value={proj.role || ''} onChange={e => setProj(pi, 'role', e.target.value)} className={inp} placeholder="Lead Developer / Full Stack" /></div>
                        </div>

                        {/* row 2: dates + status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><label className={lbl}>Timeline / Dates</label><input type="text" value={proj.dates || ''} onChange={e => setProj(pi, 'dates', e.target.value)} className={inp} placeholder="Jan 2024 – Mar 2024" /></div>
                          <div>
                            <label className={lbl}>Status</label>
                            <select value={proj.status || ''} onChange={e => setProj(pi, 'status', e.target.value)}
                              className="w-full px-4 py-3 bg-[#0a0b14] border border-white/8 focus:border-purple-500/60 rounded-xl text-gray-200 text-sm outline-none transition">
                              <option value="">-- Select Status --</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Archived">Archived</option>
                            </select>
                          </div>
                        </div>

                        {/* row 3: live link + github */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><label className={lbl}>Live URL</label><input type="text" value={proj.link || ''} onChange={e => setProj(pi, 'link', e.target.value)} className={inp} placeholder="https://myproject.com" /></div>
                          <div><label className={lbl}>GitHub / Source</label><input type="text" value={proj.github || ''} onChange={e => setProj(pi, 'github', e.target.value)} className={inp} placeholder="https://github.com/user/repo" /></div>
                        </div>

                        {/* tech stack */}
                        <div><label className={lbl}>Tech Stack</label><input type="text" value={proj.tech || ''} onChange={e => setProj(pi, 'tech', e.target.value)} className={inp} placeholder="React, Node.js, PostgreSQL, Docker…" /></div>

                        {/* description */}
                        <div><label className={lbl}>Description</label><textarea value={proj.description || ''} onChange={e => setProj(pi, 'description', e.target.value)} rows={3} className={ta} placeholder="Brief overview of what this project does, the problem it solves…" /></div>

                        {/* highlights / bullets */}
                        <div className="space-y-2 pt-3 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Key Highlights</label>
                            <button type="button" onClick={() => addProjHL(pi)} className={addB}>+ Add Highlight</button>
                          </div>
                          {proj.highlights?.map((hl, hi) => (
                            <div key={hi} className="flex gap-2 items-start">
                              <span className="text-cyan-500 mt-3.5 text-xs shrink-0">▸</span>
                              <textarea value={hl} onChange={e => setProjHL(pi, hi, e.target.value)} rows={2} className={`${ta} flex-1`} placeholder="Implemented X feature that reduced load time by 40%…" />
                              <button type="button" onClick={() => delProjHL(pi, hi)} className={`${delB} mt-2`}>✕</button>
                            </div>
                          ))}
                          {(!proj.highlights || proj.highlights.length === 0) && (
                            <p className="text-xs text-gray-700 italic">Click + Add Highlight to add key achievements for this project.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selected.projects || selected.projects.length === 0) && (
                    <div className="py-16 text-center border border-dashed border-white/8 rounded-2xl text-gray-600 text-sm">No projects yet. Click <strong className="text-gray-400">+ Add Project</strong> to start.</div>
                  )}
                </div>
              )}

              {/* ── EXTRA ── */}
              {tab === 'extra' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-[#12131f] border border-white/6 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">🏅 Certifications</h3>
                      <button type="button" onClick={addCert} className={addB}>+ Add</button>
                    </div>
                    <div className="space-y-2.5">
                      {selected.certifications?.map((cert, i) => (
                        <div key={i} className="flex gap-2.5">
                          <input type="text" value={cert} onChange={e => setCert(i, e.target.value)} className={`${inp} flex-1`} placeholder="AWS Certified Developer – Associate (2024)" />
                          <button type="button" onClick={() => delCert(i)} className={delB}>✕</button>
                        </div>
                      ))}
                      {(!selected.certifications || selected.certifications.length === 0) && <p className="text-xs text-gray-600 italic">None added.</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#12131f] border border-white/6 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">🌐 Languages</h3>
                        <button type="button" onClick={() => addAddl('languages')} className={addB}>+ Add</button>
                      </div>
                      <div className="space-y-2.5">
                        {selected.additionalInfo?.languages?.map((lang, i) => (
                          <div key={i} className="flex gap-2.5">
                            <input type="text" value={lang} onChange={e => setAddl('languages', i, e.target.value)} className={`${inp} flex-1`} placeholder="English (Native)" />
                            <button type="button" onClick={() => delAddl('languages', i)} className={delB}>✕</button>
                          </div>
                        ))}
                        {(!selected.additionalInfo?.languages || selected.additionalInfo.languages.length === 0) && <p className="text-xs text-gray-600 italic">None added.</p>}
                      </div>
                    </div>

                    <div className="bg-[#12131f] border border-white/6 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">🎯 Interests</h3>
                        <button type="button" onClick={() => addAddl('hobbies')} className={addB}>+ Add</button>
                      </div>
                      <div className="space-y-2.5">
                        {selected.additionalInfo?.hobbies?.map((h, i) => (
                          <div key={i} className="flex gap-2.5">
                            <input type="text" value={h} onChange={e => setAddl('hobbies', i, e.target.value)} className={`${inp} flex-1`} placeholder="Photography" />
                            <button type="button" onClick={() => delAddl('hobbies', i)} className={delB}>✕</button>
                          </div>
                        ))}
                        {(!selected.additionalInfo?.hobbies || selected.additionalInfo.hobbies.length === 0) && <p className="text-xs text-gray-600 italic">None added.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>{/* end scrollable body */}

            {/* ── Bottom action bar ── */}
            <div className="shrink-0 px-6 py-3 border-t border-white/6 bg-[#0a0b14] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className={`px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  uploading ? 'bg-purple-900/30 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}>
                  {uploading ? <><div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" /> Parsing…</> : <><span>📂</span> Re-upload</>}
                  <input type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} disabled={uploading} className="hidden" />
                </label>
                <button type="button" onClick={() => setShowPrint(true)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5">
                  ⬇️ Download PDF
                </button>
              </div>
              <button type="submit" disabled={saving}
                className={`px-6 py-2 rounded-xl font-bold text-sm shadow-lg transition-all cursor-pointer flex items-center gap-2 ${
                  saving ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white'
                }`}>
                {saving ? <><div className="w-4 h-4 border-2 border-purple-700 border-t-white rounded-full animate-spin" /> Saving…</> : '💾 Save Changes'}
              </button>
            </div>

          </form>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center p-8">
            <div className="text-5xl">📄</div>
            <div>
              <h2 className="text-lg font-bold text-white">No resume selected</h2>
              <p className="text-sm text-gray-500 mt-1.5 max-w-xs mx-auto">
                {resumes.length > 0 ? 'Pick a resume from the left panel.' : 'Create your first resume version to get started.'}
              </p>
            </div>
            {resumes.length === 0 && (
              <button onClick={handleCreate} className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition cursor-pointer">
                + Create First Resume
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══════ PDF PRINT PREVIEW MODAL ══════ */}
      {showPrint && selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-[800px] bg-white rounded-2xl shadow-2xl text-gray-900 my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 print:hidden">
              <div>
                <h2 className="text-sm font-bold text-gray-800">{selected.name}</h2>
                <p className="text-xs text-gray-500">Review then click Print / Save PDF</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer">🖨️ Print / Save PDF</button>
                <button onClick={() => setShowPrint(false)} className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-bold transition cursor-pointer">Close</button>
              </div>
            </div>

            <div id="resume-print" className="p-10 space-y-5 text-sm leading-relaxed">
              {/* header */}
              <div className="text-center pb-4 border-b-2 border-gray-800">
                <h1 className="text-3xl font-black text-gray-900">{selected.personName || 'Your Name'}</h1>
                <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs text-gray-600">
                  {selected.email    && <span>✉ {selected.email}</span>}
                  {selected.phone    && <span>📞 {selected.phone}</span>}
                  {selected.location && <span>📍 {selected.location}</span>}
                  {selected.linkedin && <span>🔗 {selected.linkedin}</span>}
                  {selected.portfolio && <span>💻 {selected.portfolio}</span>}
                </div>
              </div>
              {selected.summary && (
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-700 border-b border-purple-200 pb-1 mb-2">Professional Summary</h2>
                  <p className="text-gray-700 text-xs leading-relaxed">{selected.summary}</p>
                </div>
              )}
              {selected.workHistory?.length > 0 && (
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-700 border-b border-purple-200 pb-1 mb-3">Experience</h2>
                  <div className="space-y-4">
                    {selected.workHistory.map((w, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start">
                          <div><p className="font-bold text-gray-900">{w.title}</p><p className="text-xs text-gray-600">{w.company}{w.location ? ` · ${w.location}` : ''}</p></div>
                          <p className="text-xs text-gray-500 shrink-0">{w.dates}</p>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {w.bullets?.filter(b => b.trim()).map((b, bi) => (
                            <li key={bi} className="flex gap-2 text-xs text-gray-700"><span className="text-purple-500 shrink-0 mt-0.5">▸</span><span>{b}</span></li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selected.education?.length > 0 && (
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-700 border-b border-purple-200 pb-1 mb-3">Education</h2>
                  {selected.education.map((e, i) => (
                    <div key={i} className="flex justify-between items-start mb-2">
                      <div><p className="font-bold text-gray-900">{e.degree}{e.field ? ` in ${e.field}` : ''}</p><p className="text-xs text-gray-600">{e.institution}{e.gpa ? ` · GPA: ${e.gpa}` : ''}</p>{e.achievements && <p className="text-xs text-gray-500 mt-0.5">{e.achievements}</p>}</div>
                      <p className="text-xs text-gray-500 shrink-0">{e.dates}</p>
                    </div>
                  ))}
                </div>
              )}
              {selected.skills?.length > 0 && (
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-700 border-b border-purple-200 pb-1 mb-3">Skills</h2>
                  <div className="space-y-1.5">
                    {selected.skills.map((g, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className="font-bold text-gray-800 shrink-0 w-36">{g.category}:</span>
                        <span className="text-gray-700">{g.items?.filter(s => s.trim()).join(' · ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selected.projects?.length > 0 && (
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-700 border-b border-purple-200 pb-1 mb-3">Projects</h2>
                  <div className="space-y-3">
                    {selected.projects.map((p, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-gray-900">{p.name}</span>
                            {p.role && <span className="text-xs text-gray-600"> · {p.role}</span>}
                            {p.tech && <p className="text-[10px] text-purple-700 font-medium mt-0.5">{p.tech}</p>}
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            {p.dates && <p>{p.dates}</p>}
                            {p.link && <a href={p.link} className="text-purple-600 text-[10px]">{p.link}</a>}
                          </div>
                        </div>
                        {p.description && <p className="text-xs text-gray-700 mt-1">{p.description}</p>}
                        {p.highlights?.filter(h => h.trim()).length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {p.highlights.filter(h => h.trim()).map((h, hi) => (
                              <li key={hi} className="flex gap-2 text-xs text-gray-700"><span className="text-cyan-500 shrink-0">▸</span><span>{h}</span></li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selected.certifications?.filter(c => c.trim()).length > 0 && (
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-700 border-b border-purple-200 pb-1 mb-2">Certifications</h2>
                  <ul className="space-y-1">
                    {selected.certifications.filter(c => c.trim()).map((c, i) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-2"><span className="text-purple-500">▸</span>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.additionalInfo?.languages?.filter(l => l.trim()).length > 0 && (
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-700 border-b border-purple-200 pb-1 mb-2">Languages</h2>
                  <p className="text-xs text-gray-700">{selected.additionalInfo.languages.filter(l => l.trim()).join(' · ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
