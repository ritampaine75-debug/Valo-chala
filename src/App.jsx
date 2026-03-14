import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child } from "firebase/database";
import CryptoJS from 'crypto-js';

// --- FIREBASE CONFIG ---
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

// --- STYLES ---
const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '20px', minHeight: '100vh' },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  },
  input: {
    width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333',
    borderRadius: '8px', color: '#fff', marginBottom: '15px', fontSize: '16px', boxSizing: 'border-box'
  },
  button: {
    width: '100%', padding: '14px', background: '#fff', color: '#000',
    border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.3s'
  },
  pwaBtn: {
    width: '100%', padding: '12px', background: 'linear-gradient(45deg, #0070f3, #00a4ff)',
    color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '20px'
  },
  text: { fontSize: '14px', color: '#888', marginBottom: '8px' }
};

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
      <div style={styles.container}>
        {showInstall && (
          <button onClick={installApp} style={styles.pwaBtn}>INSTALL APP</button>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/message/:id" element={<View />} />
        </Routes>
      </div>
    </Router>
  );
}

const Home = () => {
  const [text, setText] = useState('');
  const [pass, setPass] = useState('');
  const [link, setLink] = useState('');
  const [pasteLink, setPasteLink] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!text) return;
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
    <div style={styles.card}>
      <h2 style={{marginTop: 0, fontWeight: 600}}>SECURE SHARE</h2>
      <p style={styles.text}>MESSAGE</p>
      <textarea placeholder="Type your text..." value={text} onChange={(e)=>setText(e.target.value)} 
        style={{...styles.input, height: '120px', resize: 'none'}} />
      
      <p style={styles.text}>PASSWORD (OPTIONAL)</p>
      <input type="password" placeholder="Min 6 characters" value={pass} onChange={(e)=>setPass(e.target.value)} style={styles.input} />
      
      <button onClick={handleCreate} style={styles.button}>CREATE SECURE LINK</button>
      
      {link && (
        <div style={{marginTop: '20px', padding: '10px', background: '#000', borderRadius: '8px', wordBreak: 'break-all'}}>
          <p style={{...styles.text, color: '#0070f3'}}>SHARE LINK:</p>
          <code style={{fontSize: '13px'}}>{link}</code>
        </div>
      )}

      <div style={{height: '1px', background: '#333', margin: '30px 0'}}></div>

      <p style={styles.text}>ALREADY HAVE A LINK?</p>
      <input type="text" placeholder="Paste link here..." value={pasteLink} onChange={(e)=>setPasteLink(e.target.value)} style={styles.input} />
      <button onClick={handleOpenLink} style={{...styles.button, background: 'transparent', border: '1px solid #333', color: '#fff'}}>OPEN MESSAGE</button>
    </div>
  );
};

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
    } catch (e) { alert("Error decrypting"); }
  };

  if (!msg) return <div style={styles.card}>Loading secure data...</div>;

  return (
    <div style={styles.card}>
      <h2 style={{marginTop: 0}}>READ MESSAGE</h2>
      {msg.crypt && !result ? (
        <div>
          <p style={styles.text}>THIS MESSAGE IS ENCRYPTED</p>
          <input type="password" placeholder="Enter Password" value={inputPass} onChange={(e)=>setInputPass(e.target.value)} style={styles.input} />
          <button onClick={decrypt} style={styles.button}>DECRYPT</button>
        </div>
      ) : (
        <div style={{background: '#111', padding: '20px', borderRadius: '8px', whiteSpace: 'pre-wrap', border: '1px solid #222'}}>
          {result}
        </div>
      )}
      <button onClick={()=>window.location.href='/'} style={{...styles.button, marginTop: '20px', background: '#222', color: '#fff'}}>BACK HOME</button>
    </div>
  );
};

export default App;
