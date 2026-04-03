import React from 'react';
import { HabitsPage } from '../train/HabitsPage';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';

export const HomePage = ({ habits, setHabits, onAddTrigger }) => {
  const { C } = useSettings();
  const t = useT();
  return (
    <div style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column" }}>
      <HabitsPage onAddTrigger={onAddTrigger} habits={habits} setHabits={setHabits}/>
    </div>
  );
};
