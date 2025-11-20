// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Home, Calendar, MessageSquare, User, Shield, Heart, X, RefreshCw, Lock, LogOut, 
  Clock, Plus, Users, Edit3, Trash2, Briefcase, Wrench, Receipt, CheckCircle, Leaf, Phone, 
  PhoneCall, Moon, Sun, CalendarDays, ArrowRight, UserPlus, UserX, Key, Eye, ChevronRight, MapPin, Smile, Send
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut, updateProfile
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, doc, updateDoc, 
  deleteDoc, where, writeBatch, getDocs, arrayUnion
} from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyANLKKf0OeSTs7_ok6fzIjtxVLWT_mdTnQ",
  authDomain: "parkside-d5885.firebaseapp.com",
  projectId: "parkside-d5885",
  storageBucket: "parkside-d5885.firebasestorage.app",
  messagingSenderId: "314330427304",
  appId: "1:314330427304:web:74ec323a2b6434040b779d",
  measurementId: "G-FRRM3JDB9M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = firebaseConfig.projectId;

// --- UTILS ---
const getTodayString = () => new Date().toISOString().split('T')[0];
const addDays = (d, n) => { const date = new Date(d); date.setDate(date.getDate() + n); return date.toISOString().split('T')[0]; };
// SAFETY CHECK: Helper to get a safe name even if profile hasn't loaded
const getSafeName = (user) => user?.displayName || "Staff Member";

// --- STYLES ---
const styles = {
  app: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#F5F5F4', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(245, 245, 244, 0.95)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(0,0,0,0.05)' },
  main: { flex: 1, overflowY: 'auto', padding: '0 24px 120px 24px' },
  
  // Cards
  card: { backgroundColor: 'white', borderRadius: '24px', padding: '24px', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' },
  heroCard: { background: 'linear-gradient(145deg, #15803d 0%, #166534 100%)', borderRadius: '32px', padding: '32px', color: 'white', marginBottom: '24px', boxShadow: '0 20px 40px -12px rgba(22, 101, 52, 0.3)', position: 'relative', overflow: 'hidden' },

  // Inputs & Buttons
  input: { width: '100%', padding: '18px', borderRadius: '18px', backgroundColor: '#f5f5f4', border: '2px solid transparent', fontSize: '16px', fontWeight: '600', outline: 'none', marginBottom: '12px', transition: '0.2s' },
  select: { width: '100%', padding: '18px', borderRadius: '18px', backgroundColor: 'white', border: '1px solid #e5e5e5', fontSize: '16px', marginBottom: '12px', outline: 'none' },
  btn: { width: '100%', padding: '18px', borderRadius: '18px', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s', activeScale: 0.95 },
  btnPrimary: { backgroundColor: '#1c1917', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' },
  btnSecondary: { backgroundColor: 'white', border: '1px solid #e5e5e5', color: '#1c1917' },
  fab: { position: 'fixed', bottom: '100px', right: '24px', width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#16a34a', color: 'white', border: 'none', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, cursor: 'pointer', transition: 'transform 0.2s' },

  // Nav
  dockContainer: { position: 'absolute', bottom: '32px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 100, pointerEvents: 'none' },
  dock: { backgroundColor: '#1c1917', padding: '6px', borderRadius: '28px', display: 'flex', gap: '6px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', pointerEvents: 'auto', border: '1px solid rgba(255,255,255,0.1)' },
  dockBtn: { width: '56px', height: '56px', borderRadius: '22px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', color: '#78716c', transition: 'all 0.2s ease' },
  dockBtnActive: { backgroundColor: '#65A30D', color: 'white', transform: 'translateY(-6px)', boxShadow: '0 8px 16px -4px rgba(101, 163, 13, 0.4)' },
  
  // Tab Styling
  tabContainer: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' },
  tabBtn: { padding: '12px 20px', borderRadius: '30px', fontSize: '14px', fontWeight: '700', border: 'none', whiteSpace: 'nowrap', transition: '0.2s' },
  tabActive: { backgroundColor: '#1c1917', color: 'white', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' },
  tabInactive: { backgroundColor: 'white', color: '#78716c', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },

  // Login
  loginPage: { position: 'fixed', inset: 0, zIndex: 999, background: '#f5f5f4', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' },
  loginInput: { width: '100%', padding: '20px', borderRadius: '20px', backgroundColor: 'white', border: '1px solid #e5e5e5', color: '#1c1917', fontSize: '16px', fontWeight: '600', outline: 'none', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  
  // Typography
  h1: { fontSize: '36px', fontWeight: '800', color: '#1c1917', letterSpacing: '-1px' },
  h2: { fontSize: '24px', fontWeight: '800', marginBottom: '24px' },
  label: { fontSize: '11px', fontWeight: '800', color: '#a8a29e', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }
};

// --- COMPONENTS ---

const ParksideLogo = () => (
  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
    <div style={{width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #65a30d 0%, #4d7c0f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -6px rgba(101, 163, 13, 0.4)'}}>
      <Leaf color="white" size={24} strokeWidth={2.5} />
    </div>
    <div>
      <div style={{fontSize: '22px', fontWeight: '800', color: '#1c1917', lineHeight: 1, letterSpacing: '-0.5px'}}>Parkside</div>
      <div style={{fontSize: '11px', fontWeight: '700', color: '#65a30d', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '2px'}}>Residential</div>
    </div>
  </div>
);

// BOTTOM NAV
const BottomNav = ({ active, onChange }) => (
  <div style={styles.dockContainer}>
     <div style={styles.dock}>
        {[
          {id:'dashboard', icon:Home},
          {id:'calendar', icon:Calendar},
          {id:'house', icon:Wrench},
          {id:'feed', icon:MessageSquare}
        ].map(item => (
          <button key={item.id} onClick={()=>onChange(item.id)} style={active===item.id ? styles.dockBtnActive : styles.dockBtn} className="dock-btn">
             <item.icon size={24} strokeWidth={active===item.id ? 2.5 : 2} />
          </button>
        ))}
     </div>
  </div>
);


// 1. LOGIN SCREEN
const LoginScreen = ({ onLogin, firebaseUser }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'parkside_users');
      const snapshot = await getDocs(usersRef);
      let user = snapshot.docs.find(d => d.data().name.toLowerCase() === name.trim().toLowerCase());

      if (name.toLowerCase() === 'nathan' && password === 'reset-admin') { setIsReset(true); setLoading(false); return; }
      if (isReset && user) { await updateDoc(user.ref, { password }); onLogin(user.data().role); return; }

      let role = 'staff';
      let create = false;
      if (snapshot.empty && name.toLowerCase() === 'nathan') { role = 'manager'; create = true; }
      else if (user && user.data().password === password) { role = user.data().role; }
      else throw new Error();

      if (firebaseUser) {
         await updateProfile(firebaseUser, { displayName: name });
         if (create) await addDoc(usersRef, { name: 'Nathan', role: 'manager', password, createdAt: serverTimestamp() });
         onLogin(role);
      }
    } catch (err) { alert("Invalid Login"); setLoading(false); }
  };

  return (
    <div style={styles.loginPage}>
      <div style={{marginBottom: '48px', textAlign: 'center'}}>
        <div style={{width: '88px', height: '88px', backgroundColor: '#65A30D', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 20px 40px -10px rgba(101,163,13,0.3)'}}>
           <Leaf color="white" size={44} strokeWidth={2} />
        </div>
        <h1 style={{fontSize: '42px', fontWeight: '900', color: '#1c1917', letterSpacing: '-1.5px', lineHeight: 1}}>Welcome<br/>Back.</h1>
        <p style={{color: '#78716c', marginTop: '12px', fontSize: '17px', fontWeight: '500'}}>Sign in to Parkside Staff Portal</p>
      </div>
      <form onSubmit={handleLogin}>
         <div style={{marginBottom:'12px'}}>
            <label style={styles.label}>Username</label>
            <input style={styles.loginInput} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Nathan" />
         </div>
         <div style={{marginBottom:'32px'}}>
            <label style={styles.label}>{isReset ? 'New Password' : 'Password'}</label>
            <input style={styles.loginInput} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••" />
         </div>
         <button style={{...styles.btn, ...styles.btnPrimary}} disabled={loading}>
            {loading ? 'Verifying...' : isReset ? 'Update Password' : 'Sign In'} <ArrowRight size={20} />
         </button>
      </form>
    </div>
  );
};

// 2. DASHBOARD
const Dashboard = ({ user, onNavigate }) => {
  const [oc, setOc] = useState(null);
  const [next, setNext] = useState(null);
  const userName = getSafeName(user); // Use safe name

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_oncall'), where('date','==',getTodayString())), s=>setOc(s.empty?null:s.docs[0].data()));
    const u2 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_rota_v3'), where('date','>=',getTodayString()), orderBy('date')), s=>{
        // Safe check for name existence
        const n = s.docs.map(d=>d.data()).find(sh => sh.staff && sh.staff.some(st => st.name && st.name.toLowerCase() === userName.toLowerCase()));
        setNext(n);
    });
    return () => { u1(); u2(); };
  }, [user, userName]);

  return (
    <div style={styles.main}>
       <div style={{ marginBottom: '32px', marginTop: '12px' }}>
          <p style={{color: '#a8a29e', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px'}}>Good Afternoon,</p>
          <h1 style={styles.h1}>{userName.split(' ')[0]}</h1>
       </div>

       {/* HERO CARD */}
       <div style={styles.heroCard}>
          <div style={{position: 'absolute', top: '-20px', right: '-20px', width: '180px', height: '180px', background: 'white', opacity: 0.08, borderRadius: '50%', filter: 'blur(40px)'}}></div>
          
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px'}}>
             <div style={{width: '8px', height: '8px', backgroundColor: '#4ade80', borderRadius: '50%', boxShadow: '0 0 12px #4ade80'}}></div>
             <span style={{fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8}}>On Call Manager</span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
             <div>
                <div style={{fontSize: '32px', fontWeight: '800', marginBottom: '4px', lineHeight: 1}}>{oc ? oc.name : 'No Data'}</div>
                <div style={{fontSize: '14px', opacity: 0.6, fontWeight: '500'}}>Until 09:00 Tomorrow</div>
             </div>
             {oc && <a href={`tel:${oc.number}`} style={{width: '56px', height: '56px', backgroundColor: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', boxShadow: '0 10px 25px rgba(0,0,0,0.15)'}}><PhoneCall size={24}/></a>}
          </div>
       </div>

       {/* GRID */}
       <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
          <div style={{...styles.card, gridColumn: 'span 2', backgroundColor: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
             <div>
                <div style={{fontSize: '11px', fontWeight: '800', color: '#a8a29e', textTransform: 'uppercase', marginBottom: '8px', display:'flex', alignItems:'center', gap:'6px'}}><CalendarDays size={14}/> Next Shift</div>
                {next ? (
                   <div>
                      <div style={{fontSize: '24px', fontWeight: '800', color: '#1c1917'}}>{new Date(next.date).toLocaleDateString('en-GB', {weekday:'short', day:'numeric'})}</div>
                      <div style={{fontSize: '14px', color: '#15803d', fontWeight: '700', marginTop: '4px'}}>08:00 Start • 48hr Block</div>
                   </div>
                ) : <div style={{fontSize: '18px', fontWeight: '700', color: '#d6d3d1'}}>No upcoming shifts</div>}
             </div>
             <div style={{width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78716c'}}>
                <ArrowRight size={20}/>
             </div>
          </div>

          <div onClick={()=>onNavigate('calendar')} style={{...styles.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '32px'}}>
             <div style={{color: '#f97316', padding: '12px', backgroundColor: '#fff7ed', borderRadius: '16px'}}><Calendar size={28}/></div>
             <span style={{fontWeight: '700', color: '#44403c', fontSize: '15px'}}>Rota</span>
          </div>
          <div onClick={()=>onNavigate('house')} style={{...styles.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '32px'}}>
             <div style={{color: '#3b82f6', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '16px'}}><Wrench size={28}/></div>
             <span style={{fontWeight: '700', color: '#44403c', fontSize: '15px'}}>House</span>
          </div>
       </div>
    </div>
  );
};

// 3. ROTA & CALENDAR
const CalendarManager = ({ user, userRole }) => {
  const [tab, setTab] = useState('myrota');
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [appts, setAppts] = useState([]);
  
  const [showAdd, setShowAdd] = useState(false);
  const [showApt, setShowApt] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const [mode, setMode] = useState('block');
  const [date, setDate] = useState('');
  const [s1,setS1]=useState(''); const [s2,setS2]=useState(''); const [s3,setS3]=useState(''); const [d1,setD1]=useState('');
  const [adName, setAdName]=useState(''); const [adStart, setAdStart]=useState(''); const [adEnd, setAdEnd]=useState('');
  
  const [aptChild, setAptChild] = useState(''); const [aptType, setAptType] = useState(''); const [aptDate, setAptDate] = useState(''); const [aptTime, setAptTime] = useState(''); const [aptEscort, setAptEscort] = useState('');
  
  const userName = getSafeName(user);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_rota_v3'), orderBy('date')), s => setShifts(s.docs.map(d=>({id:d.id, ...d.data()}))));
    const u2 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_users'), orderBy('name')), s => setStaff(s.docs.map(d=>d.data())));
    const u3 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_appointments'), orderBy('dateTime')), s => setAppts(s.docs.map(d=>({id:d.id, ...d.data()}))));
    return () => { u1(); u2(); u3(); };
  }, []);

  const saveBlock = async () => {
    const b = writeBatch(db);
    const id1 = doc(collection(db,'artifacts',appId,'public','data','parkside_rota_v3')).id;
    const t1 = [{name:s1,type:'sleep',day:1},{name:s2,type:'sleep',day:1},{name:s3,type:'sleep',day:1},{name:d1,type:'day',day:1}].filter(x=>x.name);
    const t2 = [{name:s1,type:'sleep',day:2},{name:s2,type:'sleep',day:2},{name:s3,type:'sleep',day:2},{name:d1,type:'day',day:2}].filter(x=>x.name);
    b.set(doc(db,'artifacts',appId,'public','data','parkside_rota_v3',id1), {date, displayDate:new Date(date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}), staff:t1, type:'block', dayNumber:1, blockId:id1});
    const d2 = addDays(date,1);
    b.set(doc(collection(db,'artifacts',appId,'public','data','parkside_rota_v3')), {date:d2, displayDate:new Date(d2).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}), staff:t2, type:'block', dayNumber:2, blockId:id1});
    await b.commit(); setShowAdd(false);
  };

  const saveAdhoc = async () => {
     await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_rota_v3'), {
       date, displayDate: new Date(date).toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short'}),
       staff: [{name: adName, type:'adhoc', start: adStart, end: adEnd}], type: 'adhoc'
     });
     setShowAdd(false);
  };

  const saveApt = async () => {
     await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_appointments'), {
       childName: aptChild, type: aptType, displayDate: aptDate, displayTime: aptTime, staff: aptEscort, dateTime: new Date(`${aptDate}T${aptTime}`).toISOString()
     });
     setShowApt(false);
  };

  const myShifts = shifts.filter(s => s.staff && s.staff.some(st => st.name && st.name.toLowerCase() === userName.toLowerCase()));

  return (
    <div style={styles.main}>
       <div style={styles.tabContainer}>
          {['myrota','fullrota','diary'].map(t => (
             <button key={t} onClick={()=>setTab(t)} style={tab===t ? {...styles.tabBtn, ...styles.tabActive} : styles.tabBtn}>{t==='myrota'?'My Shifts':t==='fullrota'?'Full Rota':'Diary'}</button>
          ))}
       </div>

       {tab === 'myrota' && (
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
             {myShifts.length === 0 && <div style={{textAlign:'center', padding:'40px', color:'#999'}}>No shifts assigned to you.</div>}
             {myShifts.map(s => {
                const me = s.staff.find(x=>x.name.toLowerCase()===userName.toLowerCase());
                return (
                   <div key={s.id} onClick={()=>s.blockId && setSelectedBlock(s.blockId)} style={{...styles.card, borderLeft:'4px solid #65a30d', cursor:'pointer'}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
                         <div>
                            <div style={{fontSize:'22px', fontWeight:'800', color:'#1c1917'}}>{s.displayDate}</div>
                            <div style={{fontSize:'12px', fontWeight:'700', color:'#a8a29e', textTransform:'uppercase', marginTop:'2px'}}>{s.type==='adhoc' ? 'Extra Shift' : (me.day===1 ? 'Day 1 (Start)' : 'Day 2 (Finish)')}</div>
                         </div>
                         <div style={{backgroundColor:me.type==='sleep'?'#f3e8ff':me.type==='adhoc'?'#dbeafe':'#ffedd5', color:me.type==='sleep'?'#7e22ce':me.type==='adhoc'?'#1d4ed8':'#c2410c', padding:'6px 12px', borderRadius:'10px', fontSize:'11px', fontWeight:'800', height:'fit-content'}}>{me.type==='sleep'?'SLEEP':'LATE'}</div>
                      </div>
                      <div style={{backgroundColor:'#f5f5f4', padding:'16px', borderRadius:'16px', fontSize:'14px', fontWeight:'600', color:'#57534e', display:'flex', alignItems:'center', gap:'10px'}}>
                         <Clock size={18} className="text-[#65A30D]"/>
                         {me.type==='adhoc' ? `${me.start} - ${me.end}` : (me.type==='sleep' ? (me.day===1?'Start 08:00 → Sleep':'Sleep → Finish 08:30') : 'Start 08:00 → Finish 22:30')}
                      </div>
                      {s.blockId && <div style={{position:'absolute', bottom:'24px', right:'24px', opacity:0.3}}><Eye size={20}/></div>}
                   </div>
                )
             })}
          </div>
       )}

       {tab === 'fullrota' && (
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
             {shifts.map(s => (
                <div key={s.id} style={styles.card}>
                   <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #f5f5f4', paddingBottom:'16px', marginBottom:'16px'}}>
                      <span style={{fontWeight:'800', fontSize:'18px'}}>{s.displayDate}</span>
                      {userRole==='manager' && <button onClick={()=>deleteDoc(doc(db,'artifacts',appId,'public','data','parkside_rota_v3',s.id))} style={{border:'none', background:'transparent', color:'#ef4444'}}><Trash2 size={18}/></button>}
                   </div>
                   <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                      {s.staff.map((st,i) => (
                         <div key={i} style={{fontSize:'13px', fontWeight:'600', backgroundColor:st.type==='sleep'?'#f3e8ff':st.type==='day'?'#ffedd5':'#dbeafe', color:st.type==='sleep'?'#6b21a8':st.type==='day'?'#9a3412':'#1e40af', padding:'10px', borderRadius:'12px', display:'flex', alignItems:'center', gap:'8px'}}>
                            {st.type==='sleep' ? <Moon size={14}/> : <Sun size={14}/>} {st.name}
                         </div>
                      ))}
                   </div>
                </div>
             ))}
             {userRole==='manager' && <button onClick={()=>setShowAdd(true)} style={styles.fab}><Plus size={32}/></button>}
          </div>
       )}

       {tab === 'diary' && (
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
             {appts.map(a => (
                <div key={a.id} style={{...styles.card, display:'flex', gap:'16px', alignItems:'center', borderLeft:'4px solid #d97706'}}>
                   <div style={{backgroundColor:'#fef3c7', color:'#d97706', width:'56px', height:'56px', borderRadius:'16px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontWeight:'700', flexShrink:0}}>
                      <span style={{fontSize:'11px', textTransform:'uppercase'}}>{new Date(a.displayDate).toLocaleString('default',{month:'short'})}</span>
                      <span style={{fontSize:'20px', lineHeight:'1'}}>{new Date(a.displayDate).getDate()}</span>
                   </div>
                   <div>
                      <div style={{fontSize:'18px', fontWeight:'800', color:'#1c1917'}}>{a.childName}</div>
                      <div style={{fontSize:'13px', color:'#78716c', marginTop:'2px'}}>{a.displayTime} • {a.type}</div>
                      {a.staff && <div style={{fontSize:'12px', color:'#a8a29e', marginTop:'2px'}}>Escort: {a.staff}</div>}
                   </div>
                </div>
             ))}
             <button onClick={()=>setShowApt(true)} style={styles.fab}><Plus size={32}/></button>
          </div>
       )}

       {/* MODALS */}
       {showAdd && (
         <div style={{position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'flex-end'}}>
            <div style={{backgroundColor:'white', width:'100%', borderRadius:'32px 32px 0 0', padding:'32px', maxHeight:'85vh', overflowY:'auto'}}>
               <div style={{display:'flex', justifyContent:'space-between', marginBottom:'24px'}}>
                  <h3 style={styles.h2}>Add Shift</h3>
                  <button onClick={()=>setShowAdd(false)} style={{border:'none', background:'transparent'}}><X/></button>
               </div>
               <div style={{display:'flex', gap:'10px', marginBottom:'24px'}}>
                  <button onClick={()=>setMode('block')} style={{...styles.btn, ...(mode==='block'?styles.btnPrimary:styles.btnSecondary)}}>48hr Block</button>
                  <button onClick={()=>setMode('adhoc')} style={{...styles.btn, ...(mode==='adhoc'?styles.btnPrimary:styles.btnSecondary)}}>Hourly</button>
               </div>
               <label style={styles.label}>Date</label>
               <input type="date" style={styles.input} value={date} onChange={e=>setDate(e.target.value)}/>
               {mode === 'block' ? (
                 <>
                    <label style={styles.label}>Sleep-in Team (x3)</label>
                    {[setS1,setS2,setS3].map((fn,i)=><select key={i} style={styles.select} onChange={e=>fn(e.target.value)}><option>Select Staff</option>{staff.map(u=><option>{u.name}</option>)}</select>)}
                    <label style={styles.label}>Late Finish (x1)</label>
                    <select style={styles.select} onChange={e=>setD1(e.target.value)}><option>Select Staff</option>{staff.map(u=><option>{u.name}</option>)}</select>
                    <button onClick={saveBlock} style={{...styles.btn, ...styles.btnPrimary, marginTop:'16px'}}>Save Block</button>
                 </>
               ) : (
                 <>
                    <label style={styles.label}>Staff Member</label>
                    <select style={styles.select} onChange={e=>setAdName(e.target.value)}><option>Select Staff</option>{staff.map(u=><option>{u.name}</option>)}</select>
                    <div style={{display:'flex', gap:'10px'}}>
                       <div style={{flex:1}}><label style={styles.label}>Start</label><input type="time" style={styles.input} value={adStart} onChange={e=>setAdStart(e.target.value)}/></div>
                       <div style={{flex:1}}><label style={styles.label}>End</label><input type="time" style={styles.input} value={adEnd} onChange={e=>setAdEnd(e.target.value)}/></div>
                    </div>
                    <button onClick={saveAdhoc} style={{...styles.btn, ...styles.btnPrimary, marginTop:'16px'}}>Save Shift</button>
                 </>
               )}
            </div>
         </div>
       )}
       {showApt && (
         <div style={{position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'flex-end'}}>
            <div style={{backgroundColor:'white', width:'100%', borderRadius:'32px 32px 0 0', padding:'32px'}}>
               <h3 style={styles.h2}>New Appointment</h3>
               <input style={styles.input} placeholder="Child (Initials)" value={aptChild} onChange={e=>setAptChild(e.target.value)}/>
               <input style={styles.input} placeholder="Type (e.g. Dentist)" value={aptType} onChange={e=>setAptType(e.target.value)}/>
               <div style={{display:'flex', gap:'10px'}}>
                  <input type="date" style={styles.input} value={aptDate} onChange={e=>setAptDate(e.target.value)}/>
                  <input type="time" style={styles.input} value={aptTime} onChange={e=>setAptTime(e.target.value)}/>
               </div>
               <input style={styles.input} placeholder="Escort Staff" value={aptEscort} onChange={e=>setAptEscort(e.target.value)}/>
               <button onClick={saveApt} style={{...styles.btn, ...styles.btnPrimary, marginTop:'16px'}}>Save</button>
            </div>
         </div>
       )}
       {selectedBlock && (
        <div style={{position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
           <div style={{backgroundColor:'white', width:'100%', maxWidth:'350px', borderRadius:'32px', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
              <div style={{backgroundColor:'#1c1917', padding:'24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                 <h3 style={{fontSize:'20px', fontWeight:'800', color:'white'}}>48hr Overview</h3>
                 <button onClick={()=>setSelectedBlock(null)} style={{border:'none', background:'transparent', color:'white'}}><X/></button>
              </div>
              <div style={{padding:'24px', backgroundColor:'#f5f5f4', display:'flex', flexDirection:'column', gap:'12px'}}>
                 {shifts.filter(s=>s.blockId===selectedBlock).sort((a,b)=>a.dayNumber-b.dayNumber).map(day => (
                    <div key={day.id} style={{backgroundColor:'white', padding:'20px', borderRadius:'20px', boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>
                       <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                          <span style={{fontWeight:'800', fontSize:'18px', color:'#1c1917'}}>{day.displayDate}</span>
                          <span style={{fontSize:'11px', fontWeight:'800', textTransform:'uppercase', color:'#65a30d', backgroundColor:'#ecfccb', padding:'4px 8px', borderRadius:'8px'}}>Day {day.dayNumber}</span>
                       </div>
                       <div style={{fontSize:'14px', color:'#57534e', display:'flex', alignItems:'center', gap:'8px'}}><Clock size={16}/>{day.dayNumber===1 ? '08:00 Start' : 'Finish 08:30 Next Day'}</div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
       )}
    </div>
  );
};

// 4. HOUSE
const HouseManager = ({ user, userRole }) => {
  const [tab, setTab] = useState('oncall');
  const [data, setData] = useState({ users:[], oncall:[], repairs:[], receipts:[] });
  const [modals, setModals] = useState({});
  const [form, setForm] = useState({});

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db,'artifacts',appId,'public','data','parkside_users'),orderBy('name')), s=>setData(p=>({...p,users:s.docs.map(d=>({id:d.id,...d.data()}))}))),
      onSnapshot(query(collection(db,'artifacts',appId,'public','data','parkside_oncall'),orderBy('date')), s=>setData(p=>({...p,oncall:s.docs.map(d=>({id:d.id,...d.data()}))}))),
      onSnapshot(query(collection(db,'artifacts',appId,'public','data','parkside_repairs'),orderBy('timestamp','desc')), s=>setData(p=>({...p,repairs:s.docs.map(d=>({id:d.id,...d.data()}))}))),
      onSnapshot(query(collection(db,'artifacts',appId,'public','data','parkside_receipts'),orderBy('timestamp','desc')), s=>setData(p=>({...p,receipts:s.docs.map(d=>({id:d.id,...d.data()}))})))
    ];
    return () => unsubs.forEach(u=>u());
  }, []);

  const handleSubmit = async (type) => {
    const col = type === 'oncall' ? 'parkside_oncall' : `parkside_${type}s`;
    const payload = { timestamp: serverTimestamp(), ...form };
    if(type==='repair') { payload.status='open'; payload.reportedBy=user.displayName; }
    if(type==='receipt') { payload.staff=user.displayName; }
    await addDoc(collection(db,'artifacts',appId,'public','data',col), payload);
    setModals(p=>({...p, [type]:false})); setForm({});
  };

  return (
    <div style={styles.section}>
       <div style={{display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'16px'}}>
          {['oncall','repair','receipt',...(userRole==='manager'?['user']:[])].map(k => (
             <button key={k} onClick={()=>setTab(k)} style={{padding:'12px 20px', borderRadius:'30px', fontSize:'14px', fontWeight:'700', border:'none', whiteSpace:'nowrap', backgroundColor:tab===k?'#1c1917':'white', color:tab===k?'white':'#78716c', boxShadow:tab===k?'0 8px 20px rgba(0,0,0,0.15)':'0 2px 8px rgba(0,0,0,0.05)'}}>
                {k==='oncall'?'On Call':k==='repair'?'Repairs':k==='receipt'?'Cash':k==='user'?'Team':''}
             </button>
          ))}
       </div>

       {tab === 'oncall' && (
          <div>
             {userRole==='manager' && <button onClick={()=>setModals(p=>({...p,oncall:true}))} style={styles.fab}><Edit3 size={28}/></button>}
             {data.oncall.map(oc => (
                <div key={oc.id} style={{...styles.card, display:'flex', justifyContent:'space-between', alignItems:'center', borderLeft: oc.date===getTodayString() ? '4px solid #16a34a' : '1px solid #e5e5ea'}}>
                   <div>
                      {oc.date===getTodayString() && <span style={{fontSize:'10px', fontWeight:'800', color:'#16a34a', textTransform:'uppercase', display:'block', marginBottom:'4px'}}>ACTIVE NOW</span>}
                      <div style={{fontSize:'12px', fontWeight:'700', color:'#999', textTransform:'uppercase'}}>{new Date(oc.date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</div>
                      <div style={{fontSize:'18px', fontWeight:'800', marginTop:'2px', color:'#1c1917'}}>{oc.name}</div>
                      <div style={{fontSize:'14px', fontWeight:'600', color:'#15803d', marginTop:'4px', display:'flex', alignItems:'center', gap:'4px'}}><Phone size={12}/> {oc.number}</div>
                   </div>
                   {userRole==='manager' && <button onClick={()=>deleteDoc(doc(db,'artifacts',appId,'public','data','parkside_oncall',oc.id))} style={{color:'#e5e5e5', background:'transparent', border:'none'}}><Trash2 size={18}/></button>}
                </div>
             ))}
          </div>
       )}

       {tab === 'repair' && (
          <div>
             <button onClick={()=>setModals(p=>({...p,repair:true}))} style={styles.fab}><Plus size={32}/></button>
             {data.repairs.map(r => (
                <div key={r.id} style={{...styles.card, opacity:r.status==='fixed'?0.6:1, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                   <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
                      <div style={{width:'44px', height:'44px', borderRadius:'14px', backgroundColor:r.status==='fixed'?'#dcfce7':'#ffedd5', color:r.status==='fixed'?'#15803d':'#c2410c', display:'flex', alignItems:'center', justifyContent:'center'}}>
                         {r.status==='fixed' ? <CheckCircle size={20}/> : <Wrench size={20}/>}
                      </div>
                      <div><div style={{fontWeight:'700', fontSize:'16px', color:'#1c1917'}}>{r.item}</div><div style={{fontSize:'13px', color:'#a8a29e'}}>{r.location}</div></div>
                   </div>
                   <button onClick={()=>updateDoc(doc(db,'artifacts',appId,'public','data','parkside_repairs',r.id),{status:r.status==='open'?'fixed':'open'})} style={{fontSize:'12px', fontWeight:'700', padding:'8px 16px', backgroundColor:'#f4f4f5', borderRadius:'10px', border:'none', color:'#57534e'}}>
                      {r.status==='open' ? 'Done' : 'Undo'}
                   </button>
                </div>
             ))}
          </div>
       )}
       
       {tab === 'user' && (
          <div>
             <button onClick={()=>setModals(p=>({...p,user:true}))} style={styles.fab}><Plus size={32}/></button>
             {data.users.map(u => (
                <div key={u.id} style={{...styles.card, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                   <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                      <div style={{width:'44px', height:'44px', borderRadius:'22px', backgroundColor:'#f4f4f5', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', color:'#71717a'}}>{u.name[0]}</div>
                      <div><div style={{fontWeight:'700', color:'#1c1917', fontSize:'16px'}}>{u.name}</div><div style={{fontSize:'12px', color:'#a1a1aa', textTransform:'uppercase', fontWeight:'600'}}>{u.role}</div></div>
                   </div>
                   <button onClick={()=>deleteDoc(doc(db,'artifacts',appId,'public','data','parkside_users',u.id))} style={{color:'#ef4444', background:'transparent', border:'none'}}><Trash2 size={18}/></button>
                </div>
             ))}
          </div>
       )}
       
       {tab === 'receipt' && (
          <div>
             <button onClick={()=>setModals(p=>({...p,receipt:true}))} style={styles.fab}><Plus size={32}/></button>
             {data.receipts.map(r => (
                <div key={r.id} style={{...styles.card, display:'flex', gap:'16px', alignItems:'center'}}>
                   <div style={{width:'56px', height:'56px', borderRadius:'16px', backgroundColor:'#dcfce7', color:'#15803d', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', fontSize:'18px'}}>£{r.amount}</div>
                   <div><div style={{fontWeight:'700', fontSize:'16px', color:'#1c1917'}}>{r.store}</div><div style={{fontSize:'13px', color:'#a8a29e'}}>{r.category} • {r.staff}</div></div>
                </div>
             ))}
          </div>
       )}

       {/* MODALS */}
       {Object.keys(modals).map(k => modals[k] && (
          <div key={k} style={{position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'flex-end'}}>
             <div style={{backgroundColor:'white', width:'100%', borderRadius:'32px 32px 0 0', padding:'32px'}}>
                <h3 style={styles.h2}>{k==='user'?'Add Staff':k==='oncall'?'Add On Call':k==='repair'?'Report Issue':'Add Receipt'}</h3>
                
                {k==='user' && <><input style={styles.input} placeholder="Name" onChange={e=>setForm({...form,name:e.target.value})}/><input style={styles.input} placeholder="Password" onChange={e=>setForm({...form,password:e.target.value})}/><select style={styles.select} onChange={e=>setForm({...form,role:e.target.value})}><option value="staff">Staff</option><option value="manager">Manager</option></select></>}
                
                {k==='oncall' && <><input style={styles.input} type="date" onChange={e=>setForm({...form,date:e.target.value})}/><input style={styles.input} placeholder="Name" onChange={e=>setForm({...form,name:e.target.value})}/><input style={styles.input} placeholder="Phone" onChange={e=>setForm({...form,number:e.target.value})}/></>}
                
                {k==='repair' && <><input style={styles.input} placeholder="What's broken?" onChange={e=>setForm({...form,item:e.target.value})}/><input style={styles.input} placeholder="Location" onChange={e=>setForm({...form,location:e.target.value})}/></>}
                
                {k==='receipt' && <><input style={styles.input} type="number" placeholder="Amount £" onChange={e=>setForm({...form,amount:e.target.value})}/><input style={styles.input} placeholder="Store" onChange={e=>setForm({...form,store:e.target.value})}/><select style={styles.select} onChange={e=>setForm({...form,category:e.target.value})}><option>Food</option><option>Activities</option><option>Transport</option><option>Misc</option></select></>}

                <button onClick={()=>handleSubmit(k)} style={{...styles.btn, ...styles.btnPrimary, marginTop:'16px'}}>Save</button>
                <button onClick={()=>setModals(p=>({...p,[k]:false}))} style={{...styles.btn, marginTop:'10px', color:'#a8a29e', backgroundColor:'transparent'}}>Cancel</button>
             </div>
          </div>
       ))}
    </div>
  );
};

// 5. FEED (Interactive)
const FeedView = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [cam, setCam] = useState(false);
  const [img, setImg] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const userName = getSafeName(user);

  useEffect(() => onSnapshot(query(collection(db,'artifacts',appId,'public','data','parkside_posts'),orderBy('timestamp','desc')), s=>setPosts(s.docs.map(d=>({id:d.id,...d.data()})))), []);

  const startCam = async () => {
    setCam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch(e) { alert("Camera error"); setCam(false); }
  };

  const takePhoto = () => {
    if(!videoRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 600; canvas.height = videoRef.current.videoHeight * (600/videoRef.current.videoWidth);
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setImg(canvas.toDataURL('image/jpeg', 0.6));
    setCam(false);
    videoRef.current.srcObject.getTracks().forEach(t=>t.stop());
  };

  const post = async () => {
    if(!text && !img) return;
    await addDoc(collection(db,'artifacts',appId,'public','data','parkside_posts'), { author:userName, text, image:img, timestamp:serverTimestamp(), likes:[], comments:[] });
    setText(''); setImg(null);
  };

  const addReaction = async (id, emoji) => {
     await updateDoc(doc(db,'artifacts',appId,'public','data','parkside_posts',id), {
        comments: arrayUnion({ user: userName, text: emoji, time: Date.now() })
     });
  };

  return (
    <div style={styles.section}>
       {cam && (
          <div style={{position:'fixed', inset:0, backgroundColor:'black', zIndex:300, display:'flex', flexDirection:'column'}}>
             <video ref={videoRef} autoPlay playsInline style={{flex:1, objectFit:'cover'}}/>
             <canvas ref={canvasRef} style={{display:'none'}}/>
             <div style={{padding:'30px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'black'}}>
                <button onClick={()=>{setCam(false); videoRef.current.srcObject.getTracks().forEach(t=>t.stop())}} style={{color:'white', fontWeight:'700'}}>Cancel</button>
                <button onClick={takePhoto} style={{width:'70px', height:'70px', borderRadius:'35px', border:'5px solid white', backgroundColor:'rgba(255,255,255,0.5)'}}></button>
                <div style={{width:'50px'}}></div>
             </div>
          </div>
       )}

       <div style={styles.card}>
          <div style={{display:'flex', gap:'12px'}}>
             <div style={{width:'40px', height:'40px', borderRadius:'14px', backgroundColor:'#f4f4f5', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', color:'#71717a'}}>{userName[0]}</div>
             <textarea style={{...styles.input, height:'80px', resize:'none', marginBottom:0, backgroundColor:'transparent', border:'none', padding:'0'}} placeholder="Share an update..." value={text} onChange={e=>setText(e.target.value)}></textarea>
          </div>
          {img && <div style={{margin:'12px 0', height:'150px', borderRadius:'12px', overflow:'hidden', position:'relative'}}><img src={img} style={{width:'100%', height:'100%', objectFit:'cover'}}/><button onClick={()=>setImg(null)} style={{position:'absolute', top:'8px', right:'8px', backgroundColor:'rgba(0,0,0,0.5)', color:'white', borderRadius:'12px', padding:'4px'}}><X size={16}/></button></div>}
          <div style={{display:'flex', justifyContent:'space-between', marginTop:'12px', borderTop:`1px solid ${theme.border}`, paddingTop:'12px'}}>
             <button onClick={startCam} style={{border:'none', background:'transparent', color:theme.primary, fontWeight:'700', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px'}}><Camera size={18}/> Add Photo</button>
             <button onClick={post} style={{backgroundColor:theme.text, color:'white', padding:'8px 24px', borderRadius:'12px', border:'none', fontWeight:'700'}}>Post</button>
          </div>
       </div>

       {posts.map(p => (
          <div key={p.id} style={{...styles.card, padding:'0', overflow:'hidden'}}>
             <div style={{padding:'16px', display:'flex', gap:'12px', alignItems:'center'}}>
                <div style={{width:'36px', height:'36px', borderRadius:'12px', backgroundColor:'#f4f4f5', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', color:'#71717a'}}>{p.author[0]}</div>
                <div><div style={{fontWeight:'700', color:'#1c1917'}}>{p.author}</div><div style={{fontSize:'11px', color:'#a8a29e'}}>{p.timestamp ? new Date(p.timestamp.toDate()).toLocaleString() : 'Just now'}</div></div>
             </div>
             {p.text && <div style={{padding:'0 16px 16px 16px', color:'#44403c', fontSize:'15px', lineHeight:'1.5'}}>{p.text}</div>}
             {p.image && <img src={p.image} style={{width:'100%', height:'auto', display:'block'}}/>}
             
             {/* Comments / Reactions */}
             <div style={{padding:'12px 16px', borderTop:`1px solid ${theme.border}`}}>
                 <div style={{display:'flex', gap:'8px', marginBottom:'12px', overflowX:'auto'}}>
                    {['👍','❤️','🎉','👏'].map(e => (
                       <button key={e} onClick={()=>addReaction(p.id, e)} style={{fontSize:'18px', border:'none', background:'#f5f5f4', borderRadius:'20px', padding:'6px 12px'}}>{e}</button>
                    ))}
                 </div>
                 {p.comments && p.comments.length > 0 && (
                    <div style={{backgroundColor:'#f9fafb', padding:'12px', borderRadius:'12px', marginTop:'8px'}}>
                       {p.comments.map((c,i) => (
                          <div key={i} style={{fontSize:'13px', marginBottom:'4px'}}>
                             <span style={{fontWeight:'700', marginRight:'6px'}}>{c.user}:</span>{c.text}
                          </div>
                       ))}
                    </div>
                 )}
             </div>
          </div>
       ))}
    </div>
  );
};

// --- APP SHELL ---
export default function ParksideApp() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('staff');
  const [view, setView] = useState('dashboard');
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
       if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
       else await signInAnonymously(auth);
    };
    init();
    onAuthStateChanged(auth, setUser);
  }, []);

  if (!user) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:theme.bg}}><RefreshCw className="animate-spin" color={theme.primary}/></div>;
  if (!loggedIn) return <LoginScreen firebaseUser={user} onLogin={r=>{setRole(r);setLoggedIn(true);}} />;

  return (
    <div style={styles.app}>
       <div style={styles.header}>
          <ParksideLogo />
          <button onClick={()=>setLoggedIn(false)} style={{width:'36px', height:'36px', borderRadius:'12px', backgroundColor:'#fee2e2', border:'none', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444'}}><LogOut size={18}/></button>
       </div>

       {view === 'dashboard' && <Dashboard user={user} onNavigate={setView} />}
       {view === 'calendar' && <CalendarManager user={user} userRole={role} />}
       {view === 'house' && <HouseManager user={user} userRole={role} />}
       {view === 'feed' && <FeedView user={user} />}

       <BottomNav active={view} onChange={setView} />
    </div>
  );
}


