import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { ActiveInjuriesCard } from './cards/ActiveInjuriesCard';
import { BattlePrepCard } from './cards/BattlePrepCard';
import { SparringGapCard } from './cards/SparringGapCard';
import { CustomReminderCard } from './cards/CustomReminderCard';
import { GoalsCard } from './cards/GoalsCard';
import { WeeklyReportPinCard } from './cards/WeeklyReportPinCard';

export const DEFAULT_CARD_ORDER = [
  { id:"injuries",       visible:true },
  { id:"battlePrep",     visible:false },
  { id:"sparringGap",    visible:false },
  { id:"reminders",      visible:false },
  { id:"goals",          visible:false },
  { id:"weeklyReport",   visible:false },
];

export const HomeCardsContainer = ({
  moves, reps, sparring, musicflow, calendar, cats, catColors,
  injuries, setInjuries, battleprep, reminders, ideas,
  reports, setReports, settings, onSettingsChange, onNavigate,
}) => {
  const { C } = useSettings();
  const cardOrder = settings?.homeCards || DEFAULT_CARD_ORDER;

  const renderCard = (cardId) => {
    switch (cardId) {
      case "injuries":
        return <ActiveInjuriesCard key={cardId} injuries={injuries} setInjuries={setInjuries}/>;
      case "battlePrep":
        return <BattlePrepCard key={cardId} battleprep={battleprep} onNavigate={onNavigate}/>;
      case "sparringGap":
        return <SparringGapCard key={cardId} sparring={sparring}/>;
      case "reminders":
        return <CustomReminderCard key={cardId} reminders={reminders}/>;
      case "goals":
        return <GoalsCard key={cardId} ideas={ideas}/>;
      case "weeklyReport":
        return <WeeklyReportPinCard key={cardId} moves={moves} reps={reps} sparring={sparring}
          musicflow={musicflow} calendar={calendar} cats={cats} catColors={catColors}/>;
      default: return null;
    }
  };

  return (
    <div style={{ padding:"8px 12px 0" }}>
      {cardOrder.filter(c => c.visible).map(c => renderCard(c.id))}
    </div>
  );
};
