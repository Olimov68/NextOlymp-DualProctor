import React from 'react';
import { LeaderboardEntry } from '../../types';
import { Avatar } from '../common/Avatar';
import { Trophy, Medal, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ entries, isLoading }) => {
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="w-full space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-zinc-900/60 border border-white/10 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="w-full text-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-zinc-900/60 space-y-3 backdrop-blur-md">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
          <Trophy className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-zinc-100">Hozircha ishtirokchilar mavjud emas</h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Olimpiadalarda qatnashib natija ko'rsating va birinchilardan bo'lib umummilliy reyting jadvalidan joy oling!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md shadow-xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] font-bold tracking-wider border-b border-white/10">
          <tr>
            <th className="px-6 py-4">O'rin</th>
            <th className="px-6 py-4">Ishtirokchi</th>
            <th className="px-6 py-4">Sinf</th>
            <th className="px-6 py-4">Viloyat va Maktab</th>
            <th className="px-6 py-4 text-right">Ball</th>
            <th className="px-6 py-4 text-right">Vaqt (Penalty)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-zinc-100">
          {entries.map((entry) => {
            const isTop1 = entry.rank === 1;
            const isTop2 = entry.rank === 2;
            const isTop3 = entry.rank === 3;
            
            const isCurrentUser = user && (
              entry.userId === user.id ||
              entry.userName.toLowerCase() === (user.fullName || '').toLowerCase()
            );

            return (
              <tr
                key={entry.rank}
                className={`transition-colors ${
                  isCurrentUser
                    ? 'bg-emerald-500/10 font-bold border-l-4 border-emerald-500'
                    : isTop1
                    ? 'bg-amber-500/5 hover:bg-amber-500/10'
                    : 'hover:bg-zinc-800/40'
                }`}
              >
                <td className="px-6 py-4 font-bold">
                  <div className="flex items-center gap-2">
                    {isTop1 ? (
                      <span className="w-8 h-8 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-black text-xs shadow-md">
                        1
                      </span>
                    ) : isTop2 ? (
                      <span className="w-8 h-8 rounded-full bg-zinc-300 text-zinc-950 flex items-center justify-center font-black text-xs shadow-md">
                        2
                      </span>
                    ) : isTop3 ? (
                      <span className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs shadow-md">
                        3
                      </span>
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 border border-white/10 flex items-center justify-center font-bold text-xs">
                        {entry.rank}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={entry.userName} src={entry.avatarUrl} size="sm" />
                    <div>
                      <div className="font-bold text-zinc-100 flex items-center gap-2">
                        <span>{entry.userName}</span>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-bold uppercase">
                            Siz
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-zinc-400 font-medium">
                  {entry.grade}-sinf
                </td>

                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-100">{entry.region}</div>
                  <div className="text-xs text-zinc-400 line-clamp-1">{entry.school}</div>
                </td>

                <td className="px-6 py-4 text-right">
                  <span className="font-mono text-base font-black text-emerald-400">
                    {entry.score}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-1">XP</span>
                </td>

                <td className="px-6 py-4 text-right font-mono text-xs text-zinc-400">
                  <div className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{(entry as any).timeSpentMinutes ?? Math.round((entry.penaltyTime || 0) / 60)} daq</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
