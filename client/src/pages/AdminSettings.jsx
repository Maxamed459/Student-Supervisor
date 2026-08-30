import { useAuth } from "../context/AuthContext";

function AdminSettings() {
  const { user } = useAuth();

  return (
    <div className="students-page">
      <div className="students-header">
        <div>
          <h2>Settings</h2>
          <p>Manage your administrator account preferences</p>
        </div>
      </div>

      <div className="sos-card" style={{ maxWidth: 640 }}>
        <div className="sos-card-head">
          <h3>Account</h3>
        </div>
        <div className="form-stack" style={{ padding: "0 4px 8px" }}>
          <div className="form-group">
            <label>Name</label>
            <input value={user?.name || ""} readOnly />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={user?.email || ""} readOnly />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input value="Administrator" readOnly />
          </div>
          <p className="field-hint">
            Password and security changes are managed by system
            administrators. Contact support if you need to update
            credentials.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
