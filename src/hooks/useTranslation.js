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
    if (lang==="zh") return n+" 条";
    if (lang==="ja") return n+" エントリ";
    if (lang==="ko") return n+"개 항목";
    if (lang==="th") return n+" รายการ";
    if (lang==="it") return n===1?n+" voce":n+" voci";
    if (lang==="es"||lang==="pt") return n===1?n+" entrada":n+" entradas";
    if (lang==="fr") return n===1?n+" entrée":n+" entrées";
    if (lang==="de") return n===1?n+" Eintrag":n+" Einträge";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" запись"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" записи"; return n+" записей"; }
    return n===1?n+" entry":n+" entries";
  };
  const moveCountStr = (n) => {
    if (lang==="zh") return n+" 个动作";
    if (lang==="ja") return n+" ムーブ";
    if (lang==="ko") return n+"개 무브";
    if (lang==="th") return n+" ท่า";
    if (lang==="it") return n===1?n+" mossa":n+" mosse";
    if (lang==="es") return n===1?n+" movimiento":n+" movimientos";
    if (lang==="fr") return n===1?n+" mouvement":n+" mouvements";
    if (lang==="pt") return n===1?n+" movimento":n+" movimentos";
    if (lang==="de") return n===1?n+" Move":n+" Moves";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" движение"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" движения"; return n+" движений"; }
    return n===1?n+" move":n+" moves";
  };
  const itemCountStr = (n) => {
    if (lang==="zh") return n+" 项";
    if (lang==="ja") return n+" 個";
    if (lang==="ko") return n+"개";
    if (lang==="th") return n+" รายการ";
    if (lang==="it") return n===1?n+" elemento":n+" elementi";
    if (lang==="es") return n===1?n+" elemento":n+" elementos";
    if (lang==="fr") return n===1?n+" élément":n+" éléments";
    if (lang==="pt") return n===1?n+" item":n+" itens";
    if (lang==="de") return n===1?n+" Element":n+" Elemente";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" элемент"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" элемента"; return n+" элементов"; }
    return n===1?n+" item":n+" items";
  };
  const dayCountStr = (n) => {
    if (lang==="zh") return n+" 天";
    if (lang==="ja") return n+" 日";
    if (lang==="ko") return n+"일";
    if (lang==="th") return n+" วัน";
    if (lang==="it") return n===1?n+" giorno":n+" giorni";
    if (lang==="es") return n===1?n+" día":n+" días";
    if (lang==="pt") return n===1?n+" dia":n+" dias";
    if (lang==="fr") return n===1?n+" jour":n+" jours";
    if (lang==="de") return n===1?n+" Tag":n+" Tage";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" день"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" дня"; return n+" дней"; }
    return n===1?n+" day":n+" days";
  };
  const roundCountStr = (n) => {
    if (lang==="zh") return n+" 轮";
    if (lang==="ja") return n+" ラウンド";
    if (lang==="ko") return n+"라운드";
    if (lang==="th") return n+" ราวด์";
    if (lang==="it") return n+" round";
    if (lang==="es") return n===1?n+" ronda":n+" rondas";
    if (lang==="fr") return n+" round"+(n!==1?"s":"");
    if (lang==="pt") return n+" round"+(n!==1?"s":"");
    if (lang==="de") return n===1?n+" Runde":n+" Runden";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" раунд"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" раунда"; return n+" раундов"; }
    return n+" round"+(n!==1?"s":"");
  };
  const resultCountStr = (n) => {
    if (lang==="zh") return n+" 条结果";
    if (lang==="ja") return n+" 件";
    if (lang==="ko") return n+"개 결과";
    if (lang==="th") return n+" ผลลัพธ์";
    if (lang==="it") return n===1?n+" risultato":n+" risultati";
    if (lang==="es") return n===1?n+" resultado":n+" resultados";
    if (lang==="fr") return n===1?n+" résultat":n+" résultats";
    if (lang==="pt") return n===1?n+" resultado":n+" resultados";
    if (lang==="de") return n===1?n+" Ergebnis":n+" Ergebnisse";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" результат"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" результата"; return n+" результатов"; }
    return n===1?n+" result":n+" results";
  };
  const stepCountStr = (n) => {
    if (lang==="zh") return n+" 步";
    if (lang==="ja") return n+" ステップ";
    if (lang==="ko") return n+"단계";
    if (lang==="th") return n+" ขั้นตอน";
    if (lang==="it") return n===1?n+" passo":n+" passi";
    if (lang==="es") return n===1?n+" paso":n+" pasos";
    if (lang==="fr") return n===1?n+" étape":n+" étapes";
    if (lang==="pt") return n===1?n+" passo":n+" passos";
    if (lang==="de") return n===1?n+" Schritt":n+" Schritte";
    if (lang==="ru") { const m=n%10,c=n%100; if(m===1&&c!==11) return n+" шаг"; if(m>=2&&m<=4&&(c<10||c>=20)) return n+" шага"; return n+" шагов"; }
    return n+" step"+(n!==1?"s":"");
  };
  return { entryCountStr, moveCountStr, itemCountStr, dayCountStr, roundCountStr, resultCountStr, stepCountStr };
};
