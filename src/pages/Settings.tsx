import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Bot, User, Bell, Shield, LogOut } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Settings() {
  const { user, profile, setProfile } = useAuthStore();
  const [assistantName, setAssistantName] = useState(
    profile?.preferences?.assistantName || 'Assistant'
  );
  const [aiProvider, setAiProvider] = useState(
    profile?.preferences?.aiProvider || 'openai'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        preferences: {
          ...profile.preferences,
          assistantName,
          aiProvider,
        },
      });
      setProfile({
        ...profile,
        preferences: {
          ...profile.preferences,
          assistantName,
          aiProvider: aiProvider as 'openai' | 'anthropic',
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen md:pl-64 bg-background pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your preferences</p>
        </div>

        {/* AI Provider */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="font-semibold text-gray-900">AI Provider</h2>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              {(['openai', 'anthropic'] as const).map((p) => (
                <label
                  key={p}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    aiProvider === p
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p}
                    checked={aiProvider === p}
                    onChange={() => setAiProvider(p)}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm capitalize">{p === 'openai' ? 'OpenAI' : 'Anthropic'}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>

        {/* Profile */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center">
              <User className="h-4 w-4 text-teal-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
                {profile?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
                {profile?.email || 'Unknown'}
              </p>
            </div>
            <Input
              label="Assistant Name"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              placeholder="e.g. Jarvis, Aria, Assistant..."
            />
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Bell className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Preferences</h2>
          </div>
          <p className="text-sm text-gray-500">Notification and communication preferences coming soon.</p>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Data & Privacy</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Your data is stored securely in Firebase.</p>
          <Button variant="secondary" size="sm">Export Data</Button>
        </Card>

        {/* Save and Sign Out */}
        <div className="flex gap-3">
          <Button onClick={handleSave} loading={saving} className="flex-1">
            {saved ? '✓ Saved!' : 'Save Changes'}
          </Button>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
