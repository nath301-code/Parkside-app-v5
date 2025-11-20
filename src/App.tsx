// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { 
  Camera, Home, Calendar, MessageSquare, User, Shield, Heart, X, RefreshCw, Lock, LogOut, 
  Clock, Plus, Users, Edit3, Trash2, Briefcase, Wrench, Receipt, CheckCircle, Leaf, Phone, 
  PhoneCall, Moon, CalendarDays, ArrowRightCircle, UserPlus, UserX, Key, Eye
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut, updateProfile
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, doc, updateDoc, 
  arrayUnion, deleteDoc, where, writeBatch, getDocs
} from "firebase/firestore";

// --- YOUR FIREBASE CONFIGURATION ---
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
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  if (typeof timestamp === 'string') return timestamp;
  const date = timestamp.toDate();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const addDays = (dateString, days) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// --- BRANDING ---
const ParksideLogo = ({ size = "large", showText = true }) => {
  const isLarge = size === "large";
  const brownColor = "text-[#8B5E3C]"; 
  const greenColor = "text-[#65A30D]";
  return (
    <div className={`flex ${isLarge ? 'flex-col' : 'flex-row'} items-center justify-center gap-2`}>
      <div className="relative flex items-center justify-center">
        <Leaf className={`absolute -top-3 -left-3 ${greenColor} ${isLarge ? 'w-6 h-6' : 'w-3 h-3'} rotate-[-45deg]`} fill="currentColor" />
        <Leaf className={`absolute -top-5 left-0 ${greenColor} ${isLarge ? 'w-5 h-5' : 'w-2.5 h-2.5'}`} fill="currentColor" />
        <Leaf className={`absolute -top-3 -right-3 ${greenColor} ${isLarge ? 'w-6 h-6' : 'w-3 h-3'} rotate-[45deg]`} fill="currentColor" />
        <div className={`relative z-10 border-2 border-[#8B5E3C] ${isLarge ? 'w-12 h-12 border-4' : 'w-6 h-6 border-2'} rounded-lg flex items-center justify-center bg-white`}>
           <div className={`grid grid-cols-2 gap-[1px] ${isLarge ? 'w-4 h-4' : 'w-2 h-2'} bg-[#8B5E3C]`}><div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div></div>
        </div>
         <div className={`absolute ${isLarge ? '-bottom-4 w-4 h-4' : '-bottom-2 w-2 h-2'} bg-[#8B5E3C]`}></div>
      </div>
      {showText && <span className={`${isLarge ? 'text-4xl mt-4' : 'text-xl'} font-bold ${brownColor}`} style={{ fontFamily: '"Brush Script MT", cursive' }}>Parkside</span>}
    </div>
  );
};

// --- COMPONENTS ---

// 1. LOGIN SCREEN
const LoginScreen = ({ onLogin, firebaseUser }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name.trim() || (!isResetting && !password.trim()) || (isResetting && !newPassword.trim())) return;
    setLoading(true);
    setError('');

    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'parkside_users');
      const snapshot = await getDocs(usersRef);
      
      let existingUserDoc = null;
      if (!snapshot.empty) {
        existingUserDoc = snapshot.docs.find(d => d.data().name.toLowerCase() === name.trim().toLowerCase());
      }

      if (isResetting && existingUserDoc) {
         await updateDoc(existingUserDoc.ref, { password: newPassword.trim() });
         await updateProfile(firebaseUser, { displayName: name });
         onLogin(existingUserDoc.data().role);
         setLoading(false);
         return;
      }

      let role = 'staff';
      let shouldCreate = false;

      if (name.trim().toLowerCase() === 'nathan' && password === 'reset-admin') {
          setIsResetting(true);
          setLoading(false);
          return;
      }

      if (snapshot.empty && name.trim().toLowerCase() === 'nathan') {
        shouldCreate = true;
        role = 'manager';
      } else if (existingUserDoc) {
        const userData = existingUserDoc.data();
        if (userData.password === password) {
          role = userData.role;
        } else {
          setError('Incorrect password.');
          setLoading(false);
          return;
        }
      } else {
        setError('Account not found.');
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        await updateProfile(firebaseUser, { displayName: name });
        if (shouldCreate) {
          await addDoc(usersRef, { name: 'Nathan', role: 'manager', password: password, createdAt: serverTimestamp() });
        }
        onLogin(role);
      }
    } catch (err) {
      console.error(err);
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-white p-10 text-center border-b border-slate-50">
          <ParksideLogo size="large" />
          <p className="text-slate-400 mt-2 text-sm font-medium tracking-wide uppercase">Secure Staff Portal</p>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6 bg-slate-50/50">
          {error && <div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-bold text-center flex items-center justify-center gap-2"><Lock size={14}/> {error}</div>}
          {isResetting && <div className="bg-orange-100 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm font-bold text-center">Reset Mode: Please set your new password.</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#65A30D] outline-none bg-white" placeholder="e.g. Nathan" required disabled={isResetting} />
              </div>
            </div>
            
            {!isResetting ? (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 text-slate-400" size={20} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#65A30D] outline-none bg-white" placeholder="•••••••" required />
                </div>
              </div>
            ) : (
               <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">New Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 text-slate-400" size={20} />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#65A30D] outline-none bg-white" placeholder="New Secure Password" required />
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${isResetting ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#65A30D] hover:bg-[#4d7c0a]'}`}>
            {loading ? <RefreshCw className="animate-spin" /> : (isResetting ? 'Update Password' : 'Login')}
          </button>
        </form>
      </div>
    </div>
  );
};

// 2. IN-APP CAMERA
const SecureCamera = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { console.error(err); }
    };
    startCamera();
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, []);
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const scale = 600 / video.videoWidth;
    canvas.width = 600; canvas.height = video.videoHeight * scale;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL('image/jpeg', 0.7));
  };
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 flex items-center justify-center overflow-hidden"><video ref={videoRef} autoPlay playsInline className="absolute w-full h-full object-cover" /><canvas ref={canvasRef} className="hidden" /><button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full"><X size={24} /></button><div className="absolute bottom-8 left-0 right-0 flex justify-center"><button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm"></button></div></div>
    </div>
  );
};

// 3. CALENDAR
const CalendarManager = ({ user, userRole }) => {
  const [activeTab, setActiveTab] = useState('myrota');
  const [appointments, setAppointments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [allStaff, setAllStaff] = useState([]); 
  const [showAddApt, setShowAddApt] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [viewingBlock, setViewingBlock] = useState(null);

  const [shiftMode, setShiftMode] = useState('block');
  const [newChild, setNewChild] = useState(''); const [newType, setNewType] = useState(''); const [newDate, setNewDate] = useState(''); const [newTime, setNewTime] = useState(''); const [newStaff, setNewStaff] = useState('');
  const [shiftDate, setShiftDate] = useState(''); const [sleep1, setSleep1] = useState(''); const [sleep2, setSleep2] = useState(''); const [sleep3, setSleep3] = useState(''); const [dayStaff, setDayStaff] = useState('');
  const [adhocStaff, setAdhocStaff] = useState(''); const [adhocStart, setAdhocStart] = useState(''); const [adhocEnd, setAdhocEnd] = useState('');

  useEffect(() => {
    if (!user) return;
    const qApt = query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_appointments'), orderBy('dateTime', 'asc'));
    const unsubApt = onSnapshot(qApt, (s) => setAppointments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qRota = query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_rota_v3'), orderBy('date', 'asc'));
    const unsubRota = onSnapshot(qRota, (s) => setShifts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qStaff = query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_users'), orderBy('name', 'asc'));
    const unsubStaff = onSnapshot(qStaff, (s) => setAllStaff(s.docs.map(d => d.data())));
    return () => { unsubApt(); unsubRota(); unsubStaff(); };
  }, [user]);

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!newChild || !newDate) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_appointments'), { childName: newChild, type: newType, dateTime: new Date(`${newDate}T${newTime || '09:00'}`).toISOString(), displayDate: newDate, displayTime: newTime, staff: newStaff, createdBy: user.displayName });
    setShowAddApt(false); setNewChild(''); setNewType(''); setNewDate('');
  };

  const handleSaveRota = async (e) => {
    e.preventDefault();
    if (!shiftDate) return;

    if (shiftMode === 'block') {
        if (!sleep1 || !sleep2 || !sleep3 || !dayStaff) return;
        const batch = writeBatch(db);
        const day1Ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_rota_v3'));
        const day1Staff = [{ name: sleep1, type: 'sleep', dayIndex: 1 }, { name: sleep2, type: 'sleep', dayIndex: 1 }, { name: sleep3, type: 'sleep', dayIndex: 1 }, { name: dayStaff, type: 'day', dayIndex: 1 }];
        batch.set(day1Ref, { date: shiftDate, displayDate: new Date(shiftDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), staff: day1Staff, blockId: day1Ref.id, dayNumber: 1, type: 'block' });

        const date2 = addDays(shiftDate, 1);
        const day2Ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_rota_v3'));
        const day2Staff = [{ name: sleep1, type: 'sleep', dayIndex: 2 }, { name: sleep2, type: 'sleep', dayIndex: 2 }, { name: sleep3, type: 'sleep', dayIndex: 2 }, { name: dayStaff, type: 'day', dayIndex: 2 }];
        batch.set(day2Ref, { date: date2, displayDate: new Date(date2).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), staff: day2Staff, blockId: day1Ref.id, dayNumber: 2, type: 'block' });
        await batch.commit();
    } else {
        if (!adhocStaff || !adhocStart || !adhocEnd) return;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_rota_v3'), {
            date: shiftDate,
            displayDate: new Date(shiftDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
            staff: [{ name: adhocStaff, type: 'adhoc', start: adhocStart, end: adhocEnd }],
            type: 'adhoc'
        });
    }
    setShowAddShift(false); setShiftDate(''); setSleep1(''); setSleep2(''); setSleep3(''); setDayStaff(''); setAdhocStaff('');
  };

  const handleDeleteShift = async (id) => { if (confirm('Remove shift?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parkside_rota_v3', id)); };
  const myShifts = shifts.filter(shift => shift.staff.some(s => s.name.toLowerCase() === user.displayName?.toLowerCase()));
  
  const StaffSelect = ({ value, onChange, label }) => (
    <div className="mb-2">
        <select className="w-full p-2 border rounded-lg bg-white text-slate-700" value={value} onChange={e => onChange(e.target.value)}>
            <option value="" disabled>{label}</option>
            {allStaff.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
    </div>
  );

  const getBlockDetails = (blockId) => shifts.filter(s => s.blockId === blockId).sort((a,b) => a.dayNumber - b.dayNumber);

  return (
    <div className="h-full flex flex-col pb-24">
      {viewingBlock && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden">
                <div className="bg-[#65A30D] p-4 text-white flex justify-between items-center"><h3 className="font-bold text-lg">Your 48hr Block</h3><button onClick={() => setViewingBlock(null)}><X/></button></div>
                <div className="p-4 space-y-4 bg-slate-50">
                    {getBlockDetails(viewingBlock).map(day => (
                        <div key={day.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="font-bold text-lg text-slate-800 mb-1">{day.displayDate}</div>
                            <div className="text-xs uppercase font-bold text-[#65A30D] mb-3">Day {day.dayNumber} of 2</div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600"><Clock size={16}/>{day.dayNumber === 1 ? 'Start 08:00' : 'Full Day (End 08:30 Next Day)'}</div>
                                <div className="flex items-center gap-2 text-sm text-slate-600"><Moon size={16}/> Sleep-in included</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-white border-t border-slate-100"><button onClick={() => setViewingBlock(null)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Close</button></div>
            </div>
        </div>
      )}

      <div className="bg-white p-4 pb-2 border-b border-slate-100 sticky top-0 z-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="text-[#8B5E3C]" /> Rota & Diary</h2>
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
          <button onClick={() => setActiveTab('myrota')} className={`flex-1 whitespace-nowrap py-2 text-xs font-bold rounded-lg ${activeTab === 'myrota' ? 'bg-white text-[#65A30D] shadow-sm' : 'text-slate-500'}`}>My Shifts</button>
          <button onClick={() => setActiveTab('fullrota')} className={`flex-1 whitespace-nowrap py-2 text-xs font-bold rounded-lg ${activeTab === 'fullrota' ? 'bg-white text-[#65A30D] shadow-sm' : 'text-slate-500'}`}>Full Rota</button>
          <button onClick={() => setActiveTab('appointments')} className={`flex-1 whitespace-nowrap py-2 text-xs font-bold rounded-lg ${activeTab === 'appointments' ? 'bg-white text-[#65A30D] shadow-sm' : 'text-slate-500'}`}>Kids Appts</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'myrota' && (
          <div className="space-y-4">
            <div className="bg-teal-50 p-4 rounded-xl border border-teal-100"><h3 className="font-bold text-teal-900 mb-1">Your Schedule</h3><p className="text-xs text-teal-700">Tap a block shift to see both days.</p></div>
            {myShifts.length === 0 ? <div className="text-center py-10 text-slate-400">No upcoming shifts assigned.</div> : myShifts.map(shift => {
                const myRole = shift.staff.find(s => s.name.toLowerCase() === user.displayName?.toLowerCase());
                const isAdhoc = shift.type === 'adhoc';
                return (
                  <div key={shift.id} onClick={() => shift.blockId && setViewingBlock(shift.blockId)} className={`bg-white p-4 rounded-xl border-l-4 shadow-sm mb-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${isAdhoc ? 'border-blue-500' : 'border-[#65A30D]'}`}>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div><span className="font-bold text-lg text-slate-800">{shift.displayDate}</span><div className="text-xs font-bold text-slate-400 uppercase mt-1">{isAdhoc ? 'Extra Shift' : (myRole.dayIndex === 1 ? "Day 1 of 2 (Start)" : "Day 2 of 2 (Finish)")}</div></div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${isAdhoc ? 'bg-blue-100 text-blue-700' : (myRole?.type === 'sleep' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700')}`}>
                        {isAdhoc ? 'ADHOC' : (myRole?.type === 'sleep' ? 'SLEEP IN' : 'LATE')}
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 flex items-start gap-3 mt-2 relative z-10">
                        <Clock size={16} className="mt-0.5 shrink-0 text-teal-600" />
                        <div>{isAdhoc ? (<span>{myRole.start} - {myRole.end}</span>) : (myRole?.type === 'sleep' ? (myRole.dayIndex === 1 ? <span className="font-bold">08:00 Start <ArrowRightCircle className="inline w-3 h-3"/> Sleep Over</span> : <span>Sleep Over <ArrowRightCircle className="inline w-3 h-3"/> Finish 08:30</span>) : (<span className="font-bold">08:00 - 22:30 (Late Finish)</span>))}</div>
                    </div>
                    {shift.blockId && <div className="absolute right-2 bottom-2"><Eye size={16} className="text-slate-300"/></div>}
                  </div>
                )
              })}
          </div>
        )}
        {activeTab === 'fullrota' && (
          <div className="space-y-3">
            {userRole === 'manager' && <button onClick={() => setShowAddShift(true)} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg mb-4 flex items-center justify-center gap-2"><CalendarDays size={18} /> Add Shifts</button>}
            {shifts.map((shift) => (
              <div key={shift.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
                <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{shift.displayDate}</span>
                        {shift.type === 'block' && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">Day {shift.dayNumber}</span>}
                        {shift.type === 'adhoc' && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded">ADHOC</span>}
                    </div>
                    {userRole === 'manager' && <button onClick={() => handleDeleteShift(shift.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>}
                </div>
                <div className="p-3 space-y-2"><div className="grid grid-cols-2 gap-2">{shift.staff.map((s, i) => (<div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${s.type === 'sleep' ? 'bg-purple-50 border-purple-100' : s.type === 'day' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>{s.type === 'sleep' ? <Moon size={14} className="text-purple-500"/> : <Clock size={14} className="text-slate-500"/>}<span className="text-sm font-medium text-slate-900">{s.name} {s.type==='adhoc' && `(${s.start}-${s.end})`}</span></div>))}</div></div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {appointments.map(apt => (<div key={apt.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4"><div className="flex flex-col items-center justify-center px-3 bg-green-50 rounded-lg text-[#65A30D] border border-green-100"><span className="text-xs font-bold uppercase">{new Date(apt.displayDate).toLocaleString('default', { month: 'short' })}</span><span className="text-xl font-bold">{new Date(apt.displayDate).getDate()}</span></div><div className="flex-1"><div className="flex justify-between items-start"><h3 className="font-bold text-slate-800 text-lg">{apt.childName}</h3><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium flex items-center gap-1"><Clock size={12} /> {apt.displayTime}</span></div><p className="text-[#8B5E3C] font-medium text-sm mb-1">{apt.type}</p>{apt.staff && <div className="flex items-center gap-1 text-xs text-slate-500"><Users size={12} /> Escort: {apt.staff}</div>}</div></div>))}
            <button onClick={() => setShowAddApt(true)} className="w-full py-3 bg-[#65A30D] text-white rounded-xl font-bold shadow-lg hover:bg-[#4d7c0a] transition-all flex items-center justify-center gap-2"><Plus size={20} /> Add Appointment</button>
          </div>
        )}
      </div>

      {showAddShift && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 space-y-4 border-2 border-purple-500 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between font-bold text-lg text-purple-900"><span>Add Shift</span><X onClick={() => setShowAddShift(false)} /></div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setShiftMode('block')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${shiftMode === 'block' ? 'bg-white shadow text-purple-700' : 'text-slate-500'}`}>48hr Block</button>
                <button onClick={() => setShiftMode('adhoc')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${shiftMode === 'adhoc' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>Hourly</button>
            </div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Date</label><input type="date" className="w-full p-3 border rounded-xl bg-slate-50 font-bold" value={shiftDate} onChange={e => setShiftDate(e.target.value)} /></div>
            
            {shiftMode === 'block' ? (
                <div className="space-y-3">
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100"><h4 className="text-sm font-bold text-purple-900 flex items-center gap-2 mb-2"><Moon size={14}/> Sleep-in Staff (x3)</h4>
                        <StaffSelect value={sleep1} onChange={setSleep1} label="Sleep Staff 1" />
                        <StaffSelect value={sleep2} onChange={setSleep2} label="Sleep Staff 2" />
                        <StaffSelect value={sleep3} onChange={setSleep3} label="Sleep Staff 3" />
                    </div>
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100"><h4 className="text-sm font-bold text-orange-900 flex items-center gap-2 mb-2"><LogOut size={14}/> Late Staff (08:00 - 22:30)</h4>
                        <StaffSelect value={dayStaff} onChange={setDayStaff} label="Late Staff 4" />
                    </div>
                </div>
            ) : (
                <div className="space-y-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">Ad-hoc Shift Details</h4>
                    <StaffSelect value={adhocStaff} onChange={setAdhocStaff} label="Select Staff Member" />
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] text-slate-500 uppercase font-bold">Start</label><input type="time" className="w-full p-2 border rounded" value={adhocStart} onChange={e => setAdhocStart(e.target.value)} /></div>
                        <div><label className="text-[10px] text-slate-500 uppercase font-bold">End</label><input type="time" className="w-full p-2 border rounded" value={adhocEnd} onChange={e => setAdhocEnd(e.target.value)} /></div>
                    </div>
                </div>
            )}
            
            <button onClick={handleSaveRota} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg">Save to Rota</button>
          </div>
        </div>
      )}

      {showAddApt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 space-y-4">
            <div className="flex justify-between font-bold text-lg"><span>New Appointment</span><X onClick={() => setShowAddApt(false)} /></div>
            <input type="text" placeholder="Child (Initials)" className="w-full p-2 border rounded" value={newChild} onChange={e => setNewChild(e.target.value)} />
            <input type="text" placeholder="Type" className="w-full p-2 border rounded" value={newType} onChange={e => setNewType(e.target.value)} />
            <div className="grid grid-cols-2 gap-2"><input type="date" className="w-full p-2 border rounded" value={newDate} onChange={e => setNewDate(e.target.value)} /><input type="time" className="w-full p-2 border rounded" value={newTime} onChange={e => setNewTime(e.target.value)} /></div>
            <input type="text" placeholder="Escort" className="w-full p-2 border rounded" value={newStaff} onChange={e => setNewStaff(e.target.value)} />
            <button onClick={handleAddAppointment} className="w-full py-3 bg-[#65A30D] text-white rounded font-bold">Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. FEED
const FeedView = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [caption, setCaption] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  useEffect(() => { if (!user) return; const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_posts'), orderBy('timestamp', 'desc')); const unsubscribe = onSnapshot(q, (snapshot) => { setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); return () => unsubscribe(); }, [user]);
  const handlePost = async () => { if ((!caption && !capturedImage) || isPosting) return; setIsPosting(true); try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_posts'), { author: user.displayName || 'Staff', authorId: user.uid, text: caption, image: capturedImage, timestamp: serverTimestamp(), likes: [] }); setCaption(''); setCapturedImage(null); } catch (err) { console.error(err); } finally { setIsPosting(false); } };
  const handleLike = async (postId, likes) => { if (likes?.includes(user.uid)) return; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parkside_posts', postId), { likes: arrayUnion(user.uid) }); };
  return (
    <div className="pb-24">
      {showCamera && <SecureCamera onCapture={(img) => { setCapturedImage(img); setShowCamera(false); }} onClose={() => setShowCamera(false)} />}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-[#65A30D] flex items-center justify-center text-white font-bold">{user.displayName?.[0]}</div><input type="text" placeholder="Share a celebration..." className="flex-1 bg-slate-100 rounded-2xl p-3 outline-none text-sm" value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
        {capturedImage && <div className="relative mb-3 rounded-lg overflow-hidden border border-slate-200"><img src={capturedImage} alt="Capture" className="w-full max-h-60 object-cover" /><button onClick={() => setCapturedImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16} /></button></div>}
        <div className="flex justify-between"><button onClick={() => setShowCamera(true)} className="flex items-center gap-2 text-[#65A30D] font-medium px-3 py-2 rounded-lg hover:bg-green-50"><Camera size={20} /> Photo</button><button onClick={handlePost} disabled={(!caption && !capturedImage) || isPosting} className="bg-[#65A30D] text-white px-5 py-2 rounded-full font-medium text-sm disabled:opacity-50">{isPosting ? '...' : 'Post'}</button></div>
      </div>
      <div className="space-y-4 p-4">
        {posts.map(post => (<div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"><div className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">{post.author[0]}</div><div><div className="font-bold text-slate-800">{post.author}</div><div className="text-xs text-slate-400">{post.timestamp ? formatTime(post.timestamp) : ''} · {post.timestamp ? formatDate(post.timestamp) : ''}</div></div></div>{post.text && <div className="px-4 pb-2 text-slate-700 whitespace-pre-wrap">{post.text}</div>}{post.image && <div className="w-full bg-black"><img src={post.image} alt="Post" className="w-full object-contain max-h-96" /></div>}<div className="p-3 border-t border-slate-50 flex items-center gap-4"><button onClick={() => handleLike(post.id, post.likes || [])} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${post.likes?.includes(user.uid) ? 'text-pink-500 bg-pink-50' : 'text-slate-500'}`}><Heart size={18} fill={post.likes?.includes(user.uid) ? "currentColor" : "none"} /><span className="text-sm font-medium">{post.likes?.length || 0}</span></button></div></div>))}
      </div>
    </div>
  );
};

// 5. HOUSE MANAGER (With Team Management)
const HouseManager = ({ user, userRole }) => {
  const [activeTab, setActiveTab] = useState('oncall'); 
  const [repairs, setRepairs] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [onCallRota, setOnCallRota] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  const [newRepair, setNewRepair] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isAddingRepair, setIsAddingRepair] = useState(false);

  const [showReceiptCam, setShowReceiptCam] = useState(false);
  const [receiptImg, setReceiptImg] = useState(null);
  const [amount, setAmount] = useState('');
  const [store, setStore] = useState('');
  const [category, setCategory] = useState('Food');
  const [isAddingReceipt, setIsAddingReceipt] = useState(false);

  const [onCallDate, setOnCallDate] = useState('');
  const [onCallName, setOnCallName] = useState('');
  const [onCallNumber, setOnCallNumber] = useState('');
  const [isAddingOnCall, setIsAddingOnCall] = useState(false);

  // Team Management
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('staff');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub1 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_repairs'), orderBy('timestamp', 'desc')), (s) => setRepairs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsub2 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_receipts'), orderBy('timestamp', 'desc')), (s) => setReceipts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsub3 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_oncall'), orderBy('date', 'asc')), (s) => setOnCallRota(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsub4 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_users'), orderBy('name', 'asc')), (s) => setUsersList(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [user]);

  const handleAddRepair = async (e) => { e.preventDefault(); if (!newRepair) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_repairs'), { item: newRepair, location: newLocation, reportedBy: user.displayName, status: 'open', timestamp: serverTimestamp() }); setIsAddingRepair(false); setNewRepair(''); setNewLocation(''); };
  const toggleRepairStatus = async (id, currentStatus) => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parkside_repairs', id), { status: currentStatus === 'open' ? 'fixed' : 'open' }); };
  const handleAddReceipt = async (e) => { e.preventDefault(); if (!amount || !receiptImg) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_receipts'), { amount, store, category, image: receiptImg, staff: user.displayName, timestamp: serverTimestamp() }); setIsAddingReceipt(false); setAmount(''); setStore(''); setReceiptImg(null); };
  const handleAddOnCall = async (e) => { e.preventDefault(); if (!onCallDate || !onCallName) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_oncall'), { date: onCallDate, name: onCallName, number: onCallNumber, createdBy: user.displayName, timestamp: serverTimestamp() }); setIsAddingOnCall(false); setOnCallDate(''); setOnCallName(''); setOnCallNumber(''); };
  const deleteOnCall = async (id) => { if(confirm('Delete entry?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parkside_oncall', id)); };
  
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPassword.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_users'), { 
        name: newUserName.trim(), 
        role: newUserRole, 
        password: newUserPassword.trim(),
        createdAt: serverTimestamp() 
    });
    setIsAddingUser(false); setNewUserName(''); setNewUserRole('staff'); setNewUserPassword('');
  };
  const handleDeleteUser = async (id) => { if(confirm('Delete this user account?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parkside_users', id)); };

  return (
    <div className="h-full flex flex-col pb-24">
      {showReceiptCam && <SecureCamera onCapture={(img) => { setReceiptImg(img); setShowReceiptCam(false); }} onClose={() => setShowReceiptCam(false)} />}
      <div className="bg-white p-4 pb-2 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-4"><ParksideLogo size="small" showText={false} /><h2 className="text-2xl font-bold text-slate-800">House Hub</h2></div>
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
          <button onClick={() => setActiveTab('oncall')} className={`flex-1 whitespace-nowrap py-2 px-3 text-xs font-bold rounded-lg ${activeTab === 'oncall' ? 'bg-white text-[#65A30D] shadow-sm' : 'text-slate-500'}`}>On Call</button>
          <button onClick={() => setActiveTab('pettycash')} className={`flex-1 whitespace-nowrap py-2 px-3 text-xs font-bold rounded-lg ${activeTab === 'pettycash' ? 'bg-white text-[#65A30D] shadow-sm' : 'text-slate-500'}`}>Cash</button>
          <button onClick={() => setActiveTab('repairs')} className={`flex-1 whitespace-nowrap py-2 px-3 text-xs font-bold rounded-lg ${activeTab === 'repairs' ? 'bg-white text-[#65A30D] shadow-sm' : 'text-slate-500'}`}>Repairs</button>
          {userRole === 'manager' && <button onClick={() => setActiveTab('team')} className={`flex-1 whitespace-nowrap py-2 px-3 text-xs font-bold rounded-lg ${activeTab === 'team' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-600'}`}>Team</button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'team' && userRole === 'manager' && (
            <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl"><h3 className="font-bold text-purple-900 mb-1">Staff Accounts</h3><p className="text-xs text-purple-700">Create secure accounts for your team.</p></div>
                {!isAddingUser ? ( <button onClick={() => setIsAddingUser(true)} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2"><UserPlus size={20}/> Add New Staff</button>) : (
                    <form onSubmit={handleAddUser} className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm space-y-3">
                        <h4 className="font-bold text-purple-800">Create Account</h4>
                        <input type="text" placeholder="Full Name" className="w-full p-2 border rounded" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
                        <input type="text" placeholder="Assign Password" className="w-full p-2 border rounded" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
                        <select className="w-full p-2 border rounded" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}><option value="staff">Care Staff</option><option value="manager">Manager</option></select>
                        <div className="flex gap-2"><button type="button" onClick={() => setIsAddingUser(false)} className="flex-1 py-2 bg-slate-200 rounded font-bold">Cancel</button><button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded font-bold">Create User</button></div>
                    </form>
                )}
                <div className="space-y-2">{usersList.map(u => (<div key={u.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${u.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{u.name[0]}</div><div><div className="font-bold text-slate-800">{u.name}</div><div className="text-xs text-slate-400 uppercase">{u.role}</div></div></div><button onClick={() => handleDeleteUser(u.id)} className="text-slate-300 hover:text-red-500"><UserX size={18} /></button></div>))}</div>
            </div>
        )}
        {activeTab === 'oncall' && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl"><h3 className="font-bold text-purple-900 mb-1">On Call Protocol</h3><p className="text-xs text-purple-700">Managers take turns for on-call duties.</p></div>
            {userRole === 'manager' && (!isAddingOnCall ? <button onClick={() => setIsAddingOnCall(true)} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2"><Edit3 size={20}/> Add to Rota</button> : <form onSubmit={handleAddOnCall} className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm space-y-3"><input type="date" required className="w-full p-2 border rounded" value={onCallDate} onChange={e => setOnCallDate(e.target.value)} /><input type="text" placeholder="Manager Name" required className="w-full p-2 border rounded" value={onCallName} onChange={e => setOnCallName(e.target.value)} /><input type="tel" placeholder="Contact Number" required className="w-full p-2 border rounded" value={onCallNumber} onChange={e => setOnCallNumber(e.target.value)} /><div className="flex gap-2"><button type="button" onClick={() => setIsAddingOnCall(false)} className="flex-1 py-2 bg-slate-200 rounded font-bold">Cancel</button><button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded font-bold">Save</button></div></form>)}
            <div className="space-y-3">{onCallRota.map(shift => { const isToday = shift.date === getTodayString(); return (<div key={shift.id} className={`p-4 rounded-xl border shadow-sm flex justify-between items-center ${isToday ? 'bg-green-50 border-green-200 ring-1 ring-green-300' : 'bg-white border-slate-100'}`}><div>{isToday && <span className="bg-[#65A30D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block">ACTIVE NOW</span>}<div className="text-xs font-bold text-slate-400 uppercase">{new Date(shift.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div><div className="font-bold text-slate-800 text-lg">{shift.name}</div><a href={`tel:${shift.number}`} className="text-teal-600 font-medium text-sm flex items-center gap-1 mt-1"><Phone size={14}/> {shift.number}</a></div>{userRole === 'manager' && <button onClick={() => deleteOnCall(shift.id)} className="text-slate-300 hover:text-red-400 p-2"><Trash2 size={18}/></button>}</div>) })}</div>
          </div>
        )}
        {activeTab === 'repairs' && (
          <div className="space-y-3">
            <button onClick={() => setIsAddingRepair(true)} className="w-full py-3 border-2 border-dashed border-green-200 text-[#65A30D] rounded-xl font-bold hover:bg-green-50 flex items-center justify-center gap-2"><Plus size={20} /> Report Broken Item</button>
            {isAddingRepair && (<form onSubmit={handleAddRepair} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"><input type="text" placeholder="What's broken?" className="w-full p-2 border rounded" value={newRepair} onChange={e => setNewRepair(e.target.value)} /><input type="text" placeholder="Location" className="w-full p-2 border rounded" value={newLocation} onChange={e => setNewLocation(e.target.value)} /><div className="flex gap-2"><button type="button" onClick={() => setIsAddingRepair(false)} className="flex-1 py-2 bg-slate-200 rounded font-bold">Cancel</button><button type="submit" className="flex-1 py-2 bg-[#65A30D] text-white rounded font-bold">Report</button></div></form>)}
            {repairs.map(item => (<div key={item.id} className={`bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center ${item.status === 'fixed' ? 'opacity-60' : 'border-orange-200'}`}><div className="flex items-start gap-3"><div className={`p-2 rounded-full ${item.status === 'fixed' ? 'bg-green-100 text-[#65A30D]' : 'bg-orange-100 text-orange-600'}`}>{item.status === 'fixed' ? <CheckCircle size={20} /> : <Wrench size={20} />}</div><div><h4 className={`font-bold ${item.status === 'fixed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.item}</h4><div className="text-xs text-slate-400">{item.location}</div></div></div><button onClick={() => toggleRepairStatus(item.id, item.status)} className={`text-xs font-bold px-3 py-1 rounded-full ${item.status === 'fixed' ? 'bg-slate-100 text-slate-500' : 'bg-orange-100 text-orange-600'}`}>{item.status === 'fixed' ? 'Fixed' : 'Open'}</button></div>))}
          </div>
        )}
        {activeTab === 'pettycash' && (
          <div className="space-y-3">
             {!isAddingReceipt ? <button onClick={() => setIsAddingReceipt(true)} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2"><Receipt size={20} /> Add Receipt</button> : <form onSubmit={handleAddReceipt} className="bg-white p-4 rounded-xl border border-green-200 shadow-sm space-y-3"><div className="bg-slate-50 p-3 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300">{receiptImg ? <div className="relative w-full"><img src={receiptImg} className="w-full h-32 object-cover rounded-lg" /><button type="button" onClick={() => setReceiptImg(null)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><X size={14}/></button></div> : <button type="button" onClick={() => setShowReceiptCam(true)} className="flex flex-col items-center gap-2 text-slate-500 py-4"><Camera size={24} className="text-[#65A30D]"/><span className="text-xs font-bold">Snap Receipt</span></button>}</div><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" required className="w-full p-2 border rounded" placeholder="£ Amount" value={amount} onChange={e => setAmount(e.target.value)} /><input type="text" placeholder="Store" required className="w-full p-2 border rounded" value={store} onChange={e => setStore(e.target.value)} /></div><select className="w-full p-2 border rounded" value={category} onChange={e => setCategory(e.target.value)}><option>Food</option><option>Activities</option><option>Clothing</option><option>Transport</option></select><div className="flex gap-2 mt-2"><button type="button" onClick={() => setIsAddingReceipt(false)} className="flex-1 py-2 bg-slate-200 rounded font-bold">Cancel</button><button type="submit" disabled={!receiptImg} className="flex-1 py-2 bg-green-600 text-white rounded font-bold disabled:opacity-50">Submit</button></div></form>}
             {receipts.map(item => (<div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex gap-3 items-center"><div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-700 shrink-0 font-bold border border-green-100">£{item.amount}</div><div className="flex-1 min-w-0"><h4 className="font-bold text-slate-700 truncate">{item.store}</h4><div className="text-xs text-slate-500">{item.category}</div></div>{item.image && <img src={item.image} className="w-10 h-10 object-cover rounded bg-slate-200 border border-slate-200" />}</div>))}
          </div>
        )}
      </div>
    </div>
  );
};

// 6. DASHBOARD
const Dashboard = ({ user, userRole, onNavigate }) => {
  const [todayOnCall, setTodayOnCall] = useState(null);
  const [nextShift, setNextShift] = useState(null);
  useEffect(() => {
    if (!user) return;
    const today = getTodayString();
    const qOnCall = query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_oncall'), where('date', '==', today));
    const unsubOnCall = onSnapshot(qOnCall, (s) => { if (!s.empty) setTodayOnCall(s.docs[0].data()); else setTodayOnCall(null); });
    const qShifts = query(collection(db, 'artifacts', appId, 'public', 'data', 'parkside_rota_v3'), where('date', '>=', today), orderBy('date', 'asc'));
    const unsubShifts = onSnapshot(qShifts, (s) => { const allShifts = s.docs.map(d => ({ id: d.id, ...d.data() })); const myNext = allShifts.find(shift => shift.staff.some(st => st.name.toLowerCase() === user.displayName?.toLowerCase())); setNextShift(myNext || null); });
    return () => { unsubOnCall(); unsubShifts(); };
  }, [user]);

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Hello, {user.displayName?.split(' ')[0]} 👋</h1><p className="text-slate-500">{userRole === 'manager' ? 'Team Leader' : 'Care Staff'} @ Parkside</p></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userRole === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-[#65A30D]'}`}>{userRole === 'manager' ? <Briefcase size={20} /> : <User size={20} />}</div>
      </div>
      <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm ring-1 ring-purple-50"><h3 className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-3 flex items-center gap-2"><PhoneCall size={14} /> Who is On Call Today?</h3>{todayOnCall ? (<div className="flex items-center justify-between"><div><div className="text-xl font-bold text-slate-800">{todayOnCall.name}</div><div className="text-slate-500 text-sm">Until 9:00 AM tomorrow</div></div><a href={`tel:${todayOnCall.number}`} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md active:scale-95 transition-transform"><Phone size={18} /> Call</a></div>) : <div className="text-slate-400 text-sm italic py-2">No on-call manager assigned today.</div>}</div>
      {nextShift ? (<div className="bg-gradient-to-br from-[#65A30D] to-[#3f6212] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"><ArrowRightCircle className="absolute top-3 right-3 opacity-20 w-24 h-24" /><div className="flex items-center justify-between mb-2 relative z-10"><div className="flex items-center gap-2 opacity-90"><User size={16} /><span className="text-sm font-medium uppercase tracking-wide">Your Next Shift</span></div><span className="bg-white/20 text-white text-xs px-2 py-1 rounded font-bold">{nextShift.date === getTodayString() ? 'TODAY' : 'UPCOMING'}</span></div><div className="text-2xl font-bold relative z-10">{new Date(nextShift.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</div><div className="mt-2 opacity-90 text-sm flex items-center gap-2 relative z-10"><Clock size={14} />{(() => { const myRole = nextShift.staff.find(s => s.name.toLowerCase() === user.displayName?.toLowerCase()); if (myRole?.type === 'adhoc') return `${myRole.start} - ${myRole.end}`; if (myRole?.type !== 'sleep') return "08:00 - 22:30 (Late Finish)"; return myRole.dayIndex === 1 ? "Day 1: 08:00 Start" : "Day 2: 08:30 Finish Tomorrow"; })()}</div></div>) : (<div className="bg-gradient-to-br from-[#65A30D] to-[#3f6212] rounded-2xl p-5 text-white shadow-lg"><div className="flex items-center gap-2 mb-3 opacity-90"><Shield size={16} /><span className="text-sm font-medium uppercase tracking-wide">Handover Summary</span></div><p className="text-lg font-medium leading-relaxed">No upcoming shifts found on the rota. Enjoy your days off!</p></div>)}
      <div className="grid grid-cols-2 gap-3"><button onClick={() => onNavigate('calendar')} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors"><div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Clock size={20} /></div><span className="font-medium text-sm text-slate-700">Appointments</span></button><button onClick={() => onNavigate('house')} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors"><div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Wrench size={20} /></div><span className="font-medium text-sm text-slate-700">House / On Call</span></button></div>
    </div>
  );
};

// --- MAIN APP ---
export default function ParksideApp() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isAppLoggedIn, setIsAppLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('staff');
  const [currentView, setCurrentView] = useState('dashboard'); 

  useEffect(() => {
     const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           await signInWithCustomToken(auth, __initial_auth_token);
        } else {
           await signInAnonymously(auth);
        }
     };
     initAuth();
     onAuthStateChanged(auth, setFirebaseUser);
  }, []);

  const handleLogout = () => {
      setIsAppLoggedIn(false);
  };

  if (!firebaseUser) {
      return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-[#65A30D]"><RefreshCw className="animate-spin" size={32}/></div>;
  }

  if (!isAppLoggedIn) {
      return <LoginScreen firebaseUser={firebaseUser} onLogin={(role) => { setUserRole(role); setIsAppLoggedIn(true); }} />;
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-20"><div className="flex items-center gap-2"><ParksideLogo size="small" /></div><button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={20} /></button></header>
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {currentView === 'dashboard' && <Dashboard user={firebaseUser} userRole={userRole} onNavigate={setCurrentView} />}
        {currentView === 'calendar' && <CalendarManager user={firebaseUser} userRole={userRole} />}
        {currentView === 'feed' && <FeedView user={firebaseUser} />}
        {currentView === 'house' && <HouseManager user={firebaseUser} userRole={userRole} />}
      </main>
      <nav className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center sticky bottom-0 z-30 pb-6 lg:pb-3"><button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'text-[#65A30D]' : 'text-slate-400'}`}><Home size={24} strokeWidth={currentView==='dashboard'?2.5:2} /><span className="text-[10px] font-bold">Home</span></button><button onClick={() => setCurrentView('calendar')} className={`flex flex-col items-center gap-1 ${currentView === 'calendar' ? 'text-[#65A30D]' : 'text-slate-400'}`}><Calendar size={24} strokeWidth={currentView==='calendar'?2.5:2} /><span className="text-[10px] font-bold">Rota</span></button><button onClick={() => setCurrentView('house')} className={`flex flex-col items-center gap-1 ${currentView === 'house' ? 'text-[#65A30D]' : 'text-slate-400'}`}><Wrench size={24} strokeWidth={currentView==='house'?2.5:2} /><span className="text-[10px] font-bold">House</span></button><button onClick={() => setCurrentView('feed')} className={`flex flex-col items-center gap-1 ${currentView === 'feed' ? 'text-[#65A30D]' : 'text-slate-400'}`}><MessageSquare size={24} strokeWidth={currentView==='feed'?2.5:2} /><span className="text-[10px] font-bold">Log</span></button></nav>
    </div>
  );
}


