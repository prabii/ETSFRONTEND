import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { settingsApi, OfficeSettings } from "@/lib/api";
import { MapPin, Building2, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<OfficeSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi.get()
      .then((res) => setSettings(res.settings))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await settingsApi.update(settings);
      setSettings(res.settings);
      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof OfficeSettings, label: string, type = "text") => (
    <div key={key}>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <input
        type={type}
        value={settings[key] ?? ""}
        onChange={(e) => setSettings((prev) => ({ ...prev, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        disabled={loading}
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure system settings.</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Office Location */}
          <div className="bg-card border border-border rounded-xl p-6 zy-shadow space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Office Location</h3>
                <p className="text-xs text-muted-foreground">Geo-fencing configuration</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field("lat", "Latitude", "number")}
              {field("lng", "Longitude", "number")}
              {field("radius", "Radius (meters)", "number")}
              {field("officeName", "Office Name")}
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-card border border-border rounded-xl p-6 zy-shadow space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Company Information</h3>
                <p className="text-xs text-muted-foreground">Organization & work schedule</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field("companyName", "Company Name")}
              {field("workStartTime", "Work Start Time (HH:MM)")}
              {field("lateAfterMinutes", "Late After (minutes)", "number")}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg zy-gradient text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
