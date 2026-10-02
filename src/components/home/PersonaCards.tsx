import React from 'react';
import { SignalDot } from '../ui/SignalDot';
import { GraduationCap, Laptop, Store, Home, ArrowRight, Check } from 'lucide-react';

export interface Persona {
  id: string;
  title: string;
  subtitle: string;
  realityText: string;
  presetWatts: Record<string, number>;
  presetHours: number;
}

interface PersonaCardsProps {
  onSelectPersona: (persona: Persona) => void;
  selectedPersonaId?: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'student',
    title: 'Student & Researcher',
    subtitle: 'Hostels & Exam Prep',
    realityText: 'When hostel power trips at 9pm before an exam, you need reading light, laptop power for assignments, and phone charge until morning.',
    presetWatts: {
      laptop: 40,
      phone: 15,
      lamp: 10,
    },
    presetHours: 6,
  },
  {
    id: 'remote_worker',
    title: 'Remote Worker',
    subtitle: 'Laptops, WiFi & Video Calls',
    realityText: 'Zoom and Slack drop the second the transformer blows. You need continuous 65W laptop charging, WiFi router power, and a silent fan.',
    presetWatts: {
      laptop: 50,
      phone: 15,
      router: 12,
      fan: 20,
      lamp: 10,
    },
    presetHours: 8,
  },
  {
    id: 'shop_owner',
    title: 'Shop Owner & Merchant',
    subtitle: 'POS & Store Lighting',
    realityText: 'Customers walk past pitch-black shops into bright ones. You need two POS terminals online, shop lighting, and cashier counter breeze without generator noise.',
    presetWatts: {
      pos: 10,
      phone: 15,
      lamp: 20,
      fan: 20,
    },
    presetHours: 7,
  },
  {
    id: 'family',
    title: 'Family & Apartment',
    subtitle: 'All-Night Fans & Living Room',
    realityText: 'Children cannot sleep in stagnant heat. You need silent fan airflow in the bedrooms, living room lighting, and zero carbon monoxide smoke inside the flat.',
    presetWatts: {
      fan: 40,
      lamp: 25,
      phone: 30,
      router: 12,
    },
    presetHours: 9,
  },
];

const getPersonaIcon = (id: string) => {
  switch (id) {
    case 'student':
      return <GraduationCap className="w-5 h-5 text-[#1B1B1A]" />;
    case 'remote_worker':
      return <Laptop className="w-5 h-5 text-[#2454E6]" />;
    case 'shop_owner':
      return <Store className="w-5 h-5 text-[#FF5B35]" />;
    case 'family':
      return <Home className="w-5 h-5 text-[#1B1B1A]" />;
    default:
      return <Laptop className="w-5 h-5 text-[#1B1B1A]" />;
  }
};

export const PersonaCards: React.FC<PersonaCardsProps> = ({
  onSelectPersona,
  selectedPersonaId,
}) => {
  return (
    <section className="mb-14">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {PERSONAS.map(persona => {
          const isSelected = selectedPersonaId === persona.id;
          return (
            <div
              key={persona.id}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              onClick={() => onSelectPersona(persona)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPersona(persona);
                }
              }}
              className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between group shadow-sm focus-visible:ring-2 focus-visible:ring-[#FF5B35] focus-visible:outline-none min-h-[220px] ${
                isSelected
                  ? 'bg-white border-[#1B1B1A] ring-2 ring-[#FF5B35] shadow-md -translate-y-0.5'
                  : 'bg-white/80 hover:bg-white border-[#1B1B1A]/15 hover:border-[#1B1B1A] hover:shadow-md'
              }`}
            >
              <div>
                {/* Header with Circular Icon Badge (inspired by tactile smart UI) */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-[#F5F1E8] border-[#1B1B1A]'
                      : 'bg-neutral-50 border-neutral-200 group-hover:border-[#1B1B1A]/30'
                  }`}>
                    {getPersonaIcon(persona.id)}
                  </div>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 bg-[#D9FF6B] text-[#1B1B1A] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 text-[#1B1B1A]" />
                      Active
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-[#6E6D68] uppercase tracking-wider">
                      {persona.subtitle}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg text-[#1B1B1A] group-hover:text-[#FF5B35] transition-colors">
                  {persona.title}
                </h3>

                <p className="text-xs text-[#1B1B1A]/80 mt-2 leading-relaxed font-sans">
                  {persona.realityText}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#1B1B1A]/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#2454E6] font-semibold">
                  {persona.presetHours}h blackout basis
                </span>
                <span className="text-xs font-mono font-bold text-[#1B1B1A] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Load Setup</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FF5B35]" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
