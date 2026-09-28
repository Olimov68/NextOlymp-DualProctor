import React from 'react';
import { Link } from 'react-router-dom';
import { Olympiad } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Clock, Users, Trophy, ArrowRight, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

interface OlympiadCardProps {
  olympiad: Olympiad;
}

export const OlympiadCard: React.FC<OlympiadCardProps> = ({ olympiad }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const targetUrl = isAuthenticated
    ? `/olympiads/${olympiad.id}/participate`
    : `/olympiads/${olympiad.id}`;

  return (
    <Card hoverEffect className="overflow-hidden flex flex-col justify-between group bg-[#111827] border border-[#1E293B]">
      <div>
        
        <div className="relative h-44 w-full bg-[#0B1120] overflow-hidden">
          <img
            src={olympiad.imageUrl || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80'}
            alt={olympiad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />
          
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <Badge subject={olympiad.subject} />
            {olympiad.isAlwaysOpen ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 backdrop-blur-xs">
                ⚡ 24/7 Ochiq
              </span>
            ) : (
              <Badge status={olympiad.status} />
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white">
            <span className="text-[11px] font-semibold tracking-wider text-[#94A3B8] uppercase block">
              {olympiad.organizer}
            </span>
          </div>
        </div>

        
        <div className="p-5 space-y-3">
          <h3 className="text-base font-bold text-[#F1F5F9] leading-snug line-clamp-2 group-hover:text-[#3B82F6] transition-colors">
            {olympiad.title}
          </h3>

          <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
            {olympiad.description}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1E293B] text-xs text-[#94A3B8]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
              <span>{olympiad.durationMinutes} daqiqa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
              <span>{olympiad.participantsCount} ishtirokchi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span>{olympiad.isAlwaysOpen ? "24/7 Doimiy ochiq" : new Date(olympiad.startDate).toLocaleDateString('uz-UZ')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>{olympiad.maxScore} max ball</span>
            </div>
          </div>
        </div>
      </div>

      
      <div className="p-5 pt-0">
        <Link to={targetUrl}>
          <Button
            variant={olympiad.status === 'active' ? 'primary' : 'outline'}
            className="w-full font-bold"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {olympiad.status === 'active'
              ? (t('olympiads.participate') || 'Musobaqaga kirish')
              : (t('olympiads.details') || 'Batafsil')}
          </Button>
        </Link>
      </div>
    </Card>
  );
};
