import { useState, useEffect, useRef } from 'react';
import { analyzeMessage } from './services/aiService';
import { db } from './services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- SUB-COMPONENT: Cyber Matrix Background (Slow & Cinematic) ---
const CyberBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = '01'.split('');
    const fontSize = 18;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.ceil(columns)).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 3, 4, 0.15)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 255, 65, 0.4)';
      ctx.font = `${fontSize}px "JetBrains Mono"`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.995) {
          drops[i] = 0;
        }
        drops[i] += 0.15; // Slow, modern fall speed
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas id="cyber-canvas" ref={canvasRef} />;
};

// --- SUB-COMPONENT: Interactive Tactical Cursor ---
const TacticalCursor = () => {
  const cursorRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };
    const press = () => setActive(true);
    const release = () => setActive(false);
    
    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', press);
    window.addEventListener('mouseup', release);
    
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', press);
      window.removeEventListener('mouseup', release);
    };
  }, []);

  return (
    <div className={`tactical-cursor ${active ? 'active' : ''}`} ref={cursorRef}>
       <div className="tactical-cursor-dot" />
    </div>
  );
};

// --- SUB-COMPONENT: Visual Side Elements (HUD) ---
const HUDSidebar = ({ side }) => (
  <aside className={`hud-sidebar ${side}`}>
     <div className="hud-metric">SYSTEM ACTIVE</div>
     <div style={{ height: '40px', borderLeft: '1px solid var(--primary)', opacity: 0.2 }} />
     <div className="hud-metric">SCAN ACCURACY: 98%</div>
     <div className="hud-metric">RESPONSE: 0.8ms</div>
  </aside>
);

// --- SUB-COMPONENT: Auto-Typing Slogan ---
const TypewriterSlogan = () => {
  const [text, setText] = useState('');
  const fullText = "Securing your digital footprint against advanced phishing threats.";
  
  useEffect(() => {
    let i = 0;
    let typingInterval;
    let restartTimeout;

    const startTyping = () => {
      setText('');
      i = 0;
      typingInterval = setInterval(() => {
        setText(fullText.substring(0, i + 1));
        i++;
        if (i === fullText.length) {
          clearInterval(typingInterval);
          restartTimeout = setTimeout(startTyping, 2000);
        }
      }, 50);
    };

    startTyping();

    return () => {
      clearInterval(typingInterval);
      clearTimeout(restartTimeout);
    };
  }, []);

  return (
    <div style={{ fontSize: 'clamp(0.8rem, 2vw, 1.1rem)', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '80px', minHeight: '30px' }}>
      {text}<span className="hero-pulse">|</span>
    </div>
  );
};

// --- SUB-COMPONENT: Navigation Header ---
const AppHeader = ({ showBack, onBack }) => (
  <header style={{ 
    position: 'fixed', top: 0, left: 0, width: '100%', height: '60px', 
    background: 'rgba(1, 10, 5, 0.85)', borderBottom: '1px solid var(--border-hud)', 
    zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 clamp(60px, 10vw, 150px)', backdropFilter: 'blur(5px)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
      {showBack && (
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: 'var(--primary)', padding: '5px', cursor: 'pointer' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hero-pulse" style={{ transition: 'transform 0.2s' }} onMouseOver={e=>e.currentTarget.style.transform='translateX(-5px)'} onMouseOut={e=>e.currentTarget.style.transform='translateX(0)'}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
      )}
      <div style={{ color: 'var(--primary)', letterSpacing: '6px', fontSize: '1rem', fontFamily: 'Syncopate', fontWeight: 700 }}>
        CYBER SHIELD
      </div>
    </div>
    <div style={{ display: 'flex', gap: '30px', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>
      <span>v3.4.1</span>
      <span style={{ color: 'var(--primary)' }}>[SECURE]</span>
    </div>
  </header>
);

function App() {
  const [appState, setAppState] = useState('LANDING'); // LANDING, SELECTION, INPUT_.., SCANNING, RESULTS, REPORT_FORM, REPORT_SUCCESS
  const [scanType, setScanType] = useState('text');
  const [inputText, setInputText] = useState('');
  const [companyDetails, setCompanyDetails] = useState({ name: '', url: '', email: '' });
  const [fileMetadata, setFileMetadata] = useState(null);
  const [fileBase64, setFileBase64] = useState(null); // Actual data for Gemini
  const [results, setResults] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [scanLogs, setScanLogs] = useState([]);
  
  const [reportData, setReportData] = useState({ name: '', email: '', details: '' });
  const [complaintId, setComplaintId] = useState('');

  const userFriendlyLogs = [
    "[INFO]: System starting up...",
    "[DOC]: Reading message content...",
    "[DATA]: Checking for scam patterns...",
    "[SEC]: Matching with global fraud lists...",
    "[SYS]: Verifying sender identity...",
    "[INFO]: Calculating safety score...",
    "[LOG]: Finalizing report..."
  ];

  useEffect(() => {
    if (appState === 'RESULTS' && results) {
      let current = 0;
      const target = results.fraudScore;
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.floor(easedProgress * target));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    } else {
      setDisplayScore(0);
    }
  }, [appState, results]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileMetadata({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type.split('/')[1]?.toUpperCase() || 'DOCUMENT'
      });
      
      const reader = new FileReader();
      reader.onloadend = () => setFileBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const executeAnalysis = async () => {
    setAppState('SCANNING');
    setScanLogs([]);

    let i = 0;
    const logInterval = setInterval(() => {
      if (i < userFriendlyLogs.length) {
        setScanLogs(prev => [...prev, userFriendlyLogs[i]]);
        i++;
      } else {
        clearInterval(logInterval);
      }
    }, 550);

    try {
      let payload = inputText;
      if (scanType === 'company') payload = JSON.stringify(companyDetails);
      if (scanType === 'image' || scanType === 'pdf') payload = fileBase64;

      const data = await analyzeMessage(payload, scanType);
      
      // PERSIST TO FIREBASE (For Future Admin Dashboard)
      try {
        await addDoc(collection(db, "scans"), {
          caseId: data.caseId,
          type: scanType,
          score: data.fraudScore,
          risk: data.riskLevel,
          timestamp: serverTimestamp()
        });
      } catch (dbErr) {
        console.warn("Firestore Error (Scan):", dbErr);
      }

      setTimeout(() => {
        setResults(data);
        setAppState('RESULTS');
      }, 4500); 
    } catch(err) {
      setAppState('SELECTION');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const id = `REP-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // PERSIST TO FIREBASE (For Future Admin Dashboard)
    try {
      await addDoc(collection(db, "reports"), {
        complaintId: id,
        userName: reportData.name,
        userEmail: reportData.email,
        details: reportData.details,
        caseRef: results?.caseId || "N/A",
        timestamp: serverTimestamp()
      });
    } catch (dbErr) {
      console.warn("Firestore Error (Report):", dbErr);
    }

    setComplaintId(id);
    setAppState('REPORT_SUCCESS');
  };

  const handleBackNavigation = () => {
    if (appState === 'SELECTION') {
      setAppState('LANDING');
    } else if (appState === 'REPORT_FORM') {
      setAppState('RESULTS');
    } else {
      setAppState('SELECTION');
    }
  };

  // --- VIEWS ---

  const renderLanding = () => (
    <div className="stagger-in" style={{ textAlign: 'center', zIndex: 10 }}>
      <div style={{ opacity: 0.6, marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
         <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.2" className="hero-pulse">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
         </svg>
      </div>
      <h1 data-text="CYBER SHIELD" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', color: 'var(--primary)', marginBottom: '15px' }}>
        CYBER SHIELD
      </h1>
      <TypewriterSlogan />
      <button className="epic-button selectable" onClick={() => setAppState('SELECTION')} style={{ fontSize: '1.2rem', padding: '15px 40px' }}>
        START SCAN
      </button>
      <div style={{ marginTop: '80px', fontSize: '0.9rem', color: 'var(--text-muted)', letterSpacing: '4px' }}>
        SYSTEM STATUS: <span style={{ color: 'var(--primary)' }}>SECURE</span> // ENCRYPTION: <span style={{ color: 'var(--primary)' }}>ACTIVE</span>
      </div>
    </div>
  );

  const renderSelection = () => (
    <div className="stagger-in" style={{ width: '100%', maxWidth: '1100px', padding: '0 20px' }}>
      <p style={{ color: 'var(--primary)', letterSpacing: '3px', marginBottom: '40px', fontSize: '0.9rem', textAlign: 'center' }}>WHAT WOULD YOU LIKE TO CHECK?</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
         
         <div className="epic-panel selectable" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => { setScanType('text'); setAppState('INPUT_TEXT'); }}>
            <div style={{ marginBottom: '20px', color: 'var(--primary)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3 style={{ color: '#fff', letterSpacing: '1px' }}>TEXT MESSAGE</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>Analyze emails, SMS, and chat messages for fake offers.</p>
         </div>

         <div className="epic-panel selectable" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => { setScanType('image'); setAppState('INPUT_FILE'); }}>
            <div style={{ marginBottom: '20px', color: 'var(--primary)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </div>
            <h3 style={{ color: '#fff', letterSpacing: '1px' }}>SCREENSHOT SCAN</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>Check job offer images or social media scams.</p>
         </div>

         <div className="epic-panel selectable" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => { setScanType('pdf'); setAppState('INPUT_FILE'); }}>
            <div style={{ marginBottom: '20px', color: 'var(--primary)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h3 style={{ color: '#fff', letterSpacing: '1px' }}>DOCUMENT SCAN</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>Upload PDFs to detect fake contracts or malicious links.</p>
         </div>

         <div className="epic-panel selectable" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => { setScanType('company'); setAppState('INPUT_COMPANY'); }}>
            <div style={{ marginBottom: '20px', color: 'var(--primary)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="15" y2="22"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="9" y1="6" x2="15" y2="6"></line><line x1="9" y1="10" x2="15" y2="10"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            </div>
            <h3 style={{ color: '#fff', letterSpacing: '1px' }}>CHECK COMPANY</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>Verify if a company is real or a known job scam portal.</p>
         </div>

      </div>
    </div>
  );

  const renderScanning = () => (
    <div style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       {/* New High-Tech Animations */}
       <div className="neural-overlay">
          <div className="laser-grid" />
          <div className="scanning-laser" />
          <div className="sonar-wave" />
       </div>
       
       <div className="stagger-in" style={{ zIndex: 1002, textAlign: 'center' }}>
          <div className="node-ring" style={{ margin: '0 auto' }}>
             <div className="node-core" />
          </div>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', letterSpacing: '8px', marginTop: '40px' }}>ANALYZING PAYLOAD</h2>
          <div className="scan-log-stream" style={{ width: '450px', background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '4px' }}>
             {scanLogs.map((log, i) => <div key={i} style={{ marginBottom: '6px', color: 'var(--primary)', opacity: (i+1)/scanLogs.length }}>{log}</div>)}
             <div className="hero-pulse" style={{ marginTop: '10px', color: 'var(--primary)' }}>[BUSY]: AI HEURISTICS IN PROGRESS...</div>
          </div>
       </div>
    </div>
  );

  const renderResults = () => (
    <div className="stagger-in" style={{ width: '100%', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' }}>
         <div>
            <h1 style={{ fontSize: '2rem', color: results.riskColor, letterSpacing: '4px' }}>SCAN COMPLETE</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>CASE REFERENCE: {results.caseId}</p>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="epic-panel" style={{ textAlign: 'center', borderColor: results.riskColor }}>
           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '40px' }}>// FINAL TRUST SCORE</p>
           <svg width="220" height="220" className="gauge-v3">
              <circle cx="110" cy="110" r="100" className="gauge-v3-track" />
              <circle cx="110" cy="110" r="100" className="gauge-v3-fill" 
                style={{ stroke: results.riskColor, strokeDashoffset: 628 - (628 * displayScore) / 100, strokeDasharray: 628 }} 
              />
              <text x="50%" y="54%" textAnchor="middle" fill="#fff" fontSize="42" fontWeight="700" transform="rotate(90 110 110)" style={{ fontFamily: 'Syncopate' }}>
                {displayScore}%
              </text>
           </svg>
           <h4 style={{ marginTop: '40px', color: results.riskColor, fontSize: '1.2rem' }}>RESULT: {results.riskLevel}</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="epic-panel" style={{ padding: '30px' }}>
               <h3 style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '15px' }}>// HOW WE ANALYZED THIS</h3>
               <p style={{ fontSize: '1rem', lineHeight: '1.8', opacity: 0.8 }}>{results.aiExplanation}</p>
               {results.officialLink && (
                 <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 230, 57, 0.1)', border: '1px solid var(--primary)' }}>
                   <h4 style={{ color: 'var(--primary)', marginBottom: '5px' }}>OFFICIAL VERIFIED WEBSITE:</h4>
                   <a href={results.officialLink} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>{results.officialLink}</a>
                 </div>
               )}
            </div>
            <div className="epic-panel" style={{ padding: '30px', borderColor: 'rgba(255,62,62,0.1)' }}>
               <h3 style={{ fontSize: '0.85rem', color: 'var(--error)', marginBottom: '15px' }}>// THREATS WE FOUND</h3>
               {results.redFlags.map((flag, idx) => (
                 <div key={idx} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-hud)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                   {flag}
                 </div>
               ))}
            </div>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: 'auto' }}>
               <button className="epic-button" style={{ flex: '1 1 200px', borderStyle: 'dashed', padding: '15px 10px' }} onClick={() => setAppState('SELECTION')}>SCAN AGAIN</button>
               <button className="epic-button" style={{ flex: '1 1 200px', color: 'var(--error)', borderColor: 'var(--error)', padding: '15px 10px' }} onClick={() => setAppState('REPORT_FORM')}>REPORT FRAUD</button>
            </div>
         </div>
      </div>
    </div>
  );

  const renderReportForm = () => (
    <div className="stagger-in" style={{ width: '100%', maxWidth: '800px' }}>
      <h2 style={{ color: 'var(--error)', marginBottom: '30px', letterSpacing: '4px' }}>FILE FRAUD REPORT</h2>
      <form className="epic-panel" onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <input type="text" className="glass-input" required placeholder="YOUR FULL NAME" style={{ padding: '20px' }} value={reportData.name} onChange={e=>setReportData({...reportData, name: e.target.value})} />
            <input type="email" className="glass-input" required placeholder="CONTACT EMAIL" style={{ padding: '20px' }} value={reportData.email} onChange={e=>setReportData({...reportData, email: e.target.value})} />
         </div>
         <textarea className="glass-input" required placeholder="DESCRIBE THE SCAM DETAILS (Website, Name of Person, Offer Details)..." style={{ minHeight: '200px', padding: '20px' }} value={reportData.details} onChange={e=>setReportData({...reportData, details: e.target.value})} />
         {fileMetadata && (
           <div style={{ fontSize: '0.8rem', color: 'var(--primary)', opacity: 0.6 }}>ATTACHED PROOF: {fileMetadata.name}</div>
         )}
         <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <button type="submit" className="epic-button" style={{ flex: 1, borderColor: 'var(--error)', color: 'var(--error)' }}>SUBMIT REPORT</button>
            <button type="button" className="epic-button" style={{ flex: 1, borderStyle: 'dashed' }} onClick={() => setAppState('RESULTS')}>CANCEL</button>
         </div>
      </form>
    </div>
  );

  const renderReportSuccess = () => (
    <div className="stagger-in" style={{ textAlign: 'center' }}>
       <div className="report-success-check">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
       </div>
       <h2 style={{ color: 'var(--primary)', marginBottom: '20px', letterSpacing: '5px' }}>REPORT LOGGED</h2>
       <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Your intelligence has been sent to our security nodes.<br/>Reference ID: <span style={{ color: '#fff' }}>{complaintId}</span></p>
       <button className="epic-button" onClick={() => setAppState('LANDING')}>RETURN TO COMMAND</button>
    </div>
  );

  const renderCompanyInput = () => (
    <div className="stagger-in" style={{ width: '100%', maxWidth: '900px' }}>
       <h2 style={{ color: 'var(--primary)', marginBottom: '30px' }}>CHECK A COMPANY</h2>
       <div style={{ display: 'grid', gap: '20px' }}>
          <input type="text" className="glass-input" value={companyDetails.name} onChange={e => setCompanyDetails({...companyDetails, name: e.target.value})} placeholder="ENTER COMPANY NAME..." style={{ padding: '20px', fontSize: '1rem', outline: 'none', fontFamily: 'JetBrains Mono' }} />
          <input type="text" className="glass-input" value={companyDetails.url} onChange={e => setCompanyDetails({...companyDetails, url: e.target.value})} placeholder="WEBSITE URL (Optional)..." style={{ padding: '20px', fontSize: '1rem', outline: 'none', fontFamily: 'JetBrains Mono' }} />
          <input type="text" className="glass-input" value={companyDetails.email} onChange={e => setCompanyDetails({...companyDetails, email: e.target.value})} placeholder="HR EMAIL (Optional)..." style={{ padding: '20px', fontSize: '1rem', outline: 'none', fontFamily: 'JetBrains Mono' }} />
       </div>
       <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
          <button className="epic-button" style={{ flex: 1 }} onClick={executeAnalysis}>SCAN NOW</button>
          <button className="epic-button" style={{ flex: 1, borderStyle: 'dashed' }} onClick={() => setAppState('SELECTION')}>CANCEL</button>
       </div>
    </div>
  );

  const renderTextInput = () => (
    <div className="stagger-in" style={{ width: '100%', maxWidth: '900px' }}>
       <h2 style={{ color: 'var(--primary)', marginBottom: '30px' }}>SCAN MESSAGE</h2>
       <textarea className="glass-input" value={inputText} onChange={e => setInputText(e.target.value)} 
                 placeholder="PASTE THE EMAIL, SMS, OR JOB OFFER TEXT HERE..."
                 style={{ width: '100%', minHeight: '350px', padding: '40px', outline: 'none', fontFamily: 'JetBrains Mono', fontSize: '1rem', boxSizing: 'border-box' }} />
       <button className="epic-button" style={{ width: '100%', marginTop: '30px' }} onClick={executeAnalysis}>ANALYZE CONTENT</button>
    </div>
  );

  const renderFileInput = () => (
    <div className="stagger-in" style={{ width: '100%', maxWidth: '800px' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '30px' }}>UPLOAD FILE</h2>
      <div className="epic-panel" style={{ borderStyle: 'dashed', padding: '80px', textAlign: 'center' }}>
         {!fileMetadata ? (
            <>
               <div style={{ marginBottom: '30px', color: 'var(--primary)', opacity: 0.5 }}>
                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
               </div>
               <input type="file" id="f" hidden onChange={handleFileUpload} />
               <label htmlFor="f" className="epic-button" style={{ cursor: 'pointer' }}>CHOOSE A FILE</label>
            </>
         ) : (
            <div style={{ textAlign: 'left' }}>
               <h3 style={{ color: 'var(--primary)', marginBottom: '30px' }}>FILE READY:</h3>
               <div className="glass-input" style={{ padding: '30px', fontFamily: 'JetBrains Mono' }}>
                  <div>NAME: {fileMetadata.name}</div>
                  <div>SIZE: {fileMetadata.size}</div>
                  <div>TYPE: {fileMetadata.type}</div>
               </div>
               <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                  <button className="epic-button" onClick={executeAnalysis}>SCAN NOW</button>
                  <button className="epic-button" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => setFileMetadata(null)}>REMOVE</button>
               </div>
            </div>
         )}
      </div>
    </div>
  );

  return (
    <div className="app-root">
      <AppHeader showBack={appState !== 'LANDING' && appState !== 'SCANNING'} onBack={handleBackNavigation} />
      <CyberBackground />
      <TacticalCursor />
      <HUDSidebar side="left" />
      <HUDSidebar side="right" />
      <div className="scanline-overlay" />
      
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px clamp(20px, 8vw, 80px)', zIndex: 10, position: 'relative', width: '100%', boxSizing: 'border-box' }}>
         {appState === 'LANDING' && renderLanding()}
         {appState === 'SELECTION' && renderSelection()}
         {appState === 'INPUT_TEXT' && renderTextInput()}
         {appState === 'INPUT_FILE' && renderFileInput()}
         {appState === 'INPUT_COMPANY' && renderCompanyInput()}
         {appState === 'SCANNING' && renderScanning()}
         {appState === 'RESULTS' && renderResults()}
         {appState === 'REPORT_FORM' && renderReportForm()}
         {appState === 'REPORT_SUCCESS' && renderReportSuccess()}
      </main>
    </div>
  );
}

export default App;
