import React, { useState } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { MoveSnapshotCard } from './cards/MoveSnapshotCard';
import { ActiveInjuriesCard } from './cards/ActiveInjuriesCard';
import { BattlePrepCard } from './cards/BattlePrepCard';
import { SparringGapCard } from './cards/SparringGapCard';
import { CustomReminderCard } from './cards/CustomReminderCard';
import { GoalsCard } from './cards/GoalsCard';
import { WeeklyReportPinCard } from './cards/WeeklyReportPinCard';
import { HomeCardsSettingsModal } from './HomeCardsSettingsModal';

export const DEFAULT_CARD_ORDER = [
  { id:"moveSnapshot",   visible:true },
  { id:"injuries",       visible:true },
  { id:"battlePrep",     visible:false },
  { id:"sparringGap",    visible:false },
  { id:"reminders",      visible:false },
  { id:"goals",          visible:false },
  { id:"weeklyReport",   visible:false },
];

const CARD_LABELS = {
  moveSnapshot: "moveSnapshot",
  injuries: "activeInjuries",
  battlePrep: "battlePrepCard",
  sparringGap: "sparringGap",
  reminders: "pinnedReminders",
  goals: "goalsCard",
  weeklyReport: "weeklyReportPin",
};

export const HomeCardsContainer = ({
  moves, reps, sparring, musicflow, calendar, cats, catColors,
  injuries, setInjuries, battleprep, reminders, ideas,
  reports, setReports, settings, onSettingsChange, onNavigate,
}) => {
  const { C } = useSettings();
  const t = useT();
  const [showSettings, setShowSettings] = useState(false);

  const cardOrder = settings?.homeCards || DEFAULT_CARD_ORDER;

  const renderCard = (cardId) => {
    switch (cardId) {
      case "moveSnapshot":
        return <MoveSnapshotCard key={cardId} moves={moves} reps={reps}/>;
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

      <button onClick={() => setShowSettings(true)}
        style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:4,
          width:"100%", padding:"8px 0", background:"none", border:"none",
          cursor:"pointer", color:C.textMuted, fontSize:10, fontWeight:700,
          fontFamily:FONT_DISPLAY, letterSpacing:1,
        }}>
        <Ic n="cog" s={11} c={C.textMuted}/>
        {t("customizeCards")}
      </button>

      {showSettings && (
        <HomeCardsSettingsModal
          cardOrder={cardOrder}
          cardLabels={CARD_LABELS}
          onSave={(newOrder) => {
            onSettingsChange(prev => ({ ...prev, homeCards: newOrder }));
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};
