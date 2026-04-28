// Replace YOUR LINK here (Created with personal Gmail, Access: Anyone)
const scriptURL = 'https://script.google.com/macros/s/AKfycbytXOd7q3oxAArpRvJOfQGz4TtXz1JPljLEVdSwMl3nPBG_GbAAU4cFrQ0li3g9sZIA/exec'; 
const SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";

if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(e => console.log(e)); }); }

function getDeviceUUID() {
    let uuid = localStorage.getItem('utc2_device_uuid');
    if (!uuid) { uuid = 'UTC2_DEV_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 12); localStorage.setItem('utc2_device_uuid', uuid); }
    return uuid;
}

function togglePassword(inputId, icon) { const i = document.getElementById(inputId); if (i.type === "password") { i.type = "text"; icon.innerText = "🙈"; } else { i.type = "password"; icon.innerText = "👁️"; } }
function toggleTheme(cb) { if(cb.checked) { document.body.classList.add('dark-mode'); localStorage.setItem('theme', 'dark'); } else { document.body.classList.remove('dark-mode'); localStorage.setItem('theme', 'light'); } }
function applySavedTheme() { if (localStorage.getItem('theme') === 'dark') { document.body.classList.add('dark-mode'); const cb = document.getElementById('checkbox'); if(cb) cb.checked = true; } }
function checkDeviceType() { if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) { document.getElementById('desktop-blocker').style.display = 'flex'; document.getElementById('main-app').style.display = 'none'; } }
checkDeviceType();

window.addEventListener('offline', () => { document.getElementById('offline-banner').style.display = 'block'; });
window.addEventListener('online', () => { document.getElementById('offline-banner').style.display = 'none'; syncOfflineData(); });

async function syncOfflineData() {
    const url = localStorage.getItem('utc2_offline_sync'); if (!url) return; 
    try {
        const res = await fetch(url); const result = await res.json();
        localStorage.removeItem('utc2_offline_sync'); 
        if (result.success) { Swal.fire({ icon: 'success', title: 'Synchronized', text: 'Offline data has been submitted!' }); } 
        else { Swal.fire({ icon: 'error', title: 'Denied', text: result.message }); addHistory("Sync Error", false); }
    } catch (e) { console.log("Weak connection..."); }
}

window.onload = () => {
    applySavedTheme(); syncOfflineData(); 
    const mssv = localStorage.getItem('utc2_mssv'); const name = localStorage.getItem('utc2_name'); const classes = localStorage.getItem('utc2_cached_classes');
    if (mssv && name) {
        showScreen('attendance-screen'); document.getElementById('student-name').innerText = name; document.getElementById('student-mssv').innerText = mssv;
        if (classes) renderClassSelect(JSON.parse(classes)); else document.getElementById('class-select').innerHTML = '<option value="">⏳ Loading classes...</option>';
        fetchClassesBackground(); 
    } else { showScreen('login-screen'); }
};

function showScreen(id) { ['login-screen', 'change-pass-screen', 'attendance-screen'].forEach(s => { document.getElementById(s).style.display = (s === id) ? 'block' : 'none'; }); }
function setStatus(text, type = "normal", isLoad = false) { const el = document.getElementById('status'); el.innerText = text; el.style.color = (type === "error") ? "var(--error)" : (type === "success" ? "var(--success)" : "var(--primary-color)"); document.getElementById('spinner').style.display = isLoad ? "block" : "none"; }

async function handleLogin() {
    const mssv = document.getElementById('login-mssv').value.trim(); const pass = document.getElementById('login-pass').value.trim();
    if (!mssv || !pass) return setStatus("⚠️ Please enter Lecturer ID and Password!", "error");
    setStatus("Verifying...", "normal", true); document.getElementById('btnLogin').disabled = true;
    try {
        const res = await fetch(`${scriptURL}?action=login&mssv=${mssv}&pass=${encodeURIComponent(pass)}`); const data = await res.json();
        if (data.success) {
            localStorage.setItem('temp_mssv', mssv); localStorage.setItem('temp_name', data.name);
            if (data.isFirstLogin) { showScreen('change-pass-screen'); setStatus("Please change your password!", "error"); } else { completeLogin(mssv, data.name); }
        } else { setStatus("❌ " + data.message, "error"); }
    } catch (e) { setStatus("❌ Network Error!", "error"); } finally { document.getElementById('btnLogin').disabled = false; }
}

async function handleChangePass() {
    const p = document.getElementById('new-pass').value.trim();
    if (p.length < 6 || p !== document.getElementById('confirm-pass').value.trim()) return setStatus("⚠️ Incorrect password!", "error");
    setStatus("Updating...", "normal", true);
    try { await fetch(`${scriptURL}?action=changePass&mssv=${localStorage.getItem('temp_mssv')}&newPass=${encodeURIComponent(p)}`); completeLogin(localStorage.getItem('temp_mssv'), localStorage.getItem('temp_name')); } catch (e) { setStatus("❌ Network Error", "error"); }
}

async function forgotPassword() {
    const { value: form } = await Swal.fire({ title: 'Reset Password', html: '<p style="font-size:13px; color:#8a9ba8;">Requires registered device.</p><input id="swal-mssv" class="swal2-input" placeholder="Lecturer ID"><input id="swal-newpass" type="password" class="swal2-input" placeholder="New Password">', focusConfirm: false, showCancelButton: true, confirmButtonText: 'Reset', confirmButtonColor: '#003366', preConfirm: () => { const m = document.getElementById('swal-mssv').value.trim(); const p = document.getElementById('swal-newpass').value.trim(); if (!m || p.length < 6) { Swal.showValidationMessage('Please fill in all fields!'); return false; } return { m, p }; } });
    if (form) {
        setStatus("Verifying...", "normal", true);
        try { const res = await fetch(`${scriptURL}?action=resetPassByDevice&mssv=${form.m}&newPass=${encodeURIComponent(form.p)}&deviceId=${getDeviceUUID()}`); const data = await res.json(); if (data.success) { Swal.fire('Success!', 'Password reset successfully.', 'success'); } else { Swal.fire('Error', data.message, 'error'); } } catch (e) { Swal.fire('Error', 'Connection failed', 'error'); } finally { setStatus("Ready", "normal", false); }
    }
}

function completeLogin(m, n) { localStorage.setItem('utc2_mssv', m); localStorage.setItem('utc2_name', n); window.location.reload(); }
function logout() { Swal.fire({ title: 'Logout?', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'Cancel' }).then(r => { if (r.isConfirmed) { ['utc2_mssv', 'utc2_name', 'utc2_cached_classes'].forEach(k => localStorage.removeItem(k)); window.location.reload(); } }); }

async function fetchClassesBackground() { try { const res = await fetch(`${scriptURL}?action=getClasses`); const data = await res.json(); if (data.success) { localStorage.setItem('utc2_cached_classes', JSON.stringify(data.classes)); renderClassSelect(data.classes); } } catch(e){} }
function renderClassSelect(arr) { const sel = document.getElementById('class-select'); sel.innerHTML = '<option value="">-- Select class --</option>'; arr.forEach(c => { sel.innerHTML += `<option value="${c}">📚 ${c}</option>`; }); }

async function handleAttendance() {
    const mssv = localStorage.getItem('utc2_mssv'); const classId = document.getElementById('class-select').value; const btn = document.getElementById('btnSubmit');
    if (!classId) return setStatus("⚠️ Select a class!", "error");
    try {
        btn.disabled = true; setStatus("🔍 Scanning Station...", "normal", true); const dId = getDeviceUUID();
        const dev = await navigator.bluetooth.requestDevice({ filters: [{ name: 'TRAM-DIEM-DANH' }], optionalServices: [SERVICE_UUID] });
        const srv = await dev.gatt.connect(); const char = await (await srv.getPrimaryService(SERVICE_UUID)).getCharacteristic(CHAR_UUID);
        const chal = Math.floor(Math.random() * 9000) + 1000; await char.writeValue(new TextEncoder().encode(chal.toString()));
        const resp = new TextDecoder().decode(await char.readValue()); dev.gatt.disconnect();
        
        setStatus("☁️ Syncing to Server...", "normal", true);
        const url = `${scriptURL}?action=checkin&classId=${encodeURIComponent(classId)}&mssv=${mssv}&challenge=${chal}&response=${resp}&deviceId=${dId}`;
        try {
            const res = await fetch(url); const result = await res.json(); btn.disabled = false;
            if (result.success) { setStatus("🎉 Success", "success"); addHistory(classId, true); Swal.fire('Success!', result.message, 'success'); } 
            else { setStatus("⚠️ Error", "error"); addHistory(classId, false); Swal.fire('Warning!', result.message, 'error'); }
        } catch (e) { btn.disabled = false; localStorage.setItem('utc2_offline_sync', url); setStatus("📥 Saved Offline", "error"); addHistory(classId + " (Offline)", true); Swal.fire('Weak Network!', 'Saved Offline.', 'warning'); }
    } catch (e) { btn.disabled = false; set
