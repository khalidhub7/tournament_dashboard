import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  // Tournament info
  const TOURNAMENT_NAME = "Botola  Brazil";
  const SPONSOR_NAME = "warda";
  const MATCH_DAY = "27 / 28";
  const ORGANIZER = "Vinsmoke";

  // Backend URL
  const API_URL = "https://khalidshift.pythonanywhere.com/api";

  // Form state
  const [formData, setFormData] = useState({
    squadName: "",
    players: Array(5).fill({ name: "", id: "" }),
  });

  const [submissions, setSubmissions] = useState([]);
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [submitMessage, setSubmitMessage] = useState(""); // success message

  // ---------------------------
  // Load data from backend
  // ---------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rulesRes = await fetch(`${API_URL}/rules`);
        const rulesData = await rulesRes.json();
        setRules(rulesData);

        const contributorsRes = await fetch(`${API_URL}/contributors`);
        const contributorsData = await contributorsRes.json();
        setSubmissions(contributorsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // ---------------------------
  // Handle form inputs
  // ---------------------------
  const handleChange = (e, index = null, field = null) => {
    const value = e.target.value;
    if (index !== null) {
      const newPlayers = [...formData.players];

      if (field === "name") {
        newPlayers[index] = { ...newPlayers[index], name: value.slice(0, 20) };
      } else if (field === "id") {
        const numeric = value.replace(/\D/g, "").slice(0, 20);
        newPlayers[index] = { ...newPlayers[index], id: numeric };
      }

      setFormData({ ...formData, players: newPlayers });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  // ---------------------------
  // Submit squad
  // ---------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields: squadName + players 1-4
    if (!formData.squadName.trim()) {
      alert("Squad name is required!");
      return;
    }

    for (let i = 0; i < 4; i++) {
      if (!formData.players[i].name.trim() || !formData.players[i].id.trim()) {
        alert(`Player ${i + 1} (required) name and ID must be filled!`);
        return;
      }
    }

    try {
      await fetch(`${API_URL}/contributors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Refresh list
      const updated = await fetch(`${API_URL}/contributors`).then((r) => r.json());
      setSubmissions(updated);

      // Reset form
      setFormData({
        squadName: "",
        players: Array(5).fill({ name: "", id: "" }),
      });

      // Show success message
      setSubmitMessage("✅ Squad submitted successfully!");
      setTimeout(() => setSubmitMessage(""), 4000); // clear after 4s
    } catch (err) {
      console.error("Error submitting squad:", err);
      setSubmitMessage("❌ Failed to submit squad");
      setTimeout(() => setSubmitMessage(""), 4000);
    }
  };

  // ---------------------------
  // Admin login
  // ---------------------------
  const handlePassword = async () => {
    try {
      const res = await fetch(`${API_URL}/check_admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      if (!res.ok) throw new Error("Invalid password");
      const data = await res.json();
      setIsAdmin(data.admin);
    } catch {
      setIsAdmin(false);
      alert("❌ Wrong password");
    }
  };

  // ---------------------------
  // Admin actions
  // ---------------------------
  const handleDelete = async (index) => {
    try {
      const res = await fetch(
        `${API_URL}/contributors/${index}?password=${passwordInput}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Unauthorized or invalid index");
      const updated = await fetch(`${API_URL}/contributors`).then((r) => r.json());
      setSubmissions(updated);
    } catch (err) {
      alert("❌ Failed to delete contributor — check admin password");
      console.error(err);
    }
  };

  const handleAccept = (index) => {
    alert(`✅ Squad "${submissions[index].squadName}" accepted!`);
  };

  const handleAddRule = async () => {
    if (!newRule.trim()) return;

    try {
      const res = await fetch(`${API_URL}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule: newRule, password: passwordInput }),
      });
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setRules(data.rules);
      setNewRule("");
    } catch (err) {
      alert("❌ Failed to add rule — check admin password");
      console.error(err);
    }
  };

  const handleDeleteRule = async (index) => {
    try {
      const res = await fetch(
        `${API_URL}/rules/${index}?password=${passwordInput}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setRules(data.rules);
    } catch (err) {
      alert("❌ Failed to delete rule — check admin password");
      console.error(err);
    }
  };

  // ---------------------------
  // UI Rendering
  // ---------------------------
  return (
    <div className="app-container">
      <header className="header">
        <h1>{TOURNAMENT_NAME}</h1>
        <p>Organizer: {ORGANIZER}</p>
        <p>Sponsor: {SPONSOR_NAME}</p>
        <p>Match Day: {MATCH_DAY}</p>
      </header>

      {/* Rules Section */}
      <section className="rules-section">
        <h2>قوانين البطولة</h2>
        <ul>
          {rules.map((rule, index) => (
            <li key={index}>
              {rule}
              {isAdmin && (
                <button onClick={() => handleDeleteRule(index)}>Delete</button>
              )}
            </li>
          ))}
        </ul>

        {isAdmin && (
          <div>
            <input
              type="text"
              value={newRule}
              placeholder="إضافة قانون"
              onChange={(e) => setNewRule(e.target.value)}
            />
            <button onClick={handleAddRule}>Add Rule</button>
          </div>
        )}
      </section>

      {/* Squad Form */}
      <section className="form-section">
        <h2>سجل سكوادك</h2>
        {submitMessage && <p className="success-message">{submitMessage}</p>}
        <form onSubmit={handleSubmit} className="squad-form">
          <input
            type="text"
            name="squadName"
            placeholder="(مثلا ' lmahadida ') إسم سكواد"
            value={formData.squadName}
            onChange={handleChange}
            required
          />

          {formData.players.map((player, index) => (
            <div key={index} className="player-row">
              <input
                type="text"
                placeholder={
                  index === 0
                    ? `Player ${index + 1} Name (قائد سكواد ضروري يكون كيفتح لمايك)`
                    : index === 4
                    ? `Player ${index + 1} Name (إختياري)`
                    : `Player ${index + 1} Name`
                }
                value={player.name}
                onChange={(e) => handleChange(e, index, "name")}
                required={index < 4}
              />
              <input
                type="text"
                placeholder={
                  index === 4
                    ? `Player ${index + 1} ID (إختياري, numbers only)`
                    : `Player ${index + 1} ID (numbers only)`
                }
                value={player.id}
                onChange={(e) => handleChange(e, index, "id")}
                required={index < 4}
              />
            </div>
          ))}

          <button type="submit" className="btn">
            Submit Squad
          </button>
        </form>
      </section>

      {/* Admin Section */}
      <section className="admin-section">
        <h2>Admin Access</h2>
        <input
          type="password"
          placeholder="Enter Admin Password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
        />
        <button onClick={handlePassword} className="btn">
          Login
        </button>
        <p>{isAdmin ? "✅ You are admin" : "❌ You are not admin"}</p>

        {isAdmin && (
          <div className="admin-panel">
            <h3>الفرق المُشاركة</h3>
            {submissions.length === 0 ? (
              <p>لا توجد مشاركات حتى الآن.</p>
            ) : (
              submissions.map((squad, index) => (
                <div key={index} className="squad-card">
                  <h4>{squad.squadName}</h4>
                  {squad.players.map((p, i) => (
                    <p key={i}>
                      {p.name} ({p.id})
                    </p>
                  ))}
                  <button
                    onClick={() => handleAccept(index)}
                    className="btn accept"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="btn delete"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default App;
