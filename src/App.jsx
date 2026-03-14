import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child } from "firebase/database";
import CryptoJS from 'crypto-js';

// --- FIREBASE CONFIG (Replace with your own) ---
const firebaseConfig = {
  apiKey: "AIzaSyAKC5znAlxRW77hXi1Pk0JvAy7vAXurU9w",
  authDomain: "tournament-pro-7640a.firebaseapp.com",
  databaseURL: "https://tournament-pro-7640a-default-rtdb.firebaseio.com",
  projectId: "tournament-pro-7640a",
  storageBucket: "tournament-pro-7640a.firebasestorage.app",
  messagingSenderId: "1033810183760",
  appId: "1:1033810183760:web:2e3376b78d95b8a280b355"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- APP COMPONENT ---
function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    });
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowInstall(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <Router>
      <div style={{ maxWidth: '500px', margin: 'auto', padding: '20px' }}>
        {showInstall && (
          <button onClick={installApp} style={{ width: '100%', padding: '15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', marginBottom: '20px' }}>
            GET APP
          </button>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/message/:id" element={<View />} />
        </Routes>
      </div>
    </Router>
  );
}

// --- HOME SCREEN (CREATE MESSAGE) ---
const Home = () => {
  const [text, setText] = useState('');
  const [pass, setPass] = useState('');
  const [link, setLink] = useState('');
  const [pasteLink, setPasteLink] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!text) return alert("Enter message");
    const id = Math.random().toString(36).substring(2, 10);
    let content = text;
    if (pass) content = CryptoJS.AES.encrypt(text, pass).toString();
    
    await set(ref(db, 'msgs/' + id), { content, crypt: pass !== '' });
    setLink(window.location.origin + '/message/' + id);
  };

  const handleOpenLink = () => {
    if (pasteLink.includes('/message/')) {
      const id = pasteLink.split('/message/')[1];
      navigate('/message/' + id);
    }
  };

  return (
    <div>
      <h2>Create Message</h2>
      <textarea placeholder="Write text..." value={text} onChange={(e)=>setText(e.target.value)} style={{width:'100%', height:'150px'}} />
      <input type="password" placeholder="Password (Optional)" value={pass} onChange={(e)=>setPass(e.target.value)} style={{width:'100%', margin:'10px 0'}} />
      <button onClick={handleCreate} style={{width:'100%', padding:'10px'}}>Generate Link</button>
      
      {link && <p style={{background:'#eee', padding:'10px', wordBreak:'break-all'}}>Link: {link}</p>}

      <hr style={{margin:'30px 0'}} />
      <h3>Paste Link to View</h3>
      <input type="text" placeholder="Paste link here..." value={pasteLink} onChange={(e)=>setPasteLink(e.target.value)} style={{width:'100%'}} />
      <button onClick={handleOpenLink} style={{width:'100%', marginTop:'10px'}}>Open Message</button>
    </div>
  );
};

// --- VIEW SCREEN (READ MESSAGE) ---
const View = () => {
  const { id } = useParams();
  const [msg, setMsg] = useState(null);
  const [inputPass, setInputPass] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    get(child(ref(db), 'msgs/' + id)).then(s => {
      if(s.exists()) {
        setMsg(s.val());
        if(!s.val().crypt) setResult(s.val().content);
      }
    });
  }, [id]);

  const decrypt = () => {
    try {
      const bytes = CryptoJS.AES.decrypt(msg.content, inputPass);
      const dec = bytes.toString(CryptoJS.enc.Utf8);
      if (dec) setResult(dec); else alert("Wrong Password");
    } catch (e) { alert("Error"); }
  };

  if (!msg) return <p>Loading...</p>;

  return (
    <div>
      <h2>Shared Message</h2>
      {msg.crypt && !result ? (
        <div>
          <input type="password" placeholder="Enter Password" value={inputPass} onChange={(e)=>setInputPass(e.target.value)} />
          <button onClick={decrypt}>Unlock</button>
        </div>
      ) : (
        <div style={{background:'#f0f0f0', padding:'15px', whiteSpace:'pre-wrap'}}>{result}</div>
      )}
      <button onClick={()=>window.location.href='/'} style={{marginTop:'20px'}}>Create New</button>
    </div>
  );
};

export default App;
