import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { User, Building, Save, Upload, Trash2, Smile, CheckCircle2, Sparkles } from 'lucide-react';

const EMOJI_AVATARS = [
  '🎓', '🏆', '🚀', '💻', '🧠', '🔬',
  '⚡', '🥇', '👑', '🎯', '📚', '🌟'
];

const UZBEKISTAN_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Andijon viloyati',
  'Buxoro viloyati',
  'Farg\'ona viloyati',
  'Jizzax viloyati',
  'Xorazm viloyati',
  'Namangan viloyati',
  'Navoiy viloyati',
  'Qashqadaryo viloyati',
  'Qoraqalpog\'iston Respublikasi',
  'Samarqand viloyati',
  'Sirdaryo viloyati',
  'Surxondaryo viloyati'
];

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [school, setSchool] = useState(user?.school || '');
  const [grade, setGrade] = useState(user?.grade || 9);
  const [region, setRegion] = useState(user?.region || 'Toshkent shahri');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Rasm hajmi 5MB dan oshmasligi kerak!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleSelectEmoji = (emoji: string) => {
    setAvatarUrl(emoji);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName,
      avatarUrl,
      school,
      grade,
      region,
    });

    setSuccessMessage("Profil sozlamalari va avatar muvaffaqiyatli saqlandi!");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-100 tracking-tight">Profil Sozlamalari</h1>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Shaxsiy ma'lumotlaringiz, avataringiz va ta'lim maskaningizni boshqaring
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="capitalize">{user.role || 'Foydalanuvchi'}</span>
        </div>
      </div>

      
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-sm font-semibold shadow-lg shadow-emerald-500/5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-zinc-900/60 border border-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
        
        <div className="space-y-4 border-b border-white/10 pb-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Profil Rasmi / Avatari</h3>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar name={fullName} src={avatarUrl} size="xl" className="shadow-xl shrink-0 ring-2 ring-emerald-500/40" />

            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-4 h-4 text-emerald-400" />}
                >
                  Rasm yuklash
                </Button>

                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    leftIcon={<Trash2 className="w-4 h-4 text-rose-400" />}
                    className="hover:border-rose-500/50 hover:text-rose-400"
                  >
                    Rasmni olib tashlash
                  </Button>
                )}
              </div>

              
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  <span>Yoki tayyor Emoji-avatarlardan birini tanlang:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {EMOJI_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSelectEmoji(emoji)}
                      className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center border transition-all cursor-pointer ${
                        avatarUrl === emoji
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-400 text-white scale-110 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                          : 'bg-zinc-800/80 hover:bg-zinc-700/80 border-white/10 text-zinc-200 hover:scale-105'
                      }`}
                      title="Shu emojini tanlash"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <form onSubmit={handleSave} className="space-y-6">
          <Input
            label="F.I.SH (Familiya, Ism va Sharifingiz)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-zinc-400" />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Sinf / Bosqich</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full p-2.5 text-sm border border-white/10 rounded-xl bg-zinc-900 font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g} className="bg-zinc-900 text-zinc-100">{g}-sinf</option>
                ))}
              </select>
            </div>

            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Viloyat / Hudud</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-2.5 text-sm border border-white/10 rounded-xl bg-zinc-900 font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {UZBEKISTAN_REGIONS.map((r) => (
                  <option key={r} value={r} className="bg-zinc-900 text-zinc-100">{r}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Maktab / Litsey / O'quv Muassasasi"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            leftIcon={<Building className="w-4 h-4 text-zinc-400" />}
            placeholder="Masalan: 1-sonli ixtisoslashtirilgan maktab"
          />

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <Button
              type="submit"
              size="md"
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              className="px-6 font-bold shadow-lg shadow-emerald-500/20"
            >
              O'zgarishlarni Saqlash
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
