import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { api, loggedIn, photoUrl, setToken } from "./api.js";

const SECT = { sunni: "Sunni", shia: "Shia", other: "Other" };
const PRAYER = { regular: "Prays regularly", sometimes: "Sometimes", rarely: "Rarely" };
const MARITAL = { never: "Never married", divorced: "Divorced", widowed: "Widowed" };

function Layout({ children }) {
  const nav = useNavigate();
  const out = () => { setToken(null); nav("/"); };
  return (
    <>
      <header className="bar">
        <Link to="/" className="logo">Nikah Match</Link>
        <nav>
          {loggedIn() ? (<>
            <Link to="/browse">Find matches</Link>
            <Link to="/interests">Interests</Link>
            <Link to="/profile">My profile</Link>
            <button className="link" onClick={out}>Log out</button>
          </>) : (<>
            <Link to="/login">Log in</Link>
            <Link to="/register" className="btn small">Join free</Link>
          </>)}
        </nav>
      </header>
      <main>{children}</main>
      <footer>Meet with your family's knowledge. Never share money or bank details with someone you have not met.</footer>
    </>
  );
}

const Private = ({ children }) => (loggedIn() ? children : <Navigate to="/login" replace />);

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Home() {
  return (
    <section className="hero">
      <div>
        <h1>Find a spouse who shares your faith and your values.</h1>
        <p>Create a profile, browse matches by sect, prayer and city, and send an interest. Both sides must agree before anything else is shared.</p>
        <Link to="/register" className="btn">Create your profile</Link>
      </div>
      <ul className="points">
        <li><b>Profiles for 18+ only</b> Men see women and women see men.</li>
        <li><b>You decide who you hear from</b> Interests need your acceptance.</li>
        <li><b>Hide your profile any time</b> Pause your search from My profile.</li>
      </ul>
    </section>
  );
}

function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({ full_name: "", username: "", email: "", password: "", gender: "M", date_of_birth: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await api("/auth/register/", { method: "POST", body: f });
      const t = await api("/auth/login/", { method: "POST", body: { username: f.username, password: f.password } });
      setToken(t.access); nav("/profile");
    } catch (x) { setErr(x.message); }
  };
  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>Create your profile</h2>
      <Field label="Full name"><input required value={f.full_name} onChange={set("full_name")} /></Field>
      <Field label="I am a">
        <select value={f.gender} onChange={set("gender")}><option value="M">Man</option><option value="F">Woman</option></select>
      </Field>
      <Field label="Date of birth"><input type="date" required value={f.date_of_birth} onChange={set("date_of_birth")} /></Field>
      <Field label="Username"><input required value={f.username} onChange={set("username")} /></Field>
      <Field label="Email"><input type="email" required value={f.email} onChange={set("email")} /></Field>
      <Field label="Password (8+ characters)"><input type="password" minLength={8} required value={f.password} onChange={set("password")} /></Field>
      {err && <p className="err">{err}</p>}
      <button className="btn">Create profile</button>
      <p className="muted">Already a member? <Link to="/login">Log in</Link></p>
    </form>
  );
}

function Login() {
  const nav = useNavigate();
  const [f, setF] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      const t = await api("/auth/login/", { method: "POST", body: f });
      setToken(t.access); nav("/browse");
    } catch { setErr("Username or password is incorrect."); }
  };
  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>Log in</h2>
      <Field label="Username"><input required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></Field>
      <Field label="Password"><input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
      {err && <p className="err">{err}</p>}
      <button className="btn">Log in</button>
      <p className="muted">New here? <Link to="/register">Create a profile</Link></p>
    </form>
  );
}

function Avatar({ p }) {
  const src = photoUrl(p.photo);
  return src ? <img className="avatar" src={src} alt="" /> : <div className="avatar ph">{p.full_name[0]}</div>;
}

function Browse() {
  const [q, setQ] = useState({ sect: "", prayer: "", marital_status: "", city: "", min_age: "", max_age: "" });
  const [list, setList] = useState(null);
  const load = () => {
    const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v)).toString();
    api(`/profiles/?${qs}`).then(setList).catch(() => setList([]));
  };
  useEffect(load, []);
  const set = (k) => (e) => setQ({ ...q, [k]: e.target.value });
  return (
    <div className="split">
      <form className="card filters" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <h3>Filter matches</h3>
        <Field label="Sect"><select value={q.sect} onChange={set("sect")}><option value="">Any</option>{Object.entries(SECT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Prayer"><select value={q.prayer} onChange={set("prayer")}><option value="">Any</option>{Object.entries(PRAYER).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Marital status"><select value={q.marital_status} onChange={set("marital_status")}><option value="">Any</option>{Object.entries(MARITAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="City"><input value={q.city} onChange={set("city")} /></Field>
        <div className="row"><Field label="Age from"><input type="number" min="18" value={q.min_age} onChange={set("min_age")} /></Field><Field label="to"><input type="number" min="18" value={q.max_age} onChange={set("max_age")} /></Field></div>
        <button className="btn">Show matches</button>
      </form>
      <div className="grid">
        {list === null && <p className="muted">Loading matches…</p>}
        {list && list.length === 0 && <p className="muted">No matches yet. Widen your filters or check back soon.</p>}
        {list && list.map((p) => (
          <Link key={p.id} to={`/profiles/${p.id}`} className="card person">
            <Avatar p={p} />
            <div>
              <h3>{p.full_name}, {p.age}</h3>
              <p>{[p.profession, p.city].filter(Boolean).join(", ")}</p>
              <p className="muted">{SECT[p.sect]} · {PRAYER[p.prayer]}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProfileView() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { api(`/profiles/${id}/`).then(setP).catch((e) => setMsg(e.message)); }, [id]);
  const send = async () => {
    try { const r = await api("/interests/", { method: "POST", body: { to: p.id } }); setMsg(r.detail); }
    catch (e) { setMsg(e.message); }
  };
  if (!p) return <p className="muted">{msg || "Loading…"}</p>;
  const rows = [["Marital status", MARITAL[p.marital_status]], ["Sect", SECT[p.sect]], ["Prayer", PRAYER[p.prayer]],
    ["Education", p.education], ["Profession", p.profession], ["Height", p.height_cm && `${p.height_cm} cm`], ["Location", [p.city, p.country].filter(Boolean).join(", ")]];
  return (
    <div className="card wide">
      <div className="person"><Avatar p={p} /><h2>{p.full_name}, {p.age}</h2></div>
      <dl>{rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {p.about && <><h3>About</h3><p>{p.about}</p></>}
      {p.looking_for && <><h3>Looking for</h3><p>{p.looking_for}</p></>}
      <button className="btn" onClick={send}>Send interest</button>
      {msg && <p className="ok">{msg}</p>}
    </div>
  );
}

function MyProfile() {
  const [p, setP] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { api("/me/").then(setP); }, []);
  if (!p) return <p className="muted">Loading…</p>;
  const set = (k) => (e) => setP({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const save = async (e) => {
    e.preventDefault(); setMsg("");
    const fd = new FormData();
    ["full_name", "marital_status", "sect", "prayer", "city", "country", "education", "profession", "about", "looking_for"].forEach((k) => fd.append(k, p[k] ?? ""));
    if (p.height_cm) fd.append("height_cm", p.height_cm);
    fd.append("is_visible", p.is_visible);
    if (photo) fd.append("photo", photo);
    try { setP(await api("/me/", { method: "PATCH", form: fd })); setMsg("Profile saved."); }
    catch (x) { setMsg(x.message); }
  };
  const opts = (o) => Object.entries(o).map(([k, v]) => <option key={k} value={k}>{v}</option>);
  return (
    <form className="card wide" onSubmit={save}>
      <h2>My profile</h2>
      <div className="row"><Avatar p={p} /><Field label="Photo"><input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} /></Field></div>
      <Field label="Full name"><input value={p.full_name} onChange={set("full_name")} /></Field>
      <div className="row">
        <Field label="Marital status"><select value={p.marital_status} onChange={set("marital_status")}>{opts(MARITAL)}</select></Field>
        <Field label="Sect"><select value={p.sect} onChange={set("sect")}>{opts(SECT)}</select></Field>
        <Field label="Prayer"><select value={p.prayer} onChange={set("prayer")}>{opts(PRAYER)}</select></Field>
      </div>
      <div className="row">
        <Field label="City"><input value={p.city} onChange={set("city")} /></Field>
        <Field label="Country"><input value={p.country} onChange={set("country")} /></Field>
        <Field label="Height (cm)"><input type="number" value={p.height_cm ?? ""} onChange={set("height_cm")} /></Field>
      </div>
      <div className="row">
        <Field label="Education"><input value={p.education} onChange={set("education")} /></Field>
        <Field label="Profession"><input value={p.profession} onChange={set("profession")} /></Field>
      </div>
      <Field label="About me"><textarea rows="4" value={p.about} onChange={set("about")} /></Field>
      <Field label="What I am looking for"><textarea rows="4" value={p.looking_for} onChange={set("looking_for")} /></Field>
      <label className="check"><input type="checkbox" checked={p.is_visible} onChange={set("is_visible")} /> Show my profile to others</label>
      <button className="btn">Save profile</button>
      {msg && <p className="ok">{msg}</p>}
    </form>
  );
}

function Interests() {
  const [d, setD] = useState(null);
  const load = () => api("/interests/").then(setD);
  useEffect(() => { load(); }, []);
  const respond = async (id, status) => { await api(`/interests/${id}/`, { method: "PATCH", body: { status } }); load(); };
  if (!d) return <p className="muted">Loading…</p>;
  return (
    <div className="split2">
      <section>
        <h2>Received</h2>
        {d.received.length === 0 && <p className="muted">No interests yet. A complete profile with a photo gets more.</p>}
        {d.received.map((i) => (
          <div key={i.id} className="card person">
            <Avatar p={i.sender_profile} />
            <div>
              <Link to={`/profiles/${i.sender_profile.id}`}><h3>{i.sender_profile.full_name}, {i.sender_profile.age}</h3></Link>
              {i.status === "pending"
                ? <div className="row"><button className="btn small" onClick={() => respond(i.id, "accepted")}>Accept</button><button className="btn small ghost" onClick={() => respond(i.id, "declined")}>Decline</button></div>
                : <span className={`tag ${i.status}`}>{i.status}</span>}
            </div>
          </div>
        ))}
      </section>
      <section>
        <h2>Sent</h2>
        {d.sent.length === 0 && <p className="muted">You have not sent any interests. Start with Find matches.</p>}
        {d.sent.map((i) => (
          <div key={i.id} className="card person">
            <Avatar p={i.receiver_profile} />
            <div><Link to={`/profiles/${i.receiver_profile.id}`}><h3>{i.receiver_profile.full_name}, {i.receiver_profile.age}</h3></Link><span className={`tag ${i.status}`}>{i.status}</span></div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/browse" element={<Private><Browse /></Private>} />
        <Route path="/profiles/:id" element={<Private><ProfileView /></Private>} />
        <Route path="/profile" element={<Private><MyProfile /></Private>} />
        <Route path="/interests" element={<Private><Interests /></Private>} />
      </Routes>
    </Layout>
  );
}
