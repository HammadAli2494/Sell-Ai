import { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../services/api.js";

function CustomerProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [form, setField] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    postalCode: user?.postalCode || "",
    country: user?.country || "",
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  function setValue(key, value) {
    setField((current) => ({ ...current, [key]: value }));
  }

  async function handleProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update profile"));
    } finally {
      setSaving(false);
    }
  }

  async function handlePassword(event) {
    event.preventDefault();
    setChanging(true);
    try {
      await changePassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      toast.success("Password updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update password"));
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleProfile} className="ui-card grid gap-4 p-5 sm:grid-cols-2">
        <h1 className="ui-title sm:col-span-2">Profile</h1>
        {[
          ["name", "Full name"],
          ["phone", "Phone"],
          ["address", "Address"],
          ["city", "City"],
          ["state", "State"],
          ["postalCode", "Postal code"],
          ["country", "Country"],
        ].map(([key, label]) => (
          <label key={key} className="ui-label">
            {label}
            <input value={form[key]} onChange={(event) => setValue(key, event.target.value)} className="ui-input" />
          </label>
        ))}
        <button type="submit" disabled={saving} className="ui-btn ui-btn-primary sm:col-span-2">
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
      <form onSubmit={handlePassword} className="ui-card grid gap-4 p-5">
        <h2 className="text-sm font-semibold text-ink">Change password</h2>
        <label className="ui-label">
          Current password
          <input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} required className="ui-input" />
        </label>
        <label className="ui-label">
          New password
          <input type="password" minLength={8} value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} required className="ui-input" />
        </label>
        <button type="submit" disabled={changing} className="ui-btn ui-btn-secondary">
          {changing ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default CustomerProfilePage;
