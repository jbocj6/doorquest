import React, { useEffect, useState, useRef } from "react";

// use deployed backend if set, otherwise fall back to local dev backend
const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function App() {
  const [apiMessage, setApiMessage] = useState("Loading...");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registerMsg, setRegisterMsg] = useState("");
  const [users, setUsers] = useState([]);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changeMsg, setChangeMsg] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then((res) => res.json())
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage("Could not connect to backend"));

    fetch(`${API_BASE}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      setProfilePicUrl(`${API_BASE}/profile-pic/${loggedInUser}?t=${Date.now()}`);
    }
  }, [loggedInUser]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMsg("Registering...");
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      const data = await res.json();
      setRegisterMsg(data.message);
    } catch (err) {
      setRegisterMsg("Registration failed");
    }

    fetch(`${API_BASE}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg("Logging in...");
    const formData = new URLSearchParams();
    formData.append("username", loginUsername);
    formData.append("password", loginPassword);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      const data = await res.json();
      setLoginMsg(data.message);
      if (data.message && data.message.startsWith("Welcome")) {
        setLoggedInUser(loginUsername);
        setShowProfile(false);
        setProfilePicUrl(`${API_BASE}/profile-pic/${loginUsername}?t=${Date.now()}`);
      }
    } catch (err) {
      setLoginMsg("Login failed");
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setLoginMsg("Logged out.");
    setLoginUsername("");
    setLoginPassword("");
    setShowProfile(false);
    setProfilePicUrl(null);
  };

  const handleProfilePicUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("username", loggedInUser);
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload-profile-pic`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.filename) {
        setProfilePicUrl(`${API_BASE}/profile-pic/${loggedInUser}?t=${Date.now()}`);
      }
    } catch (err) {
      // ignore or show error
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeMsg("Updating password...");
    const formData = new URLSearchParams();
    formData.append("username", loggedInUser);
    formData.append("old_password", oldPassword);
    formData.append("new_password", newPassword);

    try {
      const res = await fetch(`${API_BASE}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      const data = await res.json();
      setChangeMsg(data.message);
    } catch (err) {
      setChangeMsg("Password update failed");
    }
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <div>
      <h1>DoorQuest Frontend is running!</h1>
      <p>Backend says: {apiMessage}</p>
      <hr />
      {loggedInUser ? (
        <div>
          <h2>Welcome, {loggedInUser}!</h2>
          <button onClick={handleLogout}>Logout</button>
          <button onClick={() => setShowProfile(true)} style={{ marginLeft: "10px" }}>
            Show Profile
          </button>
          {showProfile && (
            <div style={{ border: "1px solid #ccc", padding: "10px", marginTop: "10px" }}>
              <h2>User Profile</h2>
              <p><strong>Username:</strong> {loggedInUser}</p>
              {profilePicUrl && (
                <div>
                  <img
                    src={profilePicUrl}
                    alt="Profile"
                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "50%" }}
                  />
                </div>
              )}
              <form onSubmit={handleProfilePicUpload}>
                <input type="file" ref={fileInputRef} accept="image/*" />
                <p> </p><button type="submit">Upload Profile Picture</button>
              </form>
              <p><hr></hr></p>
              <h2>Change Password</h2>
              <form onSubmit={handleChangePassword}>
                <input
                  placeholder="Old Password"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                /><p></p>
                <input
                  placeholder="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p></p>
                <button type="submit">Change Password</button>
              </form>
              <p>{changeMsg}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              placeholder="Username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
            />
            <p></p>
            <input
              placeholder="Password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            /><p></p>
            <button type="submit">Login</button>
          </form>
          <p>{loginMsg}</p>
        </>
      )}
      <hr />
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        /><p></p>
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p></p>
        <button type="submit">Register</button>
      </form>
      <p>{registerMsg}</p>
      <hr />
      <h2>Registered Users</h2>
      <ul>
        {users.map((u) => (
          <li key={u}>{u}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;