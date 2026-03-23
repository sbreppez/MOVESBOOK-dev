import { useSettings } from './useSettings';
import { TRANSLATIONS } from '../constants/translations';

export const useT = () => {
  const { settings } = useSettings();
  const lang = settings.language || "en";
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return (key) => dict[key] ?? TRANSLATIONS.en[key] ?? key;
};

export const usePlural = () => {
  const { settings } = useSettings();
  const lang = settings.language || "en";
  const entryCountStr = (n) => {
    if (lang==="ja"||lang==="zh") return n+" エントリ";
    if (lang==="it") return n===1?n+" voce":n+" voci";
    if (lang==="es"||lang==="pt") return n===1?n+" entrada":n+" entradas";
    if (lang==="fr") return n===1?n+" entrée":n+" entrées";
    if (lang==="de") return n===1?n+" Eintrag":n+" Einträge";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" запись"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" записи"; return n+" записей"; }
    return n===1?n+" entry":n+" entries";
  };
  const moveCountStr = (n) => {
    if (lang==="ja"||lang==="zh") return n+" ムーブ";
    if (lang==="it") return n===1?n+" mossa":n+" mosse";
    if (lang==="es") return n===1?n+" movimiento":n+" movimientos";
    if (lang==="fr") return n===1?n+" mouvement":n+" mouvements";
    if (lang==="pt") return n===1?n+" movimento":n+" movimentos";
    if (lang==="de") return n===1?n+" Move":n+" Moves";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" движение"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" движения"; return n+" движений"; }
    return n===1?n+" move":n+" moves";
  };
  const itemCountStr = (n) => {
    if (lang==="ja"||lang==="zh") return n+" 個";
    if (lang==="it") return n===1?n+" elemento":n+" elementi";
    if (lang==="es") return n===1?n+" elemento":n+" elementos";
    if (lang==="fr") return n===1?n+" élément":n+" éléments";
    if (lang==="pt") return n===1?n+" item":n+" itens";
    if (lang==="de") return n===1?n+" Element":n+" Elemente";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" элемент"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" элемента"; return n+" элементов"; }
    return n===1?n+" item":n+" items";
  };
  const dayCountStr = (n) => {
    if (lang==="ja"||lang==="zh") return n+" 日";
    if (lang==="it"||lang==="es"||lang==="pt") return n===1?n+" giorno":n+" giorni";
    if (lang==="fr") return n===1?n+" jour":n+" jours";
    if (lang==="de") return n===1?n+" Tag":n+" Tage";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" день"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" дня"; return n+" дней"; }
    return n===1?n+" day":n+" days";
  };
  const roundCountStr = (n) => {
    if (lang==="ja"||lang==="zh") return n+" ラウンド";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" раунд"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" раунда"; return n+" раундов"; }
    return n+" round"+(n!==1?"s":"");
  };
  const resultCountStr = (n) => {
    if (lang==="ja"||lang==="zh") return n+" 件";
    if (lang==="it") return n===1?n+" risultato":n+" risultati";
    if (lang==="es") return n===1?n+" resultado":n+" resultados";
    if (lang==="fr") return n===1?n+" résultat":n+" résultats";
    if (lang==="pt") return n===1?n+" resultado":n+" resultados";
    if (lang==="de") return n===1?n+" Ergebnis":n+" Ergebnisse";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" результат"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" результата"; return n+" результатов"; }
    return n===1?n+" result":n+" results";
  };
  const stepCountStr = (n) => {
    if (lang==="ja"||lang==="zh") return n+" ステップ";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" шаг"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" шага"; return n+" шагов"; }
    return n+" step"+(n!==1?"s":"");
  };
  return { entryCountStr, moveCountStr, itemCountStr, dayCountStr, roundCountStr, resultCountStr, stepCountStr };
};
