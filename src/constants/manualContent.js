// Manual content — English is the source of truth.
// When updating English, update all other languages to match.

export const MANUAL_CONTENT = {
  en: [
    {
      id:"overview", icon:"book", title:"Overview",
      items:[
        { title:"What is MovesBook?",
          body:"MovesBook is a personal breaking trainer designed to help you train smarter. It covers every stage of your practice: setting goals, building your move library, planning battle sets, and tracking daily habits. Everything is saved locally on your device and synced to the cloud when you're signed in." },
        { title:"The four main tabs",
          body:"HOME — your daily plan with routines, ideas, and goals.\nMOVES — your personal move library, sets, and gap tracker.\nBATTLE — where you plan rounds, prep for events, freestyle, and manage rivals.\nREFLECT — calendar, stance assessment, goals, and notes." },
        { title:"The + button (bottom center)",
          body:"The large + button at the bottom center always opens the Add Move modal, regardless of which tab you're on." },
        { title:"Cloud sync",
          body:"Sign in with Google or Email to sync all your data to the cloud. Your moves, goals, habits, rounds and sets are stored securely and available on any device. If you're not signed in, everything is still saved locally in your browser." },
        { title:"Zoom",
          body:"Use the − and + zoom controls in Settings to scale the entire app up or down. Useful on small screens or when you want a larger touch target. Tap the % number to reset to 100%." },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"What HOME is for",
          body:"HOME is your daily planning space. Build your day with routines, ideas, and goals. Everything is user-added — no hardcoded cards or suggestions." },
        { title:"The tile stack",
          body:"HOME is a single scrollable stack of tiles. Three types:\n• Routine — recurring or one-off activity with emoji, name, duration, description\n• Idea — quick note, video link, or training thought\n• Goal/Habit — pulled from your existing goals and habits data" },
        { title:"Adding tiles",
          body:"Tap '+ Add to today' at the bottom to open the picker. Choose Add Routine, Add Idea, or Add Goal or Habit. Routines can repeat on specific days." },
        { title:"Tile interactions",
          body:"Tap the title row to edit in a bottom sheet. Tap the description to expand/collapse. Tap the checkbox to mark complete. Tap X to remove (with smart confirmations for recurring items)." },
        { title:"Gear menu",
          body:"The gear icon opens options: Reorder tiles, Manage routines, Reset today." },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"What MOVES is for",
          body:"MOVES is your personal move library. Every move you know or are learning lives here. Organise by category, track mastery, add descriptions and video references, and group moves into sets for battle." },
        { title:"Adding a move",
          body:"Tap + in the bottom bar. Fill in:\n• Move name (required)\n• Category\n• Description — technique notes, cues, anything helpful\n• Video link — a YouTube or other reference URL\n• Mastery — 0–100% slider\nTap Save." },
        { title:"Mastery level",
          body:"Mastery is a 0–100% score you assign manually. The bar colour follows:\n• Red — 0–30% (learning)\n• Amber — 30–60% (developing)\n• Yellow — 60–80% (solid)\n• Green — 80–100% (battle-ready)" },
        { title:"Views: Tile, List, Tree",
          body:"Toggle between views with the icons in the LIBRARY header. Tile view shows cards, List view shows rows, Tree view shows move lineage relationships." },
        { title:"Categories",
          body:"Moves are grouped by category. Tap a category to drill in and see its moves. From the menu on a category you can rename, change colour, duplicate, or delete it." },
        { title:"Sets",
          body:"Sets are named groups of moves — a combo or sequence. Go to MOVES > SETS to create one. Give it a name, details, and colour, then add moves from your library." },
        { title:"Flash Cards",
          body:"In the SETS sub-tab, tap the Flash Cards button to start a memory drill. Select which sets to include, then flip through cards testing your recall of each set's moves." },
        { title:"GAP tracker",
          body:"The GAP sub-tab shows which moves are getting stale. Domain-aware freshness tracking helps you identify what needs attention. The Foundation Check banner highlights fundamentals." },
        { title:"Training tools",
          body:"The LIBRARY sub-tab has a tools strip with four creative tools:\n• Explore — creative exploration with modifier chips\n• R/R/R — Restore, Remix, Rebuild prompts with timer\n• Combine — random move combination generator\n• Map — directional move-pairing matrix" },
        { title:"Video links",
          body:"Control how video links appear in Settings: Inside only (link only in the move detail) or Inside & outside (quick-open icon on the card)." },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"What BATTLE is for",
          body:"BATTLE is your competition preparation hub. Plan rounds, prep for events, build freestyle lists, and manage your rivals and sparring partners." },
        { title:"PLAN — Creating a round",
          body:"In BATTLE > PLAN, tap + to open the New Round modal. Set a name, colour, and number of entry slots. Each entry holds moves or sets from your library." },
        { title:"PLAN — Templates",
          body:"Save your current round layout as a named template. Load it back anytime. Templates store the full structure including tension dots (Round Arc)." },
        { title:"PLAN — Competition Simulator",
          body:"Tap SIMULATE COMPETITION at the top of PLAN to run a bracket-style practice session with configurable rounds, rest periods, and full summary." },
        { title:"PREP — Battle Prep",
          body:"BATTLE > PREP is for multi-battle sequential training. Create battle cards with event details, location (auto-links to Google Maps), event URL, and countdown. Battle Day mode walks you through pre-battle checklist, reflection, and shareable card." },
        { title:"FREESTYLE",
          body:"Build a live list of moves to cycle through during a jam or cypher. Search by name or category, select moves or entire sets. Tap a move to mark it as used. Trust Mode toggle available." },
        { title:"RIVALS",
          body:"BATTLE > RIVALS has three sub-tabs: RIVALS, SPARRING MATE, and CREW. Add people with full profiles including strong domains, signature moves, game plan, and spar history. Use the eye icon to blur all cards for privacy." },
        { title:"1v1 Spar",
          body:"Access Spar from HOME. Choose Solo or 1v1 mode. In 1v1, set up opponent name, round count, and location. Coin flip for who goes first. Timer tracks each side's rounds. Summary is shareable with your partner." },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"What REFLECT is for",
          body:"REFLECT is where you review your progress. Calendar shows all activity, Stance tracks your self-assessment, Goals tracks your targets, and Notes stores your thoughts." },
        { title:"CALENDAR",
          body:"Month grid with day detail view. Tap any day to see all sessions: training, spar, flash cards, battle prep, and more. Session journal and body log available per day." },
        { title:"STANCE — MyStance",
          body:"Self-assess across 6 breaking domains on a 1–10 scale. A hexagonal radar chart visualises your profile. Measured stats supplement your self-assessment." },
        { title:"STANCE — Development Story",
          body:"After 90+ days of data, an auto-generated factual narrative summarises your journey. Shareable as a card." },
        { title:"GOALS",
          body:"Goal cards with progress tracking and deadlines. Two types: Journey Goals (qualitative milestones with plans) and Target Goals (numbers to reach with counters)." },
        { title:"NOTES",
          body:"Chronological notes and post-session reflections. Use for combo ideas, observations, references, or anything your brain needs to offload." },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"Training Tools",
      items:[
        { title:"Explore",
          body:"Creative exploration tool with modifier chips and 4 modes. Access from MOVES > LIBRARY tools strip. Pick a mode, add constraints, and explore new movement ideas." },
        { title:"R/R/R (Restore / Remix / Rebuild)",
          body:"Curated prompts to revisit and transform existing moves. Timer options: 1, 3, 5, 10 minutes, Custom, or No Limit. Access from MOVES > LIBRARY tools strip." },
        { title:"Combine",
          body:"Random move combination generator. Pulls from your library to create unexpected pairings. Access from MOVES > LIBRARY tools strip." },
        { title:"Map",
          body:"Directional move-pairing matrix. Map which moves flow into which, building your transition vocabulary. Access from MOVES > LIBRARY tools strip." },
        { title:"Drill",
          body:"Timed rep sessions with body check-in and reflection. Track reps of specific moves with a counter and timer." },
        { title:"Spar",
          body:"Solo or 1v1 sparring sessions. Solo mode: timed rounds with personal record tracking. 1v1 mode: alternating rounds with an opponent, shareable summary." },
        { title:"Flow",
          body:"Musicality practice sessions. Put on music, set a timer, and focus on dancing to the beat. Reflection after each session." },
      ]
    },
    {
      id:"profile", icon:"👤", title:"Profile & Settings",
      items:[
        { title:"Your profile",
          body:"Tap the profile avatar in the header. Set your nickname, age, breaking start date, goals, and why you break. Your nickname shows in the header as 'MOVESBOOK of [name]'." },
        { title:"Settings",
          body:"Access via the sprocket icon in the header or inside the Profile overlay. Configure theme, text size, language, default view, mastery display, and more." },
        { title:"Backup",
          body:"Save and restore your data as a JSON file. Available in the Profile overlay under the Data section. Additional save/load buttons in MOVES > LIBRARY for quick move backup." },
        { title:"Language",
          body:"MovesBook supports 12 languages: English, Italian, Spanish, French, Portuguese, German, Japanese, Chinese, Russian, Korean, Thai, and Vietnamese. Change in Settings." },
        { title:"Legal",
          body:"Privacy Policy, Terms of Service, and Disclaimers are accessible from the Profile overlay under the Legal section." },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"Tips & Tricks",
      items:[
        { title:"Use emojis in titles",
          body:"Goals, habits, notes and moves all support emojis in the title. E.g. '👟 Daily Practice', '🏹 Learn 20 moves'. Makes lists easier to scan." },
        { title:"Use sets for signature combos",
          body:"Create a Set in MOVES > SETS for your signature combo or opening sequence. Add it to your Freestyle list or Battle round as a single entry." },
        { title:"Keep notes short",
          body:"Notes work best as quick captures. If something needs structure, it's probably a Goal. Use Notes for fragments and observations." },
        { title:"Check in daily",
          body:"Open the app after training and check off your routines on the HOME tab. Build the habit of reflection." },
        { title:"Add descriptions to moves",
          body:"The description field on a move is your personal technique note — key cues, common mistakes, what to focus on. It shows as a preview on the tile." },
        { title:"Export before big changes",
          body:"Before clearing your move library, use the Backup feature to save a JSON backup. Restore it anytime from the Profile overlay." },
      ]
    },
  ],

  it: [
    {
      id:"overview", icon:"book", title:"Panoramica",
      items:[
        { title:"Cos'è MovesBook?",
          body:"MovesBook è un trainer personale per breaking progettato per aiutarti ad allenarti in modo più intelligente. Copre ogni fase della tua pratica: impostare obiettivi, costruire la tua libreria di mosse, pianificare set per le battle e monitorare le abitudini quotidiane. Tutto viene salvato localmente sul tuo dispositivo e sincronizzato nel cloud quando sei connesso." },
        { title:"Le quattro schede principali",
          body:"HOME — il tuo piano giornaliero con routine, idee e obiettivi.\nMOVES — la tua libreria di mosse personale, set e tracker di gap.\nBATTLE — dove pianifichi round, prepari eventi, freestyle e gestisci i rivali.\nREFLECT — calendario, valutazione stance, obiettivi e note." },
        { title:"Il pulsante + (centro in basso)",
          body:"Il grande pulsante + in basso al centro apre sempre il modal Aggiungi Mossa, indipendentemente dalla scheda in cui ti trovi." },
        { title:"Sincronizzazione cloud",
          body:"Accedi con Google o Email per sincronizzare tutti i tuoi dati nel cloud. Le tue mosse, obiettivi, abitudini, round e set sono conservati in modo sicuro e disponibili su qualsiasi dispositivo. Se non sei connesso, tutto viene comunque salvato localmente nel browser." },
        { title:"Zoom",
          body:"Usa i controlli di zoom − e + nelle Impostazioni per scalare l'intera app. Utile su schermi piccoli o quando vuoi un target touch più grande. Tocca il numero % per ripristinare al 100%." },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"A cosa serve HOME",
          body:"HOME è il tuo spazio di pianificazione giornaliera. Costruisci la tua giornata con routine, idee e obiettivi. Tutto è aggiunto dall'utente — nessuna carta preimpostata o suggerimento." },
        { title:"Lo stack di tile",
          body:"HOME è una singola pila scorrevole di tile. Tre tipi:\n• Routine — attività ricorrente o una tantum con emoji, nome, durata, descrizione\n• Idea — nota veloce, link video o pensiero di allenamento\n• Obiettivo/Abitudine — preso dai tuoi dati esistenti di obiettivi e abitudini" },
        { title:"Aggiungere tile",
          body:"Tocca '+ Aggiungi a oggi' in basso per aprire il selettore. Scegli Aggiungi Routine, Aggiungi Idea o Aggiungi Obiettivo o Abitudine. Le routine possono ripetersi in giorni specifici." },
        { title:"Interazioni con le tile",
          body:"Tocca la riga del titolo per modificare nel bottom sheet. Tocca la descrizione per espandere/comprimere. Tocca la checkbox per completare. Tocca X per rimuovere (con conferme intelligenti per elementi ricorrenti)." },
        { title:"Menu ingranaggio",
          body:"L'icona dell'ingranaggio apre le opzioni: Riordina tile, Gestisci routine, Ripristina oggi." },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"A cosa serve MOVES",
          body:"MOVES è la tua libreria di mosse personale. Ogni mossa che conosci o stai imparando vive qui. Organizza per categoria, traccia la padronanza, aggiungi descrizioni e riferimenti video, e raggruppa le mosse in set per la battle." },
        { title:"Aggiungere una mossa",
          body:"Tocca + nella barra in basso. Compila:\n• Nome della mossa (obbligatorio)\n• Categoria\n• Descrizione — note tecniche, suggerimenti\n• Link video — un URL di riferimento YouTube o altro\n• Padronanza — slider 0–100%\nTocca Salva." },
        { title:"Livello di padronanza",
          body:"La padronanza è un punteggio 0–100% che assegni manualmente. Il colore della barra segue:\n• Rosso — 0–30% (apprendimento)\n• Ambra — 30–60% (sviluppo)\n• Giallo — 60–80% (solido)\n• Verde — 80–100% (pronto per la battle)" },
        { title:"Viste: Tile, Lista, Albero",
          body:"Alterna tra le viste con le icone nell'intestazione della LIBRERIA. Vista Tile mostra le carte, Vista Lista mostra le righe, Vista Albero mostra le relazioni di discendenza delle mosse." },
        { title:"Categorie",
          body:"Le mosse sono raggruppate per categoria. Tocca una categoria per vedere le sue mosse. Dal menu puoi rinominare, cambiare colore, duplicare o eliminare." },
        { title:"Set",
          body:"I set sono gruppi di mosse con un nome — una combo o sequenza. Vai a MOVES > SET per crearne uno. Dai un nome, dettagli e colore, poi aggiungi mosse dalla tua libreria." },
        { title:"Flash Cards",
          body:"Nel sotto-tab SET, tocca il pulsante Flash Cards per iniziare un esercizio di memoria. Seleziona quali set includere, poi sfoglia le carte testando il tuo ricordo delle mosse di ogni set." },
        { title:"Tracker GAP",
          body:"Il sotto-tab GAP mostra quali mosse stanno diventando stantie. Il tracciamento della freschezza per dominio ti aiuta a identificare cosa necessita attenzione. Il banner Foundation Check evidenzia i fondamentali." },
        { title:"Strumenti di allenamento",
          body:"Il sotto-tab LIBRERIA ha una striscia di strumenti con quattro tool creativi:\n• Explore — esplorazione creativa con chip modificatori\n• R/R/R — prompt Ripristina, Remixa, Ricostruisci con timer\n• Combine — generatore di combinazioni casuali di mosse\n• Map — matrice di accoppiamento direzionale delle mosse" },
        { title:"Link video",
          body:"Controlla come appaiono i link video nelle Impostazioni: Solo dentro (link solo nel dettaglio della mossa) o Dentro e fuori (icona di apertura rapida sulla carta)." },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"A cosa serve BATTLE",
          body:"BATTLE è il tuo hub di preparazione alle competizioni. Pianifica round, preparati per eventi, costruisci liste freestyle e gestisci rivali e partner di allenamento." },
        { title:"PLAN — Creare un round",
          body:"In BATTLE > PLAN, tocca + per aprire il modal Nuovo Round. Imposta un nome, colore e numero di slot. Ogni slot contiene mosse o set dalla tua libreria." },
        { title:"PLAN — Template",
          body:"Salva il layout dei round corrente come template. Ricaricalo in qualsiasi momento. I template conservano l'intera struttura inclusi i punti di tensione (Round Arc)." },
        { title:"PLAN — Simulatore di Competizione",
          body:"Tocca SIMULA COMPETIZIONE in cima a PLAN per eseguire una sessione di pratica con tabellone, round configurabili, periodi di riposo e riepilogo completo." },
        { title:"PREP — Preparazione Battle",
          body:"BATTLE > PREP è per l'allenamento multi-battle sequenziale. Crea carte battle con dettagli dell'evento, luogo (link automatico a Google Maps), URL dell'evento e conto alla rovescia. La modalità Battle Day ti guida attraverso checklist pre-battle, riflessione e carta condivisibile." },
        { title:"FREESTYLE",
          body:"Costruisci una lista live di mosse da ciclare durante un jam o cypher. Cerca per nome o categoria, seleziona mosse o interi set. Tocca una mossa per segnarla come usata. Toggle Trust Mode disponibile." },
        { title:"RIVALS",
          body:"BATTLE > RIVALS ha tre sotto-tab: RIVALS, SPARRING MATE e CREW. Aggiungi persone con profili completi inclusi domini forti, mosse firma, piano di gioco e storico spar. Usa l'icona occhio per sfocare tutte le carte per privacy." },
        { title:"1v1 Spar",
          body:"Accedi a Spar da HOME. Scegli modalità Solo o 1v1. In 1v1, imposta nome avversario, conteggio round e luogo. Lancio moneta per chi inizia. Il timer traccia i round di ogni lato. Il riepilogo è condivisibile con il tuo partner." },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"A cosa serve REFLECT",
          body:"REFLECT è dove rivedi i tuoi progressi. Il Calendario mostra tutta l'attività, Stance traccia la tua auto-valutazione, Obiettivi traccia i tuoi target e Note conserva i tuoi pensieri." },
        { title:"CALENDARIO",
          body:"Griglia mensile con vista dettaglio giorno. Tocca qualsiasi giorno per vedere tutte le sessioni: allenamento, spar, flash cards, prep battle e altro. Diario di sessione e log corporeo disponibili per ogni giorno." },
        { title:"STANCE — MyStance",
          body:"Auto-valutati in 6 domini del breaking su una scala 1–10. Un grafico radar esagonale visualizza il tuo profilo. Statistiche misurate completano la tua auto-valutazione." },
        { title:"STANCE — Development Story",
          body:"Dopo 90+ giorni di dati, una narrazione fattuale auto-generata riassume il tuo percorso. Condivisibile come carta." },
        { title:"OBIETTIVI",
          body:"Carte obiettivo con tracciamento progressi e scadenze. Due tipi: Journey Goals (traguardi qualitativi con piani) e Target Goals (numeri da raggiungere con contatori)." },
        { title:"NOTE",
          body:"Note cronologiche e riflessioni post-sessione. Usale per idee combo, osservazioni, riferimenti o qualsiasi cosa la tua mente debba scaricare." },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"Strumenti di Allenamento",
      items:[
        { title:"Explore",
          body:"Strumento di esplorazione creativa con chip modificatori e 4 modalità. Accesso da MOVES > LIBRERIA striscia strumenti. Scegli una modalità, aggiungi vincoli ed esplora nuove idee di movimento." },
        { title:"R/R/R (Ripristina / Remixa / Ricostruisci)",
          body:"Prompt curati per rivisitare e trasformare mosse esistenti. Opzioni timer: 1, 3, 5, 10 minuti, Personalizzato o Senza Limite. Accesso da MOVES > LIBRERIA striscia strumenti." },
        { title:"Combine",
          body:"Generatore di combinazioni casuali di mosse. Pesca dalla tua libreria per creare accoppiamenti inaspettati. Accesso da MOVES > LIBRERIA striscia strumenti." },
        { title:"Map",
          body:"Matrice di accoppiamento direzionale delle mosse. Mappa quali mosse fluiscono in quali altre, costruendo il tuo vocabolario di transizioni. Accesso da MOVES > LIBRERIA striscia strumenti." },
        { title:"Drill",
          body:"Sessioni di ripetizioni a tempo con check-in corporeo e riflessione. Traccia le ripetizioni di mosse specifiche con contatore e timer." },
        { title:"Spar",
          body:"Sessioni di sparring solo o 1v1. Modalità Solo: round a tempo con tracciamento record personali. Modalità 1v1: round alternati con un avversario, riepilogo condivisibile." },
        { title:"Flow",
          body:"Sessioni di pratica di musicalità. Metti la musica, imposta un timer e concentrati sul ballare a tempo. Riflessione dopo ogni sessione." },
      ]
    },
    {
      id:"profile", icon:"👤", title:"Profilo e Impostazioni",
      items:[
        { title:"Il tuo profilo",
          body:"Tocca l'avatar del profilo nell'intestazione. Imposta il tuo soprannome, età, data di inizio breaking, obiettivi e perché balli. Il tuo soprannome appare nell'intestazione come 'MOVESBOOK di [nome]'." },
        { title:"Impostazioni",
          body:"Accedi tramite l'icona dell'ingranaggio nell'intestazione o all'interno dell'overlay Profilo. Configura tema, dimensione testo, lingua, vista predefinita, visualizzazione padronanza e altro." },
        { title:"Backup",
          body:"Salva e ripristina i tuoi dati come file JSON. Disponibile nell'overlay Profilo nella sezione Dati. Pulsanti aggiuntivi salva/carica in MOVES > LIBRERIA per backup rapido delle mosse." },
        { title:"Lingua",
          body:"MovesBook supporta 12 lingue: Inglese, Italiano, Spagnolo, Francese, Portoghese, Tedesco, Giapponese, Cinese, Russo, Coreano, Thailandese e Vietnamita. Cambia nelle Impostazioni." },
        { title:"Legale",
          body:"Informativa sulla Privacy, Termini di Servizio e Avvertenze sono accessibili dall'overlay Profilo nella sezione Legale." },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"Consigli e Trucchi",
      items:[
        { title:"Usa emoji nei titoli",
          body:"Obiettivi, abitudini, note e mosse supportano tutti emoji nel titolo. Es. '👟 Pratica Quotidiana', '🏹 Impara 20 mosse'. Rende le liste più facili da scansionare." },
        { title:"Usa i set per combo firma",
          body:"Crea un Set in MOVES > SET per la tua combo firma o sequenza di apertura. Aggiungilo alla tua lista Freestyle o round Battle come singolo elemento." },
        { title:"Tieni le note brevi",
          body:"Le note funzionano meglio come catture rapide. Se qualcosa necessita struttura, probabilmente è un Obiettivo. Usa le Note per frammenti e osservazioni." },
        { title:"Fai check-in giornaliero",
          body:"Apri l'app dopo l'allenamento e spunta le tue routine nella scheda HOME. Costruisci l'abitudine della riflessione." },
        { title:"Aggiungi descrizioni alle mosse",
          body:"Il campo descrizione su una mossa è la tua nota tecnica personale — suggerimenti chiave, errori comuni, su cosa concentrarsi. Appare come anteprima sulla tile." },
        { title:"Esporta prima di grandi cambiamenti",
          body:"Prima di svuotare la libreria mosse, usa la funzione Backup per salvare un backup JSON. Ripristinalo in qualsiasi momento dall'overlay Profilo." },
      ]
    },
  ],

  es: [
    {
      id:"overview", icon:"book", title:"Descripción General",
      items:[
        { title:"¿Qué es MovesBook?",
          body:"MovesBook es un entrenador personal de breaking diseñado para ayudarte a entrenar de manera más inteligente. Cubre cada etapa de tu práctica: establecer objetivos, construir tu biblioteca de movimientos, planificar sets de batalla y hacer seguimiento de hábitos diarios. Todo se guarda localmente en tu dispositivo y se sincroniza en la nube cuando inicias sesión." },
        { title:"Las cuatro pestañas principales",
          body:"HOME — tu plan diario con rutinas, ideas y objetivos.\nMOVES — tu biblioteca personal de movimientos, sets y rastreador de gaps.\nBATTLE — donde planificas rounds, preparas eventos, freestyle y gestionas rivales.\nREFLECT — calendario, evaluación de stance, objetivos y notas." },
        { title:"El botón + (centro inferior)",
          body:"El gran botón + en el centro inferior siempre abre el modal Agregar Movimiento, sin importar en qué pestaña estés." },
        { title:"Sincronización en la nube",
          body:"Inicia sesión con Google o Email para sincronizar todos tus datos en la nube. Tus movimientos, objetivos, hábitos, rounds y sets se almacenan de forma segura y están disponibles en cualquier dispositivo. Si no has iniciado sesión, todo se guarda localmente en tu navegador." },
        { title:"Zoom",
          body:"Usa los controles de zoom − y + en Configuración para escalar toda la app. Útil en pantallas pequeñas o cuando quieres un objetivo táctil más grande. Toca el número % para restablecer al 100%." },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"Para qué sirve HOME",
          body:"HOME es tu espacio de planificación diaria. Construye tu día con rutinas, ideas y objetivos. Todo es añadido por el usuario — sin tarjetas predefinidas ni sugerencias." },
        { title:"La pila de tiles",
          body:"HOME es una sola pila desplazable de tiles. Tres tipos:\n• Rutina — actividad recurrente o única con emoji, nombre, duración, descripción\n• Idea — nota rápida, enlace de video o pensamiento de entrenamiento\n• Objetivo/Hábito — tomado de tus datos existentes de objetivos y hábitos" },
        { title:"Agregar tiles",
          body:"Toca '+ Agregar a hoy' en la parte inferior para abrir el selector. Elige Agregar Rutina, Agregar Idea o Agregar Objetivo o Hábito. Las rutinas pueden repetirse en días específicos." },
        { title:"Interacciones con tiles",
          body:"Toca la fila del título para editar en bottom sheet. Toca la descripción para expandir/contraer. Toca la casilla para completar. Toca X para eliminar (con confirmaciones inteligentes para elementos recurrentes)." },
        { title:"Menú de engranaje",
          body:"El icono de engranaje abre opciones: Reordenar tiles, Gestionar rutinas, Reiniciar hoy." },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"Para qué sirve MOVES",
          body:"MOVES es tu biblioteca personal de movimientos. Cada movimiento que conoces o estás aprendiendo vive aquí. Organiza por categoría, rastrea el dominio, agrega descripciones y referencias de video, y agrupa movimientos en sets para batalla." },
        { title:"Agregar un movimiento",
          body:"Toca + en la barra inferior. Completa:\n• Nombre del movimiento (obligatorio)\n• Categoría\n• Descripción — notas técnicas, consejos\n• Enlace de video — URL de referencia de YouTube u otro\n• Dominio — slider 0–100%\nToca Guardar." },
        { title:"Nivel de dominio",
          body:"El dominio es un puntaje de 0–100% que asignas manualmente. El color de la barra sigue:\n• Rojo — 0–30% (aprendiendo)\n• Ámbar — 30–60% (desarrollando)\n• Amarillo — 60–80% (sólido)\n• Verde — 80–100% (listo para batalla)" },
        { title:"Vistas: Tile, Lista, Árbol",
          body:"Alterna entre vistas con los iconos en el encabezado de BIBLIOTECA. Vista Tile muestra tarjetas, Vista Lista muestra filas, Vista Árbol muestra relaciones de linaje de movimientos." },
        { title:"Categorías",
          body:"Los movimientos se agrupan por categoría. Toca una categoría para ver sus movimientos. Desde el menú puedes renombrar, cambiar color, duplicar o eliminar." },
        { title:"Sets",
          body:"Los sets son grupos de movimientos con nombre — una combo o secuencia. Ve a MOVES > SETS para crear uno. Dale un nombre, detalles y color, luego agrega movimientos de tu biblioteca." },
        { title:"Flash Cards",
          body:"En la sub-pestaña SETS, toca el botón Flash Cards para iniciar un ejercicio de memoria. Selecciona qué sets incluir, luego voltea las tarjetas probando tu recuerdo de los movimientos de cada set." },
        { title:"Rastreador GAP",
          body:"La sub-pestaña GAP muestra qué movimientos se están volviendo obsoletos. El seguimiento de frescura por dominio te ayuda a identificar qué necesita atención. El banner Foundation Check destaca los fundamentos." },
        { title:"Herramientas de entrenamiento",
          body:"La sub-pestaña BIBLIOTECA tiene una franja de herramientas con cuatro tools creativos:\n• Explore — exploración creativa con chips modificadores\n• R/R/R — prompts Restaurar, Remixar, Reconstruir con timer\n• Combine — generador de combinaciones aleatorias de movimientos\n• Map — matriz de emparejamiento direccional de movimientos" },
        { title:"Enlaces de video",
          body:"Controla cómo aparecen los enlaces de video en Configuración: Solo dentro (enlace solo en el detalle del movimiento) o Dentro y fuera (icono de apertura rápida en la tarjeta)." },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"Para qué sirve BATTLE",
          body:"BATTLE es tu centro de preparación para competiciones. Planifica rounds, prepárate para eventos, construye listas de freestyle y gestiona tus rivales y compañeros de entrenamiento." },
        { title:"PLAN — Crear un round",
          body:"En BATTLE > PLAN, toca + para abrir el modal Nuevo Round. Establece un nombre, color y número de slots. Cada slot contiene movimientos o sets de tu biblioteca." },
        { title:"PLAN — Plantillas",
          body:"Guarda tu diseño de rounds actual como plantilla. Recárgala en cualquier momento. Las plantillas conservan la estructura completa incluyendo puntos de tensión (Round Arc)." },
        { title:"PLAN — Simulador de Competición",
          body:"Toca SIMULAR COMPETICIÓN en la parte superior de PLAN para ejecutar una sesión de práctica con bracket, rounds configurables, períodos de descanso y resumen completo." },
        { title:"PREP — Preparación de Batalla",
          body:"BATTLE > PREP es para entrenamiento multi-batalla secuencial. Crea tarjetas de batalla con detalles del evento, ubicación (enlace automático a Google Maps), URL del evento y cuenta regresiva. El modo Battle Day te guía a través de la checklist pre-batalla, reflexión y tarjeta compartible." },
        { title:"FREESTYLE",
          body:"Construye una lista en vivo de movimientos para recorrer durante un jam o cypher. Busca por nombre o categoría, selecciona movimientos o sets completos. Toca un movimiento para marcarlo como usado. Toggle Trust Mode disponible." },
        { title:"RIVALS",
          body:"BATTLE > RIVALS tiene tres sub-pestañas: RIVALS, SPARRING MATE y CREW. Agrega personas con perfiles completos incluyendo dominios fuertes, movimientos firma, plan de juego e historial de spar. Usa el icono del ojo para difuminar todas las tarjetas por privacidad." },
        { title:"1v1 Spar",
          body:"Accede a Spar desde HOME. Elige modo Solo o 1v1. En 1v1, configura nombre del oponente, conteo de rounds y ubicación. Lanzamiento de moneda para quién empieza primero. El timer rastrea los rounds de cada lado. El resumen es compartible con tu compañero." },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"Para qué sirve REFLECT",
          body:"REFLECT es donde revisas tu progreso. El Calendario muestra toda la actividad, Stance rastrea tu auto-evaluación, Objetivos rastrea tus metas y Notas guarda tus pensamientos." },
        { title:"CALENDARIO",
          body:"Cuadrícula mensual con vista detalle del día. Toca cualquier día para ver todas las sesiones: entrenamiento, spar, flash cards, prep batalla y más. Diario de sesión y registro corporal disponibles por día." },
        { title:"STANCE — MyStance",
          body:"Auto-evalúate en 6 dominios del breaking en una escala 1–10. Un gráfico radar hexagonal visualiza tu perfil. Estadísticas medidas complementan tu auto-evaluación." },
        { title:"STANCE — Development Story",
          body:"Después de 90+ días de datos, una narrativa factual auto-generada resume tu trayectoria. Compartible como tarjeta." },
        { title:"OBJETIVOS",
          body:"Tarjetas de objetivo con seguimiento de progreso y plazos. Dos tipos: Journey Goals (hitos cualitativos con planes) y Target Goals (números a alcanzar con contadores)." },
        { title:"NOTAS",
          body:"Notas cronológicas y reflexiones post-sesión. Úsalas para ideas de combos, observaciones, referencias o cualquier cosa que tu mente necesite descargar." },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"Herramientas de Entrenamiento",
      items:[
        { title:"Explore",
          body:"Herramienta de exploración creativa con chips modificadores y 4 modos. Acceso desde MOVES > BIBLIOTECA franja de herramientas. Elige un modo, agrega restricciones y explora nuevas ideas de movimiento." },
        { title:"R/R/R (Restaurar / Remixar / Reconstruir)",
          body:"Prompts curados para revisitar y transformar movimientos existentes. Opciones de timer: 1, 3, 5, 10 minutos, Personalizado o Sin Límite. Acceso desde MOVES > BIBLIOTECA franja de herramientas." },
        { title:"Combine",
          body:"Generador de combinaciones aleatorias de movimientos. Toma de tu biblioteca para crear emparejamientos inesperados. Acceso desde MOVES > BIBLIOTECA franja de herramientas." },
        { title:"Map",
          body:"Matriz de emparejamiento direccional de movimientos. Mapea qué movimientos fluyen hacia cuáles, construyendo tu vocabulario de transiciones. Acceso desde MOVES > BIBLIOTECA franja de herramientas." },
        { title:"Drill",
          body:"Sesiones de repeticiones cronometradas con check-in corporal y reflexión. Rastrea repeticiones de movimientos específicos con contador y timer." },
        { title:"Spar",
          body:"Sesiones de sparring solo o 1v1. Modo Solo: rounds cronometrados con seguimiento de récords personales. Modo 1v1: rounds alternados con un oponente, resumen compartible." },
        { title:"Flow",
          body:"Sesiones de práctica de musicalidad. Pon música, establece un timer y concéntrate en bailar al ritmo. Reflexión después de cada sesión." },
      ]
    },
    {
      id:"profile", icon:"👤", title:"Perfil y Configuración",
      items:[
        { title:"Tu perfil",
          body:"Toca el avatar del perfil en el encabezado. Establece tu apodo, edad, fecha de inicio de breaking, objetivos y por qué bailas. Tu apodo aparece en el encabezado como 'MOVESBOOK de [nombre]'." },
        { title:"Configuración",
          body:"Accede a través del icono de engranaje en el encabezado o dentro del overlay de Perfil. Configura tema, tamaño de texto, idioma, vista predeterminada, visualización de dominio y más." },
        { title:"Respaldo",
          body:"Guarda y restaura tus datos como archivo JSON. Disponible en el overlay de Perfil en la sección Datos. Botones adicionales guardar/cargar en MOVES > BIBLIOTECA para respaldo rápido de movimientos." },
        { title:"Idioma",
          body:"MovesBook soporta 12 idiomas: Inglés, Italiano, Español, Francés, Portugués, Alemán, Japonés, Chino, Ruso, Coreano, Tailandés y Vietnamita. Cambia en Configuración." },
        { title:"Legal",
          body:"Política de Privacidad, Términos de Servicio y Descargos de Responsabilidad son accesibles desde el overlay de Perfil en la sección Legal." },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"Consejos y Trucos",
      items:[
        { title:"Usa emojis en los títulos",
          body:"Objetivos, hábitos, notas y movimientos soportan emojis en el título. Ej. '👟 Práctica Diaria', '🏹 Aprende 20 movimientos'. Hace las listas más fáciles de escanear." },
        { title:"Usa sets para combos firma",
          body:"Crea un Set en MOVES > SETS para tu combo firma o secuencia de apertura. Agrégalo a tu lista Freestyle o round de Batalla como un solo elemento." },
        { title:"Mantén las notas cortas",
          body:"Las notas funcionan mejor como capturas rápidas. Si algo necesita estructura, probablemente es un Objetivo. Usa las Notas para fragmentos y observaciones." },
        { title:"Haz check-in diario",
          body:"Abre la app después del entrenamiento y marca tus rutinas en la pestaña HOME. Construye el hábito de la reflexión." },
        { title:"Agrega descripciones a los movimientos",
          body:"El campo de descripción en un movimiento es tu nota técnica personal — consejos clave, errores comunes, en qué enfocarte. Aparece como vista previa en la tile." },
        { title:"Exporta antes de grandes cambios",
          body:"Antes de vaciar la biblioteca de movimientos, usa la función de Respaldo para guardar un backup JSON. Restáuralo en cualquier momento desde el overlay de Perfil." },
      ]
    },
  ],

  fr: [
    {
      id:"overview", icon:"book", title:"Aperçu",
      items:[
        { title:"Qu'est-ce que MovesBook ?",
          body:"MovesBook est un entraîneur personnel de breaking conçu pour vous aider à vous entraîner plus intelligemment. Il couvre chaque étape de votre pratique : définir des objectifs, construire votre bibliothèque de mouvements, planifier des sets de battle et suivre les habitudes quotidiennes. Tout est sauvegardé localement sur votre appareil et synchronisé dans le cloud lorsque vous êtes connecté." },
        { title:"Les quatre onglets principaux",
          body:"HOME — votre plan quotidien avec routines, idées et objectifs.\nMOVES — votre bibliothèque de mouvements personnelle, sets et suivi de gaps.\nBATTLE — où vous planifiez les rounds, préparez les événements, freestyle et gérez les rivaux.\nREFLECT — calendrier, évaluation de stance, objectifs et notes." },
        { title:"Le bouton + (centre bas)",
          body:"Le grand bouton + en bas au centre ouvre toujours le modal Ajouter un Mouvement, quel que soit l'onglet actif." },
        { title:"Synchronisation cloud",
          body:"Connectez-vous avec Google ou Email pour synchroniser toutes vos données dans le cloud. Vos mouvements, objectifs, habitudes, rounds et sets sont stockés en sécurité et disponibles sur tout appareil. Sans connexion, tout est sauvegardé localement dans votre navigateur." },
        { title:"Zoom",
          body:"Utilisez les contrôles de zoom − et + dans les Paramètres pour redimensionner toute l'app. Utile sur petits écrans ou pour des cibles tactiles plus grandes. Tapez le nombre % pour réinitialiser à 100%." },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"À quoi sert HOME",
          body:"HOME est votre espace de planification quotidienne. Construisez votre journée avec des routines, idées et objectifs. Tout est ajouté par l'utilisateur — pas de cartes prédéfinies ni de suggestions." },
        { title:"La pile de tiles",
          body:"HOME est une seule pile défilable de tiles. Trois types :\n• Routine — activité récurrente ou ponctuelle avec emoji, nom, durée, description\n• Idée — note rapide, lien vidéo ou pensée d'entraînement\n• Objectif/Habitude — tiré de vos données existantes d'objectifs et habitudes" },
        { title:"Ajouter des tiles",
          body:"Tapez '+ Ajouter à aujourd'hui' en bas pour ouvrir le sélecteur. Choisissez Ajouter Routine, Ajouter Idée ou Ajouter Objectif ou Habitude. Les routines peuvent se répéter certains jours." },
        { title:"Interactions avec les tiles",
          body:"Tapez la ligne du titre pour modifier dans le bottom sheet. Tapez la description pour développer/réduire. Tapez la case pour compléter. Tapez X pour supprimer (avec confirmations intelligentes pour les éléments récurrents)." },
        { title:"Menu engrenage",
          body:"L'icône d'engrenage ouvre les options : Réorganiser les tiles, Gérer les routines, Réinitialiser aujourd'hui." },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"À quoi sert MOVES",
          body:"MOVES est votre bibliothèque de mouvements personnelle. Chaque mouvement que vous connaissez ou apprenez vit ici. Organisez par catégorie, suivez la maîtrise, ajoutez des descriptions et références vidéo, et groupez les mouvements en sets pour la battle." },
        { title:"Ajouter un mouvement",
          body:"Tapez + dans la barre du bas. Remplissez :\n• Nom du mouvement (obligatoire)\n• Catégorie\n• Description — notes techniques, conseils\n• Lien vidéo — URL de référence YouTube ou autre\n• Maîtrise — curseur 0–100%\nTapez Sauvegarder." },
        { title:"Niveau de maîtrise",
          body:"La maîtrise est un score de 0–100% que vous attribuez manuellement. La couleur de la barre suit :\n• Rouge — 0–30% (apprentissage)\n• Ambre — 30–60% (développement)\n• Jaune — 60–80% (solide)\n• Vert — 80–100% (prêt pour la battle)" },
        { title:"Vues : Tile, Liste, Arbre",
          body:"Alternez entre les vues avec les icônes dans l'en-tête de la BIBLIOTHÈQUE. Vue Tile montre les cartes, Vue Liste montre les lignes, Vue Arbre montre les relations de lignée des mouvements." },
        { title:"Catégories",
          body:"Les mouvements sont groupés par catégorie. Tapez une catégorie pour voir ses mouvements. Depuis le menu vous pouvez renommer, changer la couleur, dupliquer ou supprimer." },
        { title:"Sets",
          body:"Les sets sont des groupes de mouvements nommés — une combo ou séquence. Allez à MOVES > SETS pour en créer un. Donnez un nom, des détails et une couleur, puis ajoutez des mouvements de votre bibliothèque." },
        { title:"Flash Cards",
          body:"Dans le sous-onglet SETS, tapez le bouton Flash Cards pour démarrer un exercice de mémoire. Sélectionnez quels sets inclure, puis feuilletez les cartes en testant votre rappel des mouvements de chaque set." },
        { title:"Suivi GAP",
          body:"Le sous-onglet GAP montre quels mouvements deviennent obsolètes. Le suivi de fraîcheur par domaine vous aide à identifier ce qui nécessite attention. La bannière Foundation Check met en évidence les fondamentaux." },
        { title:"Outils d'entraînement",
          body:"Le sous-onglet BIBLIOTHÈQUE a une bande d'outils avec quatre outils créatifs :\n• Explore — exploration créative avec chips modificateurs\n• R/R/R — prompts Restaurer, Remixer, Reconstruire avec timer\n• Combine — générateur de combinaisons aléatoires\n• Map — matrice d'appariement directionnel des mouvements" },
        { title:"Liens vidéo",
          body:"Contrôlez comment les liens vidéo apparaissent dans les Paramètres : Intérieur seulement (lien uniquement dans le détail) ou Intérieur et extérieur (icône d'ouverture rapide sur la carte)." },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"À quoi sert BATTLE",
          body:"BATTLE est votre centre de préparation aux compétitions. Planifiez des rounds, préparez des événements, construisez des listes freestyle et gérez vos rivaux et partenaires d'entraînement." },
        { title:"PLAN — Créer un round",
          body:"Dans BATTLE > PLAN, tapez + pour ouvrir le modal Nouveau Round. Définissez un nom, une couleur et un nombre de slots. Chaque slot contient des mouvements ou sets de votre bibliothèque." },
        { title:"PLAN — Modèles",
          body:"Sauvegardez votre disposition de rounds actuelle comme modèle. Rechargez-le à tout moment. Les modèles conservent la structure complète incluant les points de tension (Round Arc)." },
        { title:"PLAN — Simulateur de Compétition",
          body:"Tapez SIMULER COMPÉTITION en haut de PLAN pour lancer une session de pratique avec bracket, rounds configurables, périodes de repos et résumé complet." },
        { title:"PREP — Préparation Battle",
          body:"BATTLE > PREP est pour l'entraînement multi-battle séquentiel. Créez des cartes battle avec détails d'événement, lieu (lien automatique vers Google Maps), URL d'événement et compte à rebours. Le mode Battle Day vous guide à travers la checklist pré-battle, réflexion et carte partageable." },
        { title:"FREESTYLE",
          body:"Construisez une liste en direct de mouvements à parcourir pendant un jam ou cypher. Cherchez par nom ou catégorie, sélectionnez des mouvements ou sets entiers. Tapez un mouvement pour le marquer comme utilisé. Toggle Trust Mode disponible." },
        { title:"RIVALS",
          body:"BATTLE > RIVALS a trois sous-onglets : RIVALS, SPARRING MATE et CREW. Ajoutez des personnes avec des profils complets incluant domaines forts, mouvements signature, plan de jeu et historique de spar. Utilisez l'icône œil pour flouter toutes les cartes pour la confidentialité." },
        { title:"1v1 Spar",
          body:"Accédez au Spar depuis HOME. Choisissez le mode Solo ou 1v1. En 1v1, configurez le nom de l'adversaire, le nombre de rounds et le lieu. Pile ou face pour qui commence. Le timer suit les rounds de chaque côté. Le résumé est partageable avec votre partenaire." },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"À quoi sert REFLECT",
          body:"REFLECT est où vous revoyez vos progrès. Le Calendrier montre toute l'activité, Stance suit votre auto-évaluation, Objectifs suit vos cibles et Notes garde vos pensées." },
        { title:"CALENDRIER",
          body:"Grille mensuelle avec vue détail du jour. Tapez n'importe quel jour pour voir toutes les sessions : entraînement, spar, flash cards, prep battle et plus. Journal de session et log corporel disponibles par jour." },
        { title:"STANCE — MyStance",
          body:"Auto-évaluez-vous dans 6 domaines du breaking sur une échelle de 1 à 10. Un graphique radar hexagonal visualise votre profil. Des statistiques mesurées complètent votre auto-évaluation." },
        { title:"STANCE — Development Story",
          body:"Après 90+ jours de données, un récit factuel auto-généré résume votre parcours. Partageable sous forme de carte." },
        { title:"OBJECTIFS",
          body:"Cartes d'objectif avec suivi de progrès et échéances. Deux types : Journey Goals (jalons qualitatifs avec plans) et Target Goals (chiffres à atteindre avec compteurs)." },
        { title:"NOTES",
          body:"Notes chronologiques et réflexions post-session. Utilisez-les pour des idées de combos, observations, références ou tout ce que votre esprit a besoin de décharger." },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"Outils d'Entraînement",
      items:[
        { title:"Explore",
          body:"Outil d'exploration créative avec chips modificateurs et 4 modes. Accès depuis MOVES > BIBLIOTHÈQUE bande d'outils. Choisissez un mode, ajoutez des contraintes et explorez de nouvelles idées de mouvement." },
        { title:"R/R/R (Restaurer / Remixer / Reconstruire)",
          body:"Prompts sélectionnés pour revisiter et transformer des mouvements existants. Options de timer : 1, 3, 5, 10 minutes, Personnalisé ou Sans Limite. Accès depuis MOVES > BIBLIOTHÈQUE bande d'outils." },
        { title:"Combine",
          body:"Générateur de combinaisons aléatoires de mouvements. Pioche dans votre bibliothèque pour créer des appariements inattendus. Accès depuis MOVES > BIBLIOTHÈQUE bande d'outils." },
        { title:"Map",
          body:"Matrice d'appariement directionnel des mouvements. Mappez quels mouvements mènent à quels autres, construisant votre vocabulaire de transitions. Accès depuis MOVES > BIBLIOTHÈQUE bande d'outils." },
        { title:"Drill",
          body:"Sessions de répétitions chronométrées avec check-in corporel et réflexion. Suivez les répétitions de mouvements spécifiques avec compteur et timer." },
        { title:"Spar",
          body:"Sessions de sparring solo ou 1v1. Mode Solo : rounds chronométrés avec suivi de records personnels. Mode 1v1 : rounds alternés avec un adversaire, résumé partageable." },
        { title:"Flow",
          body:"Sessions de pratique de musicalité. Mettez de la musique, définissez un timer et concentrez-vous sur danser en rythme. Réflexion après chaque session." },
      ]
    },
    {
      id:"profile", icon:"👤", title:"Profil et Paramètres",
      items:[
        { title:"Votre profil",
          body:"Tapez l'avatar du profil dans l'en-tête. Définissez votre surnom, âge, date de début de breaking, objectifs et pourquoi vous dansez. Votre surnom apparaît dans l'en-tête comme 'MOVESBOOK de [nom]'." },
        { title:"Paramètres",
          body:"Accédez via l'icône d'engrenage dans l'en-tête ou dans l'overlay Profil. Configurez le thème, la taille du texte, la langue, la vue par défaut, l'affichage de la maîtrise et plus." },
        { title:"Sauvegarde",
          body:"Sauvegardez et restaurez vos données en fichier JSON. Disponible dans l'overlay Profil dans la section Données. Boutons supplémentaires sauvegarder/charger dans MOVES > BIBLIOTHÈQUE pour sauvegarde rapide des mouvements." },
        { title:"Langue",
          body:"MovesBook supporte 12 langues : Anglais, Italien, Espagnol, Français, Portugais, Allemand, Japonais, Chinois, Russe, Coréen, Thaïlandais et Vietnamien. Changez dans les Paramètres." },
        { title:"Légal",
          body:"Politique de Confidentialité, Conditions d'Utilisation et Avertissements sont accessibles depuis l'overlay Profil dans la section Légal." },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"Astuces",
      items:[
        { title:"Utilisez des emojis dans les titres",
          body:"Objectifs, habitudes, notes et mouvements supportent tous les emojis dans le titre. Ex. '👟 Pratique Quotidienne', '🏹 Apprendre 20 mouvements'. Rend les listes plus faciles à parcourir." },
        { title:"Utilisez les sets pour les combos signature",
          body:"Créez un Set dans MOVES > SETS pour votre combo signature ou séquence d'ouverture. Ajoutez-le à votre liste Freestyle ou round de Battle comme un seul élément." },
        { title:"Gardez les notes courtes",
          body:"Les notes fonctionnent mieux comme captures rapides. Si quelque chose nécessite de la structure, c'est probablement un Objectif. Utilisez les Notes pour les fragments et observations." },
        { title:"Faites un check-in quotidien",
          body:"Ouvrez l'app après l'entraînement et cochez vos routines dans l'onglet HOME. Construisez l'habitude de la réflexion." },
        { title:"Ajoutez des descriptions aux mouvements",
          body:"Le champ de description sur un mouvement est votre note technique personnelle — conseils clés, erreurs courantes, sur quoi se concentrer. Il apparaît en aperçu sur la tile." },
        { title:"Exportez avant les grands changements",
          body:"Avant de vider votre bibliothèque de mouvements, utilisez la fonction Sauvegarde pour enregistrer un backup JSON. Restaurez-le à tout moment depuis l'overlay Profil." },
      ]
    },
  ],

  pt: [
    {
      id:"overview", icon:"book", title:"Visão Geral",
      items:[
        { title:"O que é o MovesBook?",
          body:"MovesBook é um treinador pessoal de breaking projetado para ajudá-lo a treinar de forma mais inteligente. Cobre cada etapa da sua prática: definir objetivos, construir sua biblioteca de movimentos, planejar sets de battle e acompanhar hábitos diários. Tudo é salvo localmente no seu dispositivo e sincronizado na nuvem quando você está conectado." },
        { title:"As quatro abas principais",
          body:"HOME — seu plano diário com rotinas, ideias e objetivos.\nMOVES — sua biblioteca pessoal de movimentos, sets e rastreador de gaps.\nBATTLE — onde você planeja rounds, prepara eventos, freestyle e gerencia rivais.\nREFLECT — calendário, avaliação de stance, objetivos e notas." },
        { title:"O botão + (centro inferior)",
          body:"O grande botão + no centro inferior sempre abre o modal Adicionar Movimento, independente de qual aba você está." },
        { title:"Sincronização na nuvem",
          body:"Faça login com Google ou Email para sincronizar todos os seus dados na nuvem. Seus movimentos, objetivos, hábitos, rounds e sets são armazenados com segurança e disponíveis em qualquer dispositivo. Se não estiver conectado, tudo é salvo localmente no seu navegador." },
        { title:"Zoom",
          body:"Use os controles de zoom − e + nas Configurações para redimensionar o app inteiro. Útil em telas pequenas ou quando você quer alvos de toque maiores. Toque no número % para redefinir para 100%." },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"Para que serve o HOME",
          body:"HOME é seu espaço de planejamento diário. Construa seu dia com rotinas, ideias e objetivos. Tudo é adicionado pelo usuário — sem cartões predefinidos ou sugestões." },
        { title:"A pilha de tiles",
          body:"HOME é uma única pilha rolável de tiles. Três tipos:\n• Rotina — atividade recorrente ou única com emoji, nome, duração, descrição\n• Ideia — nota rápida, link de vídeo ou pensamento de treino\n• Objetivo/Hábito — puxado dos seus dados existentes de objetivos e hábitos" },
        { title:"Adicionar tiles",
          body:"Toque '+ Adicionar a hoje' na parte inferior para abrir o seletor. Escolha Adicionar Rotina, Adicionar Ideia ou Adicionar Objetivo ou Hábito. Rotinas podem se repetir em dias específicos." },
        { title:"Interações com tiles",
          body:"Toque na linha do título para editar no bottom sheet. Toque na descrição para expandir/recolher. Toque na caixa para completar. Toque X para remover (com confirmações inteligentes para itens recorrentes)." },
        { title:"Menu de engrenagem",
          body:"O ícone de engrenagem abre opções: Reordenar tiles, Gerenciar rotinas, Redefinir hoje." },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"Para que serve o MOVES", body:"MOVES é sua biblioteca pessoal de movimentos. Cada movimento que você conhece ou está aprendendo mora aqui. Organize por categoria, acompanhe o domínio, adicione descrições e referências de vídeo, e agrupe movimentos em sets para battle." },
        { title:"Adicionar um movimento", body:"Toque + na barra inferior. Preencha: Nome do movimento (obrigatório), Categoria, Descrição, Link de vídeo, Domínio (slider 0–100%). Toque Salvar." },
        { title:"Nível de domínio", body:"O domínio é uma pontuação de 0–100% que você atribui manualmente. A cor da barra segue: Vermelho 0–30%, Âmbar 30–60%, Amarelo 60–80%, Verde 80–100%." },
        { title:"Vistas: Tile, Lista, Árvore", body:"Alterne entre vistas com os ícones no cabeçalho da BIBLIOTECA. Vista Tile mostra cartões, Vista Lista mostra linhas, Vista Árvore mostra relações de linhagem dos movimentos." },
        { title:"Categorias", body:"Os movimentos são agrupados por categoria. Toque numa categoria para ver seus movimentos. Do menu você pode renomear, mudar cor, duplicar ou excluir." },
        { title:"Sets", body:"Sets são grupos de movimentos nomeados — uma combo ou sequência. Vá a MOVES > SETS para criar um. Dê um nome, detalhes e cor, depois adicione movimentos da sua biblioteca." },
        { title:"Flash Cards", body:"Na sub-aba SETS, toque o botão Flash Cards para iniciar um exercício de memória. Selecione quais sets incluir, depois vire as cartas testando sua lembrança dos movimentos de cada set." },
        { title:"Rastreador GAP", body:"A sub-aba GAP mostra quais movimentos estão ficando obsoletos. O rastreamento de frescor por domínio ajuda a identificar o que precisa de atenção." },
        { title:"Ferramentas de treino", body:"A sub-aba BIBLIOTECA tem uma faixa de ferramentas com quatro ferramentas criativas: Explore, R/R/R, Combine e Map." },
        { title:"Links de vídeo", body:"Controle como links de vídeo aparecem nas Configurações: Somente dentro (link só no detalhe) ou Dentro e fora (ícone de abertura rápida no cartão)." },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"Para que serve o BATTLE", body:"BATTLE é seu centro de preparação para competições. Planeje rounds, prepare-se para eventos, construa listas freestyle e gerencie seus rivais e parceiros de treino." },
        { title:"PLAN — Criar um round", body:"Em BATTLE > PLAN, toque + para abrir o modal Novo Round. Defina um nome, cor e número de slots. Cada slot contém movimentos ou sets da sua biblioteca." },
        { title:"PLAN — Templates", body:"Salve seu layout de rounds atual como template. Recarregue a qualquer momento. Os templates conservam a estrutura completa incluindo pontos de tensão (Round Arc)." },
        { title:"PLAN — Simulador de Competição", body:"Toque SIMULAR COMPETIÇÃO no topo de PLAN para executar uma sessão de prática com bracket, rounds configuráveis, períodos de descanso e resumo completo." },
        { title:"PREP — Preparação de Battle", body:"BATTLE > PREP é para treino multi-battle sequencial. Crie cartões de battle com detalhes do evento, localização (link automático para Google Maps), URL do evento e contagem regressiva." },
        { title:"FREESTYLE", body:"Construa uma lista ao vivo de movimentos para percorrer durante um jam ou cypher. Busque por nome ou categoria, selecione movimentos ou sets inteiros. Toque um movimento para marcar como usado." },
        { title:"RIVALS", body:"BATTLE > RIVALS tem três sub-abas: RIVALS, SPARRING MATE e CREW. Adicione pessoas com perfis completos incluindo domínios fortes, movimentos assinatura, plano de jogo e histórico de spar." },
        { title:"1v1 Spar", body:"Acesse Spar pelo HOME. Escolha modo Solo ou 1v1. No 1v1, configure nome do oponente, contagem de rounds e local. Cara ou coroa para quem começa. O timer acompanha os rounds de cada lado. O resumo é compartilhável." },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"Para que serve o REFLECT", body:"REFLECT é onde você revisa seu progresso. O Calendário mostra toda atividade, Stance acompanha sua auto-avaliação, Objetivos acompanha suas metas e Notas guarda seus pensamentos." },
        { title:"CALENDÁRIO", body:"Grade mensal com vista de detalhe do dia. Toque qualquer dia para ver todas as sessões. Diário de sessão e log corporal disponíveis por dia." },
        { title:"STANCE — MyStance", body:"Auto-avalie-se em 6 domínios do breaking numa escala 1–10. Um gráfico radar hexagonal visualiza seu perfil. Estatísticas medidas complementam sua auto-avaliação." },
        { title:"STANCE — Development Story", body:"Após 90+ dias de dados, uma narrativa factual auto-gerada resume sua jornada. Compartilhável como cartão." },
        { title:"OBJETIVOS", body:"Cartões de objetivo com acompanhamento de progresso e prazos. Dois tipos: Journey Goals (marcos qualitativos com planos) e Target Goals (números para alcançar com contadores)." },
        { title:"NOTAS", body:"Notas cronológicas e reflexões pós-sessão. Use para ideias de combos, observações, referências ou qualquer coisa que sua mente precise descarregar." },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"Ferramentas de Treino",
      items:[
        { title:"Explore", body:"Ferramenta de exploração criativa com chips modificadores e 4 modos. Acesso por MOVES > BIBLIOTECA faixa de ferramentas." },
        { title:"R/R/R (Restaurar / Remixar / Reconstruir)", body:"Prompts curados para revisitar e transformar movimentos existentes. Opções de timer: 1, 3, 5, 10 minutos, Personalizado ou Sem Limite." },
        { title:"Combine", body:"Gerador de combinações aleatórias de movimentos. Puxa da sua biblioteca para criar emparelhamentos inesperados." },
        { title:"Map", body:"Matriz de emparelhamento direcional de movimentos. Mapeie quais movimentos fluem para quais, construindo seu vocabulário de transições." },
        { title:"Drill", body:"Sessões de repetições cronometradas com check-in corporal e reflexão. Acompanhe repetições de movimentos específicos com contador e timer." },
        { title:"Spar", body:"Sessões de sparring solo ou 1v1. Modo Solo: rounds cronometrados com acompanhamento de recordes pessoais. Modo 1v1: rounds alternados com oponente, resumo compartilhável." },
        { title:"Flow", body:"Sessões de prática de musicalidade. Coloque música, defina um timer e foque em dançar no ritmo. Reflexão após cada sessão." },
      ]
    },
    {
      id:"profile", icon:"👤", title:"Perfil e Configurações",
      items:[
        { title:"Seu perfil", body:"Toque o avatar do perfil no cabeçalho. Defina seu apelido, idade, data de início no breaking, objetivos e por que você dança. Seu apelido aparece no cabeçalho como 'MOVESBOOK de [nome]'." },
        { title:"Configurações", body:"Acesse pelo ícone de engrenagem no cabeçalho ou dentro do overlay do Perfil. Configure tema, tamanho do texto, idioma, vista padrão, exibição de domínio e mais." },
        { title:"Backup", body:"Salve e restaure seus dados como arquivo JSON. Disponível no overlay do Perfil na seção Dados." },
        { title:"Idioma", body:"MovesBook suporta 12 idiomas: Inglês, Italiano, Espanhol, Francês, Português, Alemão, Japonês, Chinês, Russo, Coreano, Tailandês e Vietnamita. Mude nas Configurações." },
        { title:"Legal", body:"Política de Privacidade, Termos de Serviço e Avisos Legais são acessíveis pelo overlay do Perfil na seção Legal." },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"Dicas e Truques",
      items:[
        { title:"Use emojis nos títulos", body:"Objetivos, hábitos, notas e movimentos suportam emojis no título. Ex. '👟 Prática Diária'. Torna as listas mais fáceis de escanear." },
        { title:"Use sets para combos assinatura", body:"Crie um Set em MOVES > SETS para sua combo assinatura ou sequência de abertura." },
        { title:"Mantenha as notas curtas", body:"Notas funcionam melhor como capturas rápidas. Se algo precisa de estrutura, provavelmente é um Objetivo." },
        { title:"Faça check-in diário", body:"Abra o app após o treino e marque suas rotinas na aba HOME. Construa o hábito da reflexão." },
        { title:"Adicione descrições aos movimentos", body:"O campo de descrição num movimento é sua nota técnica pessoal — dicas chave, erros comuns, no que focar." },
        { title:"Exporte antes de grandes mudanças", body:"Antes de limpar a biblioteca de movimentos, use a função Backup para salvar um backup JSON." },
      ]
    },
  ],

  de: [
    {
      id:"overview", icon:"book", title:"Überblick",
      items:[
        { title:"Was ist MovesBook?", body:"MovesBook ist ein persönlicher Breaking-Trainer, der dir hilft, intelligenter zu trainieren. Er deckt jede Phase deiner Praxis ab: Ziele setzen, deine Move-Bibliothek aufbauen, Battle-Sets planen und tägliche Gewohnheiten verfolgen. Alles wird lokal auf deinem Gerät gespeichert und in die Cloud synchronisiert, wenn du angemeldet bist." },
        { title:"Die vier Haupttabs", body:"HOME — dein Tagesplan mit Routinen, Ideen und Zielen.\nMOVES — deine persönliche Move-Bibliothek, Sets und Gap-Tracker.\nBATTLE — wo du Runden planst, Events vorbereitest, Freestyle machst und Rivalen verwaltest.\nREFLECT — Kalender, Stance-Bewertung, Ziele und Notizen." },
        { title:"Der + Button (Mitte unten)", body:"Der große + Button unten in der Mitte öffnet immer das Move-Hinzufügen-Modal, unabhängig davon, auf welchem Tab du bist." },
        { title:"Cloud-Synchronisation", body:"Melde dich mit Google oder E-Mail an, um alle deine Daten in die Cloud zu synchronisieren. Deine Moves, Ziele, Gewohnheiten, Runden und Sets werden sicher gespeichert und sind auf jedem Gerät verfügbar." },
        { title:"Zoom", body:"Verwende die Zoom-Steuerung − und + in den Einstellungen, um die gesamte App zu skalieren. Nützlich auf kleinen Bildschirmen. Tippe auf die %-Zahl, um auf 100% zurückzusetzen." },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"Wofür HOME ist", body:"HOME ist dein täglicher Planungsbereich. Baue deinen Tag mit Routinen, Ideen und Zielen auf. Alles wird vom Benutzer hinzugefügt — keine vordefinierten Karten oder Vorschläge." },
        { title:"Der Tile-Stapel", body:"HOME ist ein einzelner scrollbarer Stapel von Tiles. Drei Typen:\n• Routine — wiederkehrende oder einmalige Aktivität mit Emoji, Name, Dauer, Beschreibung\n• Idee — schnelle Notiz, Videolink oder Trainingsgedanke\n• Ziel/Gewohnheit — aus deinen bestehenden Ziel- und Gewohnheitsdaten gezogen" },
        { title:"Tiles hinzufügen", body:"Tippe '+ Zu heute hinzufügen' unten, um den Picker zu öffnen. Wähle Routine hinzufügen, Idee hinzufügen oder Ziel oder Gewohnheit hinzufügen." },
        { title:"Tile-Interaktionen", body:"Tippe die Titelzeile zum Bearbeiten im Bottom Sheet. Tippe die Beschreibung zum Erweitern/Zuklappen. Tippe die Checkbox zum Abhaken. Tippe X zum Entfernen." },
        { title:"Zahnrad-Menü", body:"Das Zahnrad-Symbol öffnet Optionen: Tiles neu ordnen, Routinen verwalten, Heute zurücksetzen." },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"Wofür MOVES ist", body:"MOVES ist deine persönliche Move-Bibliothek. Jeder Move, den du kennst oder lernst, lebt hier. Organisiere nach Kategorie, verfolge die Beherrschung, füge Beschreibungen und Videoreferenzen hinzu und gruppiere Moves in Sets für Battles." },
        { title:"Einen Move hinzufügen", body:"Tippe + in der unteren Leiste. Fülle aus: Move-Name (erforderlich), Kategorie, Beschreibung, Videolink, Beherrschung (Slider 0–100%). Tippe Speichern." },
        { title:"Beherrschungsstufe", body:"Die Beherrschung ist ein 0–100%-Wert, den du manuell vergibst. Die Balkenfarbe folgt: Rot 0–30%, Amber 30–60%, Gelb 60–80%, Grün 80–100%." },
        { title:"Ansichten: Tile, Liste, Baum", body:"Wechsle zwischen Ansichten mit den Icons im BIBLIOTHEK-Header. Tile-Ansicht zeigt Karten, Listen-Ansicht zeigt Zeilen, Baum-Ansicht zeigt Move-Abstammungsbeziehungen." },
        { title:"Kategorien", body:"Moves werden nach Kategorie gruppiert. Tippe eine Kategorie, um ihre Moves zu sehen. Über das Menü kannst du umbenennen, Farbe ändern, duplizieren oder löschen." },
        { title:"Sets", body:"Sets sind benannte Gruppen von Moves — eine Combo oder Sequenz. Gehe zu MOVES > SETS, um eines zu erstellen." },
        { title:"Flash Cards", body:"Im SETS-Unter-Tab tippe den Flash Cards Button, um ein Gedächtnistraining zu starten. Wähle Sets aus und blättere durch Karten, um dein Erinnerungsvermögen zu testen." },
        { title:"GAP-Tracker", body:"Der GAP-Unter-Tab zeigt, welche Moves veraltet werden. Domänenbasiertes Frische-Tracking hilft dir zu identifizieren, was Aufmerksamkeit braucht." },
        { title:"Trainingstools", body:"Der BIBLIOTHEK-Unter-Tab hat eine Tool-Leiste mit vier kreativen Tools: Explore, R/R/R, Combine und Map." },
        { title:"Videolinks", body:"Steuere wie Videolinks in den Einstellungen erscheinen: Nur innen (Link nur im Detail) oder Innen und außen (Schnellöffnungs-Icon auf der Karte)." },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"Wofür BATTLE ist", body:"BATTLE ist dein Wettkampfvorbereitungs-Hub. Plane Runden, bereite dich auf Events vor, baue Freestyle-Listen und verwalte deine Rivalen und Trainingspartner." },
        { title:"PLAN — Eine Runde erstellen", body:"In BATTLE > PLAN tippe +, um das Neue-Runde-Modal zu öffnen. Setze Name, Farbe und Anzahl der Slots. Jeder Slot enthält Moves oder Sets aus deiner Bibliothek." },
        { title:"PLAN — Vorlagen", body:"Speichere dein aktuelles Runden-Layout als Vorlage. Lade es jederzeit zurück. Vorlagen bewahren die vollständige Struktur einschließlich Spannungspunkte (Round Arc)." },
        { title:"PLAN — Wettkampfsimulator", body:"Tippe WETTKAMPF SIMULIEREN oben in PLAN für eine Bracket-Übungssession mit konfigurierbaren Runden, Ruhepausen und vollständiger Zusammenfassung." },
        { title:"PREP — Battle-Vorbereitung", body:"BATTLE > PREP ist für sequentielles Multi-Battle-Training. Erstelle Battle-Karten mit Event-Details, Ort (automatischer Google Maps-Link), Event-URL und Countdown." },
        { title:"FREESTYLE", body:"Baue eine Live-Liste von Moves zum Durchgehen während eines Jams oder Cyphers. Suche nach Name oder Kategorie, wähle Moves oder ganze Sets." },
        { title:"RIVALS", body:"BATTLE > RIVALS hat drei Unter-Tabs: RIVALS, SPARRING MATE und CREW. Füge Personen mit vollständigen Profilen hinzu, einschließlich starker Domänen, Signature Moves, Spielplan und Spar-Historie." },
        { title:"1v1 Spar", body:"Greife auf Spar von HOME zu. Wähle Solo oder 1v1 Modus. Im 1v1 stelle Gegnername, Rundenanzahl und Ort ein. Münzwurf für den Start. Der Timer verfolgt die Runden jeder Seite." },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"Wofür REFLECT ist", body:"REFLECT ist wo du deinen Fortschritt überprüfst. Kalender zeigt alle Aktivitäten, Stance verfolgt deine Selbsteinschätzung, Ziele verfolgt deine Targets und Notizen bewahrt deine Gedanken." },
        { title:"KALENDER", body:"Monatsraster mit Tagesdetailansicht. Tippe einen Tag, um alle Sessions zu sehen. Session-Tagebuch und Körperlog pro Tag verfügbar." },
        { title:"STANCE — MyStance", body:"Bewerte dich selbst in 6 Breaking-Domänen auf einer Skala von 1–10. Ein hexagonales Radar-Diagramm visualisiert dein Profil." },
        { title:"STANCE — Development Story", body:"Nach 90+ Tagen Daten fasst eine automatisch generierte faktische Erzählung deine Reise zusammen. Als Karte teilbar." },
        { title:"ZIELE", body:"Zielkarten mit Fortschrittsverfolgung und Fristen. Zwei Typen: Journey Goals (qualitative Meilensteine mit Plänen) und Target Goals (Zahlen zum Erreichen mit Zählern)." },
        { title:"NOTIZEN", body:"Chronologische Notizen und Post-Session-Reflexionen. Nutze sie für Combo-Ideen, Beobachtungen, Referenzen." },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"Trainingstools",
      items:[
        { title:"Explore", body:"Kreatives Explorations-Tool mit Modifier-Chips und 4 Modi. Zugang über MOVES > BIBLIOTHEK Tool-Leiste." },
        { title:"R/R/R (Wiederherstellen / Remixen / Neubauen)", body:"Kuratierte Prompts zum Wiederbesuchen und Transformieren bestehender Moves. Timer-Optionen: 1, 3, 5, 10 Minuten, Benutzerdefiniert oder Ohne Limit." },
        { title:"Combine", body:"Zufalls-Move-Kombinationsgenerator. Zieht aus deiner Bibliothek für unerwartete Paarungen." },
        { title:"Map", body:"Richtungs-Move-Paarungs-Matrix. Mappe welche Moves in welche fließen und baue dein Übergangsvokabular auf." },
        { title:"Drill", body:"Zeitgesteuerte Wiederholungssessions mit Körper-Check-in und Reflexion." },
        { title:"Spar", body:"Solo oder 1v1 Sparring-Sessions. Solo: zeitgesteuerte Runden mit persönlichem Rekord-Tracking. 1v1: abwechselnde Runden mit Gegner, teilbare Zusammenfassung." },
        { title:"Flow", body:"Musikalitäts-Übungssessions. Lege Musik auf, stelle einen Timer und konzentriere dich aufs Tanzen zum Beat." },
      ]
    },
    {
      id:"profile", icon:"👤", title:"Profil & Einstellungen",
      items:[
        { title:"Dein Profil", body:"Tippe den Profil-Avatar im Header. Setze deinen Spitznamen, Alter, Breaking-Startdatum, Ziele und warum du tanzt." },
        { title:"Einstellungen", body:"Zugang über das Zahnrad-Icon im Header oder im Profil-Overlay. Konfiguriere Thema, Textgröße, Sprache, Standardansicht und mehr." },
        { title:"Backup", body:"Speichere und stelle deine Daten als JSON-Datei wieder her. Im Profil-Overlay unter dem Daten-Bereich verfügbar." },
        { title:"Sprache", body:"MovesBook unterstützt 12 Sprachen: Englisch, Italienisch, Spanisch, Französisch, Portugiesisch, Deutsch, Japanisch, Chinesisch, Russisch, Koreanisch, Thailändisch und Vietnamesisch." },
        { title:"Rechtliches", body:"Datenschutzrichtlinie, Nutzungsbedingungen und Haftungsausschlüsse sind im Profil-Overlay unter dem Rechtlichen Bereich zugänglich." },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"Tipps & Tricks",
      items:[
        { title:"Verwende Emojis in Titeln", body:"Ziele, Gewohnheiten, Notizen und Moves unterstützen alle Emojis im Titel. Z.B. '👟 Tägliches Training'." },
        { title:"Verwende Sets für Signature-Combos", body:"Erstelle ein Set in MOVES > SETS für deine Signature-Combo oder Eröffnungssequenz." },
        { title:"Halte Notizen kurz", body:"Notizen funktionieren am besten als schnelle Erfassungen. Wenn etwas Struktur braucht, ist es wahrscheinlich ein Ziel." },
        { title:"Tägliches Check-in", body:"Öffne die App nach dem Training und hake deine Routinen im HOME-Tab ab." },
        { title:"Beschreibungen zu Moves hinzufügen", body:"Das Beschreibungsfeld eines Moves ist deine persönliche Techniknotiz." },
        { title:"Vor großen Änderungen exportieren", body:"Bevor du deine Move-Bibliothek leerst, nutze die Backup-Funktion für einen JSON-Backup." },
      ]
    },
  ],

  ja: [
    {
      id:"overview", icon:"book", title:"概要",
      items:[
        { title:"MovesBookとは？", body:"MovesBookはブレイキンのパーソナルトレーナーで、よりスマートなトレーニングをサポートします。目標設定、ムーブライブラリの構築、バトルセットの計画、日々の習慣の追跡など、練習のすべての段階をカバーします。すべてのデータはデバイスにローカル保存され、サインイン時にクラウドに同期されます。" },
        { title:"4つのメインタブ", body:"HOME — ルーティン、アイデア、目標を含む日々のプラン。\nMOVES — 個人のムーブライブラリ、セット、ギャップトラッカー。\nBATTLE — ラウンドの計画、イベント準備、フリースタイル、ライバル管理。\nREFLECT — カレンダー、スタンス評価、目標、ノート。" },
        { title:"＋ボタン（中央下）", body:"中央下の大きな＋ボタンは、どのタブにいても常にムーブ追加モーダルを開きます。" },
        { title:"クラウド同期", body:"Googleまたはメールでサインインしてすべてのデータをクラウドに同期。ムーブ、目標、習慣、ラウンド、セットが安全に保存され、どのデバイスでも利用可能です。" },
        { title:"ズーム", body:"設定のズームコントロール−と+を使ってアプリ全体を拡大縮小。%の数字をタップすると100%にリセットされます。" },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"HOMEの用途", body:"HOMEは日々の計画スペースです。ルーティン、アイデア、目標で一日を組み立てましょう。すべてユーザーが追加 — プリセットカードや提案はありません。" },
        { title:"タイルスタック", body:"HOMEはスクロール可能なタイルの1つのスタックです。3つのタイプ：\n• ルーティン — 絵文字、名前、時間、説明付きの繰り返しまたは一回限りの活動\n• アイデア — クイックメモ、動画リンク、トレーニングの思いつき\n• 目標/習慣 — 既存の目標と習慣データから取得" },
        { title:"タイルの追加", body:"下部の「+ 今日に追加」をタップしてピッカーを開きます。ルーティン追加、アイデア追加、目標または習慣追加から選択。" },
        { title:"タイルの操作", body:"タイトル行をタップしてボトムシートで編集。説明をタップして展開/折りたたみ。チェックボックスで完了。Xで削除。" },
        { title:"ギアメニュー", body:"ギアアイコンがオプションを開きます：タイルの並び替え、ルーティンの管理、今日をリセット。" },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"MOVESの用途", body:"MOVESは個人のムーブライブラリです。知っているムーブや学習中のムーブがすべてここにあります。カテゴリで整理、習熟度を追跡、説明と動画リファレンスを追加し、バトル用にセットにグループ化できます。" },
        { title:"ムーブの追加", body:"下部バーの+をタップ。入力：ムーブ名（必須）、カテゴリ、説明、動画リンク、習熟度（0〜100%スライダー）。保存をタップ。" },
        { title:"習熟度レベル", body:"習熟度は手動で割り当てる0〜100%のスコアです。バーの色：赤0〜30%、アンバー30〜60%、黄60〜80%、緑80〜100%。" },
        { title:"ビュー：タイル、リスト、ツリー", body:"ライブラリヘッダーのアイコンでビューを切り替え。タイルビューはカード、リストビューは行、ツリービューはムーブの系譜関係を表示。" },
        { title:"カテゴリ", body:"ムーブはカテゴリでグループ化されます。カテゴリをタップしてムーブを表示。メニューから名前変更、色変更、複製、削除が可能。" },
        { title:"セット", body:"セットは名前付きのムーブグループ — コンボやシーケンスです。MOVES > SETSで作成します。" },
        { title:"フラッシュカード", body:"SETSサブタブでフラッシュカードボタンをタップして記憶トレーニングを開始。各セットのムーブの記憶をテストします。" },
        { title:"GAPトラッカー", body:"GAPサブタブはどのムーブが古くなっているかを表示。ドメイン別の新鮮さ追跡が注意が必要なものを特定するのに役立ちます。" },
        { title:"トレーニングツール", body:"ライブラリサブタブには4つのクリエイティブツールのストリップがあります：Explore、R/R/R、Combine、Map。" },
        { title:"動画リンク", body:"設定で動画リンクの表示を制御：内部のみ（詳細内のリンクのみ）または内部と外部（カード上のクイックオープンアイコン）。" },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"BATTLEの用途", body:"BATTLEは競技準備のハブです。ラウンドの計画、イベント準備、フリースタイルリストの構築、ライバルとスパーリングパートナーの管理。" },
        { title:"PLAN — ラウンドの作成", body:"BATTLE > PLANで+をタップして新しいラウンドモーダルを開きます。名前、色、スロット数を設定。各スロットにはライブラリのムーブやセットが入ります。" },
        { title:"PLAN — テンプレート", body:"現在のラウンドレイアウトをテンプレートとして保存。いつでも再読み込み。テンプレートはテンションポイント（Round Arc）を含む完全な構造を保持します。" },
        { title:"PLAN — コンペティションシミュレーター", body:"PLANの上部のコンペティションシミュレートをタップして、設定可能なラウンド、休憩、完全なサマリー付きのブラケット練習セッションを実行。" },
        { title:"PREP — バトル準備", body:"BATTLE > PREPはマルチバトルシーケンシャルトレーニング用。イベント詳細、場所（Googleマップ自動リンク）、イベントURL、カウントダウン付きのバトルカードを作成。" },
        { title:"FREESTYLE", body:"ジャムやサイファー中に循環するムーブのライブリストを構築。名前やカテゴリで検索、ムーブやセット全体を選択。" },
        { title:"RIVALS", body:"BATTLE > RIVALSには3つのサブタブ：RIVALS、SPARRING MATE、CREW。強みドメイン、シグネチャームーブ、ゲームプラン、スパー履歴を含む完全なプロフィールで人を追加。" },
        { title:"1v1スパー", body:"HOMEからスパーにアクセス。ソロまたは1v1モードを選択。1v1では対戦相手名、ラウンド数、場所を設定。コイントスで先攻を決定。タイマーが各サイドのラウンドを追跡。" },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"REFLECTの用途", body:"REFLECTは進捗を振り返る場所です。カレンダーはすべてのアクティビティを表示、スタンスは自己評価を追跡、目標はターゲットを追跡、ノートは考えを保存します。" },
        { title:"カレンダー", body:"月間グリッドと日別詳細ビュー。任意の日をタップしてすべてのセッションを表示。セッション日記とボディログが日ごとに利用可能。" },
        { title:"STANCE — MyStance", body:"ブレイキンの6ドメインで1〜10のスケールで自己評価。六角形のレーダーチャートがプロフィールを可視化。" },
        { title:"STANCE — Development Story", body:"90日以上のデータ後、自動生成された事実ベースのナラティブがあなたの旅を要約。カードとして共有可能。" },
        { title:"目標", body:"進捗追跡と期限付きの目標カード。2種類：Journey Goals（プラン付きの質的マイルストーン）とTarget Goals（カウンター付きの数値目標）。" },
        { title:"ノート", body:"時系列のノートとセッション後の振り返り。コンボのアイデア、観察、リファレンスに使用。" },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"トレーニングツール",
      items:[
        { title:"Explore", body:"モディファイアチップと4つのモード付きのクリエイティブ探索ツール。MOVES > ライブラリツールストリップからアクセス。" },
        { title:"R/R/R（リストア/リミックス/リビルド）", body:"既存のムーブを再訪し変形するためのキュレーションされたプロンプト。タイマーオプション：1、3、5、10分、カスタム、制限なし。" },
        { title:"Combine", body:"ランダムなムーブ組み合わせジェネレーター。ライブラリから引き出して予想外のペアリングを作成。" },
        { title:"Map", body:"方向性ムーブペアリングマトリックス。どのムーブがどのムーブに流れるかをマッピングし、トランジションの語彙を構築。" },
        { title:"Drill", body:"ボディチェックインと振り返り付きのタイムドレップセッション。カウンターとタイマーで特定のムーブのレップを追跡。" },
        { title:"Spar", body:"ソロまたは1v1スパーリングセッション。ソロ：パーソナルレコード追跡付きタイムドラウンド。1v1：対戦相手との交互ラウンド、共有可能なサマリー。" },
        { title:"Flow", body:"ミュージカリティ練習セッション。音楽をかけ、タイマーを設定し、ビートに合わせて踊ることに集中。" },
      ]
    },
    {
      id:"profile", icon:"👤", title:"プロフィールと設定",
      items:[
        { title:"あなたのプロフィール", body:"ヘッダーのプロフィールアバターをタップ。ニックネーム、年齢、ブレイキン開始日、目標、踊る理由を設定。" },
        { title:"設定", body:"ヘッダーのスプロケットアイコンまたはプロフィールオーバーレイ内からアクセス。テーマ、テキストサイズ、言語、デフォルトビューなどを設定。" },
        { title:"バックアップ", body:"JSONファイルとしてデータを保存・復元。プロフィールオーバーレイのデータセクションで利用可能。" },
        { title:"言語", body:"MovesBookは12言語をサポート：英語、イタリア語、スペイン語、フランス語、ポルトガル語、ドイツ語、日本語、中国語、ロシア語、韓国語、タイ語、ベトナム語。" },
        { title:"法的情報", body:"プライバシーポリシー、利用規約、免責事項はプロフィールオーバーレイの法的セクションからアクセス可能。" },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"ヒントとコツ",
      items:[
        { title:"タイトルに絵文字を使う", body:"目標、習慣、ノート、ムーブはすべてタイトルに絵文字をサポート。例：'👟 デイリープラクティス'。" },
        { title:"シグネチャーコンボにセットを使う", body:"MOVES > SETSでシグネチャーコンボや開始シーケンスのセットを作成。" },
        { title:"ノートは短く", body:"ノートはクイックキャプチャとして最適。構造が必要なら、おそらく目標です。" },
        { title:"毎日チェックイン", body:"トレーニング後にアプリを開き、HOMEタブでルーティンをチェック。振り返りの習慣を構築。" },
        { title:"ムーブに説明を追加", body:"ムーブの説明フィールドはあなたの個人的な技術ノート — 重要なキュー、よくあるミス、フォーカスポイント。" },
        { title:"大きな変更前にエクスポート", body:"ムーブライブラリをクリアする前に、バックアップ機能でJSONバックアップを保存。" },
      ]
    },
  ],

  zh: [
    {
      id:"overview", icon:"book", title:"概览",
      items:[
        { title:"什么是MovesBook？", body:"MovesBook是一个个人Breaking训练助手，旨在帮助你更智能地训练。它涵盖练习的每个阶段：设定目标、构建动作库、规划Battle套路和追踪日常习惯。所有数据保存在本地设备上，登录后同步到云端。" },
        { title:"四个主标签", body:"HOME — 包含日常安排、想法和目标的每日计划。\nMOVES — 个人动作库、套路组和差距追踪器。\nBATTLE — 规划回合、准备赛事、自由式和管理对手。\nREFLECT — 日历、状态评估、目标和笔记。" },
        { title:"+按钮（底部中央）", body:"底部中央的大+按钮始终打开添加动作弹窗，无论你在哪个标签页。" },
        { title:"云同步", body:"使用Google或邮箱登录，将所有数据同步到云端。你的动作、目标、习惯、回合和套路安全存储，在任何设备上可用。" },
        { title:"缩放", body:"在设置中使用缩放控制−和+来缩放整个应用。点击%数字重置为100%。" },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"HOME的用途", body:"HOME是你的每日计划空间。用日常安排、想法和目标来规划你的一天。所有内容由用户添加——没有预设卡片或建议。" },
        { title:"磁贴堆栈", body:"HOME是一个可滚动的磁贴堆栈。三种类型：\n• 日常安排 — 带表情、名称、时长、描述的重复或一次性活动\n• 想法 — 快速笔记、视频链接或训练想法\n• 目标/习惯 — 从现有目标和习惯数据中拉取" },
        { title:"添加磁贴", body:"点击底部的'+ 添加到今天'打开选择器。选择添加日常安排、添加想法或添加目标或习惯。" },
        { title:"磁贴交互", body:"点击标题行在底部面板中编辑。点击描述展开/收起。点击复选框完成。点击X删除。" },
        { title:"齿轮菜单", body:"齿轮图标打开选项：重新排列磁贴、管理日常安排、重置今天。" },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"MOVES的用途", body:"MOVES是你的个人动作库。你知道或正在学习的每个动作都在这里。按类别组织，追踪熟练度，添加描述和视频参考，将动作分组为Battle套路。" },
        { title:"添加动作", body:"点击底部栏的+。填写：动作名称（必填）、类别、描述、视频链接、熟练度（0-100%滑块）。点击保存。" },
        { title:"熟练度等级", body:"熟练度是你手动分配的0-100%分数。进度条颜色：红色0-30%、琥珀色30-60%、黄色60-80%、绿色80-100%。" },
        { title:"视图：磁贴、列表、树形", body:"用库标题中的图标切换视图。磁贴视图显示卡片，列表视图显示行，树形视图显示动作传承关系。" },
        { title:"类别", body:"动作按类别分组。点击类别查看其动作。从菜单可以重命名、改颜色、复制或删除。" },
        { title:"套路组", body:"套路组是命名的动作组合——一个连招或序列。去MOVES > SETS创建。" },
        { title:"闪卡", body:"在SETS子标签中，点击闪卡按钮开始记忆训练。选择包含哪些套路组，然后翻卡测试你对每个套路动作的记忆。" },
        { title:"GAP追踪器", body:"GAP子标签显示哪些动作正在变得生疏。基于领域的新鲜度追踪帮助你识别需要关注的内容。" },
        { title:"训练工具", body:"库子标签有一个工具条，包含四个创意工具：Explore、R/R/R、Combine和Map。" },
        { title:"视频链接", body:"在设置中控制视频链接的显示方式：仅内部（仅在详情中的链接）或内部和外部（卡片上的快速打开图标）。" },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"BATTLE的用途", body:"BATTLE是你的比赛准备中心。规划回合、准备赛事、构建自由式列表、管理对手和训练伙伴。" },
        { title:"PLAN — 创建回合", body:"在BATTLE > PLAN中，点击+打开新回合弹窗。设置名称、颜色和槽位数量。每个槽位包含库中的动作或套路。" },
        { title:"PLAN — 模板", body:"将当前回合布局保存为模板。随时重新加载。模板保留完整结构，包括张力点（Round Arc）。" },
        { title:"PLAN — 比赛模拟器", body:"点击PLAN顶部的模拟比赛，运行带有可配置回合、休息时间和完整总结的淘汰赛练习。" },
        { title:"PREP — Battle准备", body:"BATTLE > PREP用于多场Battle顺序训练。创建包含赛事详情、地点（自动Google Maps链接）、赛事URL和倒计时的Battle卡片。" },
        { title:"FREESTYLE", body:"构建在Jam或Cypher中循环使用的动作实时列表。按名称或类别搜索，选择动作或整个套路。" },
        { title:"RIVALS", body:"BATTLE > RIVALS有三个子标签：RIVALS、SPARRING MATE和CREW。添加包含强势领域、招牌动作、比赛策略和Spar历史的完整档案。" },
        { title:"1v1 Spar", body:"从HOME访问Spar。选择Solo或1v1模式。在1v1中，设置对手名称、回合数和地点。抛硬币决定先手。计时器追踪每方的回合。" },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"REFLECT的用途", body:"REFLECT是你回顾进度的地方。日历显示所有活动，Stance追踪自我评估，目标追踪你的指标，笔记保存你的想法。" },
        { title:"日历", body:"月度网格和日期详细视图。点击任意日期查看所有会话。每天可用会话日记和身体记录。" },
        { title:"STANCE — MyStance", body:"在Breaking的6个领域中以1-10的尺度自我评估。六边形雷达图可视化你的档案。" },
        { title:"STANCE — Development Story", body:"90天以上数据后，自动生成的事实叙述总结你的旅程。可作为卡片分享。" },
        { title:"目标", body:"带进度追踪和截止日期的目标卡片。两种类型：Journey Goals（带计划的定性里程碑）和Target Goals（带计数器的数值目标）。" },
        { title:"笔记", body:"按时间排列的笔记和训练后反思。用于连招想法、观察、参考。" },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"训练工具",
      items:[
        { title:"Explore", body:"带修饰芯片和4种模式的创意探索工具。从MOVES > 库工具条访问。" },
        { title:"R/R/R（恢复/混音/重建）", body:"精选提示，用于重访和转化现有动作。计时器选项：1、3、5、10分钟、自定义或无限制。" },
        { title:"Combine", body:"随机动作组合生成器。从库中提取创建意想不到的搭配。" },
        { title:"Map", body:"方向性动作配对矩阵。映射哪些动作流向哪些动作，构建你的过渡词汇。" },
        { title:"Drill", body:"带身体检查和反思的计时重复训练。用计数器和计时器追踪特定动作的重复。" },
        { title:"Spar", body:"Solo或1v1 Spar训练。Solo：带个人记录追踪的计时回合。1v1：与对手交替回合，可分享摘要。" },
        { title:"Flow", body:"音乐性练习。放音乐、设定计时器、专注于跟节奏跳舞。" },
      ]
    },
    {
      id:"profile", icon:"👤", title:"个人资料与设置",
      items:[
        { title:"你的个人资料", body:"点击标题栏中的个人头像。设置昵称、年龄、开始Breaking的日期、目标和跳舞的原因。" },
        { title:"设置", body:"通过标题栏的齿轮图标或个人资料overlay内部访问。配置主题、文字大小、语言、默认视图等。" },
        { title:"备份", body:"将数据保存和恢复为JSON文件。在个人资料overlay的数据部分可用。" },
        { title:"语言", body:"MovesBook支持12种语言：英语、意大利语、西班牙语、法语、葡萄牙语、德语、日语、中文、俄语、韩语、泰语和越南语。" },
        { title:"法律信息", body:"隐私政策、服务条款和免责声明可从个人资料overlay的法律部分访问。" },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"提示与技巧",
      items:[
        { title:"在标题中使用表情", body:"目标、习惯、笔记和动作都支持标题中的表情。例如：'👟 每日练习'。" },
        { title:"使用套路组作为招牌连招", body:"在MOVES > SETS中为你的招牌连招或开场序列创建一个套路组。" },
        { title:"保持笔记简短", body:"笔记最适合快速捕捉。如果需要结构化，那可能是一个目标。" },
        { title:"每日签到", body:"训练后打开应用，在HOME标签页中勾选你的日常安排。" },
        { title:"为动作添加描述", body:"动作的描述字段是你的个人技术笔记——关键提示、常见错误、关注重点。" },
        { title:"大改动前导出", body:"清空动作库前，使用备份功能保存JSON备份。" },
      ]
    },
  ],

  ru: [
    {
      id:"overview", icon:"book", title:"Обзор",
      items:[
        { title:"Что такое MovesBook?", body:"MovesBook — это персональный тренер по брейкингу, созданный для более эффективных тренировок. Он охватывает каждый этап практики: постановку целей, создание библиотеки движений, планирование батл-сетов и отслеживание ежедневных привычек. Всё сохраняется локально на устройстве и синхронизируется с облаком при входе в аккаунт." },
        { title:"Четыре основные вкладки", body:"HOME — ваш ежедневный план с рутинами, идеями и целями.\nMOVES — личная библиотека движений, сеты и трекер пробелов.\nBATTLE — планирование раундов, подготовка к мероприятиям, фристайл и управление соперниками.\nREFLECT — календарь, оценка стойки, цели и заметки." },
        { title:"Кнопка + (внизу по центру)", body:"Большая кнопка + внизу по центру всегда открывает модальное окно добавления движения, независимо от текущей вкладки." },
        { title:"Облачная синхронизация", body:"Войдите через Google или Email для синхронизации данных с облаком. Ваши движения, цели, привычки, раунды и сеты хранятся безопасно и доступны на любом устройстве." },
        { title:"Масштаб", body:"Используйте элементы управления масштабом − и + в настройках для масштабирования всего приложения. Нажмите число % для сброса на 100%." },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"Назначение HOME", body:"HOME — ваше пространство ежедневного планирования. Стройте день с рутинами, идеями и целями. Всё добавляется пользователем — без предустановленных карточек или предложений." },
        { title:"Стек плиток", body:"HOME — единый прокручиваемый стек плиток. Три типа:\n• Рутина — повторяющаяся или разовая активность с эмодзи, названием, длительностью, описанием\n• Идея — быстрая заметка, ссылка на видео или мысль о тренировке\n• Цель/Привычка — из существующих данных целей и привычек" },
        { title:"Добавление плиток", body:"Нажмите '+ Добавить на сегодня' внизу для открытия выбора. Выберите Добавить Рутину, Добавить Идею или Добавить Цель или Привычку." },
        { title:"Взаимодействие с плитками", body:"Нажмите строку заголовка для редактирования в нижней панели. Нажмите описание для разворачивания/сворачивания. Нажмите чекбокс для отметки. Нажмите X для удаления." },
        { title:"Меню шестерёнки", body:"Иконка шестерёнки открывает опции: Переупорядочить плитки, Управление рутинами, Сбросить сегодня." },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"Назначение MOVES", body:"MOVES — ваша личная библиотека движений. Каждое движение, которое вы знаете или изучаете, живёт здесь. Организуйте по категориям, отслеживайте мастерство, добавляйте описания и видео-ссылки, группируйте движения в сеты для батлов." },
        { title:"Добавление движения", body:"Нажмите + в нижней панели. Заполните: Название движения (обязательно), Категория, Описание, Ссылка на видео, Мастерство (ползунок 0–100%). Нажмите Сохранить." },
        { title:"Уровень мастерства", body:"Мастерство — оценка 0–100%, которую вы назначаете вручную. Цвет полосы: Красный 0–30%, Янтарный 30–60%, Жёлтый 60–80%, Зелёный 80–100%." },
        { title:"Виды: Плитка, Список, Дерево", body:"Переключайтесь между видами иконками в заголовке БИБЛИОТЕКИ." },
        { title:"Категории", body:"Движения группируются по категориям. Нажмите категорию для просмотра её движений. Из меню можно переименовать, изменить цвет, дублировать или удалить." },
        { title:"Сеты", body:"Сеты — именованные группы движений, комбо или последовательность. Перейдите в MOVES > СЕТЫ для создания." },
        { title:"Флеш-карточки", body:"Во вкладке СЕТЫ нажмите кнопку Флеш-карточки для тренировки памяти. Выберите какие сеты включить, затем переворачивайте карточки, тестируя свою память." },
        { title:"GAP-трекер", body:"Вкладка GAP показывает какие движения устаревают. Отслеживание свежести по доменам помогает определить что требует внимания." },
        { title:"Тренировочные инструменты", body:"Вкладка БИБЛИОТЕКА содержит полосу с четырьмя творческими инструментами: Explore, R/R/R, Combine и Map." },
        { title:"Видео-ссылки", body:"Управляйте отображением видео-ссылок в Настройках: Только внутри (ссылка только в деталях) или Внутри и снаружи (иконка быстрого открытия на карточке)." },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"Назначение BATTLE", body:"BATTLE — ваш центр подготовки к соревнованиям. Планируйте раунды, готовьтесь к мероприятиям, создавайте списки фристайла и управляйте соперниками и спарринг-партнёрами." },
        { title:"PLAN — Создание раунда", body:"В BATTLE > PLAN нажмите + для открытия модального окна Нового Раунда. Установите название, цвет и количество слотов." },
        { title:"PLAN — Шаблоны", body:"Сохраните текущий макет раундов как шаблон. Загрузите обратно в любое время. Шаблоны сохраняют полную структуру включая точки напряжения (Round Arc)." },
        { title:"PLAN — Симулятор соревнований", body:"Нажмите СИМУЛИРОВАТЬ СОРЕВНОВАНИЕ вверху PLAN для проведения тренировочной сессии с сеткой, настраиваемыми раундами, перерывами и полной сводкой." },
        { title:"PREP — Подготовка к батлу", body:"BATTLE > PREP для последовательных мульти-батл тренировок. Создавайте батл-карточки с деталями события, местоположением (автоматическая ссылка Google Maps), URL события и обратным отсчётом." },
        { title:"FREESTYLE", body:"Создайте живой список движений для использования во время джема или сайфера. Ищите по названию или категории, выбирайте движения или целые сеты." },
        { title:"RIVALS", body:"BATTLE > RIVALS имеет три подвкладки: RIVALS, SPARRING MATE и CREW. Добавляйте людей с полными профилями." },
        { title:"1v1 Спарринг", body:"Доступ к Спаррингу из HOME. Выберите режим Соло или 1v1. В 1v1 настройте имя соперника, количество раундов и место. Подброс монеты для определения первого. Таймер отслеживает раунды каждой стороны." },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"Назначение REFLECT", body:"REFLECT — где вы просматриваете свой прогресс. Календарь показывает всю активность, Stance отслеживает самооценку, Цели отслеживают ваши задачи, Заметки хранят ваши мысли." },
        { title:"КАЛЕНДАРЬ", body:"Месячная сетка с детальным видом дня. Нажмите любой день для просмотра всех сессий. Дневник сессий и журнал тела доступны по дням." },
        { title:"STANCE — MyStance", body:"Самооценка в 6 доменах брейкинга по шкале 1–10. Шестиугольная радарная диаграмма визуализирует ваш профиль." },
        { title:"STANCE — Development Story", body:"После 90+ дней данных автоматически сгенерированный фактический рассказ обобщает ваш путь. Можно поделиться как карточкой." },
        { title:"ЦЕЛИ", body:"Карточки целей с отслеживанием прогресса и дедлайнами. Два типа: Journey Goals (качественные вехи с планами) и Target Goals (числовые цели со счётчиками)." },
        { title:"ЗАМЕТКИ", body:"Хронологические заметки и рефлексии после сессий. Используйте для идей комбо, наблюдений, ссылок." },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"Тренировочные инструменты",
      items:[
        { title:"Explore", body:"Инструмент творческого исследования с чипами-модификаторами и 4 режимами. Доступ из MOVES > БИБЛИОТЕКА полоса инструментов." },
        { title:"R/R/R (Восстановить / Ремикс / Перестроить)", body:"Курированные подсказки для пересмотра и трансформации существующих движений. Опции таймера: 1, 3, 5, 10 минут, Пользовательский или Без ограничения." },
        { title:"Combine", body:"Генератор случайных комбинаций движений. Берёт из библиотеки для создания неожиданных пар." },
        { title:"Map", body:"Матрица направленного сопоставления движений. Отображает какие движения переходят в какие, формируя словарь переходов." },
        { title:"Drill", body:"Тайминговые сессии повторений с проверкой тела и рефлексией." },
        { title:"Spar", body:"Соло или 1v1 спарринг-сессии. Соло: тайминговые раунды с отслеживанием личных рекордов. 1v1: чередующиеся раунды с соперником." },
        { title:"Flow", body:"Сессии практики музыкальности. Включите музыку, установите таймер и сосредоточьтесь на танце в ритм." },
      ]
    },
    {
      id:"profile", icon:"👤", title:"Профиль и настройки",
      items:[
        { title:"Ваш профиль", body:"Нажмите аватар профиля в шапке. Установите никнейм, возраст, дату начала брейкинга, цели и почему вы танцуете." },
        { title:"Настройки", body:"Доступ через иконку шестерёнки в шапке или внутри оверлея Профиля. Настройте тему, размер текста, язык, вид по умолчанию и другое." },
        { title:"Резервное копирование", body:"Сохраняйте и восстанавливайте данные как JSON-файл. Доступно в оверлее Профиля в разделе Данные." },
        { title:"Язык", body:"MovesBook поддерживает 12 языков: Английский, Итальянский, Испанский, Французский, Португальский, Немецкий, Японский, Китайский, Русский, Корейский, Тайский и Вьетнамский." },
        { title:"Правовая информация", body:"Политика конфиденциальности, Условия обслуживания и Отказ от ответственности доступны в оверлее Профиля в разделе Правовая информация." },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"Советы и хитрости",
      items:[
        { title:"Используйте эмодзи в заголовках", body:"Цели, привычки, заметки и движения поддерживают эмодзи в заголовке. Например: '👟 Ежедневная практика'." },
        { title:"Используйте сеты для фирменных комбо", body:"Создайте Сет в MOVES > СЕТЫ для вашего фирменного комбо или вступительной последовательности." },
        { title:"Держите заметки короткими", body:"Заметки лучше работают как быстрые записи. Если нужна структура — это вероятно Цель." },
        { title:"Ежедневный чек-ин", body:"Открывайте приложение после тренировки и отмечайте рутины на вкладке HOME." },
        { title:"Добавляйте описания к движениям", body:"Поле описания движения — ваша личная техническая заметка: ключевые подсказки, частые ошибки, на чём фокусироваться." },
        { title:"Экспорт перед большими изменениями", body:"Перед очисткой библиотеки движений используйте функцию Резервного копирования для сохранения JSON-бэкапа." },
      ]
    },
  ],

  ko: [
    {
      id:"overview", icon:"book", title:"개요",
      items:[
        { title:"MovesBook이란?", body:"MovesBook은 더 스마트한 훈련을 도와주는 개인 브레이킹 트레이너입니다. 목표 설정, 무브 라이브러리 구축, 배틀 세트 계획, 일일 습관 추적 등 연습의 모든 단계를 다룹니다. 모든 데이터는 기기에 로컬 저장되며, 로그인 시 클라우드에 동기화됩니다." },
        { title:"네 개의 메인 탭", body:"HOME — 루틴, 아이디어, 목표가 포함된 일일 계획.\nMOVES — 개인 무브 라이브러리, 세트, 갭 트래커.\nBATTLE — 라운드 계획, 이벤트 준비, 프리스타일, 라이벌 관리.\nREFLECT — 캘린더, 스탠스 평가, 목표, 노트." },
        { title:"+ 버튼 (하단 중앙)", body:"하단 중앙의 큰 + 버튼은 어떤 탭에 있든 항상 무브 추가 모달을 엽니다." },
        { title:"클라우드 동기화", body:"Google 또는 이메일로 로그인하여 모든 데이터를 클라우드에 동기화하세요. 무브, 목표, 습관, 라운드, 세트가 안전하게 저장되어 어느 기기에서든 사용할 수 있습니다." },
        { title:"줌", body:"설정에서 줌 컨트롤 −와 +를 사용하여 앱 전체를 확대/축소합니다. % 숫자를 탭하면 100%로 리셋됩니다." },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"HOME의 용도", body:"HOME은 일일 계획 공간입니다. 루틴, 아이디어, 목표로 하루를 구성하세요. 모든 것은 사용자가 추가 — 미리 설정된 카드나 제안 없음." },
        { title:"타일 스택", body:"HOME은 스크롤 가능한 단일 타일 스택입니다. 세 가지 유형:\n• 루틴 — 이모지, 이름, 시간, 설명이 있는 반복 또는 일회성 활동\n• 아이디어 — 빠른 메모, 동영상 링크, 훈련 생각\n• 목표/습관 — 기존 목표와 습관 데이터에서 가져옴" },
        { title:"타일 추가", body:"하단의 '+ 오늘에 추가'를 탭하여 선택기를 엽니다. 루틴 추가, 아이디어 추가, 목표 또는 습관 추가에서 선택." },
        { title:"타일 상호작용", body:"제목 행을 탭하여 바텀 시트에서 편집. 설명을 탭하여 펼치기/접기. 체크박스를 탭하여 완료. X를 탭하여 제거." },
        { title:"기어 메뉴", body:"기어 아이콘이 옵션을 엽니다: 타일 재정렬, 루틴 관리, 오늘 초기화." },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"MOVES의 용도", body:"MOVES는 개인 무브 라이브러리입니다. 알고 있거나 배우고 있는 모든 무브가 여기에 있습니다. 카테고리별로 정리, 숙련도 추적, 설명과 동영상 참조 추가, 배틀용 세트로 그룹화." },
        { title:"무브 추가", body:"하단 바의 +를 탭. 입력: 무브 이름(필수), 카테고리, 설명, 동영상 링크, 숙련도(0-100% 슬라이더). 저장 탭." },
        { title:"숙련도 레벨", body:"숙련도는 수동으로 할당하는 0-100% 점수입니다. 바 색상: 빨강 0-30%, 앰버 30-60%, 노랑 60-80%, 초록 80-100%." },
        { title:"뷰: 타일, 리스트, 트리", body:"라이브러리 헤더의 아이콘으로 뷰를 전환. 타일 뷰는 카드, 리스트 뷰는 행, 트리 뷰는 무브 계보 관계를 표시." },
        { title:"카테고리", body:"무브는 카테고리별로 그룹화됩니다. 카테고리를 탭하여 무브를 봅니다. 메뉴에서 이름 변경, 색상 변경, 복제, 삭제 가능." },
        { title:"세트", body:"세트는 이름이 있는 무브 그룹 — 콤보 또는 시퀀스. MOVES > SETS에서 생성." },
        { title:"플래시 카드", body:"SETS 서브탭에서 플래시 카드 버튼을 탭하여 기억력 훈련 시작. 각 세트의 무브에 대한 기억력을 테스트." },
        { title:"GAP 트래커", body:"GAP 서브탭은 어떤 무브가 낡아지고 있는지 표시. 도메인별 신선도 추적이 주의가 필요한 것을 파악하는 데 도움." },
        { title:"훈련 도구", body:"라이브러리 서브탭에는 네 가지 창의적 도구 스트립: Explore, R/R/R, Combine, Map." },
        { title:"동영상 링크", body:"설정에서 동영상 링크 표시 제어: 내부만(상세 내 링크만) 또는 내부와 외부(카드의 빠른 열기 아이콘)." },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"BATTLE의 용도", body:"BATTLE은 대회 준비 허브입니다. 라운드 계획, 이벤트 준비, 프리스타일 리스트 구축, 라이벌과 훈련 파트너 관리." },
        { title:"PLAN — 라운드 만들기", body:"BATTLE > PLAN에서 +를 탭하여 새 라운드 모달을 엽니다. 이름, 색상, 슬롯 수를 설정. 각 슬롯은 라이브러리의 무브나 세트를 담습니다." },
        { title:"PLAN — 템플릿", body:"현재 라운드 레이아웃을 템플릿으로 저장. 언제든 다시 불러오기. 템플릿은 텐션 포인트(Round Arc)를 포함한 전체 구조를 보존." },
        { title:"PLAN — 대회 시뮬레이터", body:"PLAN 상단의 대회 시뮬레이션을 탭하여 설정 가능한 라운드, 휴식, 전체 요약이 있는 브래킷 연습 세션 실행." },
        { title:"PREP — 배틀 준비", body:"BATTLE > PREP는 다중 배틀 순차 훈련용. 이벤트 상세, 위치(Google Maps 자동 링크), 이벤트 URL, 카운트다운이 포함된 배틀 카드 생성." },
        { title:"FREESTYLE", body:"잼이나 사이퍼 중 순환할 무브의 라이브 리스트를 구축. 이름이나 카테고리로 검색, 무브나 전체 세트 선택." },
        { title:"RIVALS", body:"BATTLE > RIVALS에는 세 개의 서브탭: RIVALS, SPARRING MATE, CREW. 강점 도메인, 시그니처 무브, 게임 플랜, 스파링 히스토리가 포함된 전체 프로필로 사람 추가." },
        { title:"1v1 스파링", body:"HOME에서 스파링에 접근. 솔로 또는 1v1 모드 선택. 1v1에서는 상대 이름, 라운드 수, 장소를 설정. 동전 던지기로 선공 결정. 타이머가 각 측의 라운드를 추적." },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"REFLECT의 용도", body:"REFLECT는 진행 상황을 검토하는 곳입니다. 캘린더는 모든 활동을 표시, 스탠스는 자기 평가를 추적, 목표는 타겟을 추적, 노트는 생각을 저장." },
        { title:"캘린더", body:"월간 그리드와 일별 상세 뷰. 아무 날이나 탭하여 모든 세션을 봅니다. 세션 일지와 바디 로그가 일별로 사용 가능." },
        { title:"STANCE — MyStance", body:"브레이킹 6개 도메인에서 1-10 스케일로 자기 평가. 육각형 레이더 차트가 프로필을 시각화." },
        { title:"STANCE — Development Story", body:"90일 이상의 데이터 후, 자동 생성된 팩트 기반 내러티브가 여정을 요약. 카드로 공유 가능." },
        { title:"목표", body:"진행률 추적과 마감일이 있는 목표 카드. 두 가지 유형: Journey Goals(계획이 있는 질적 마일스톤)와 Target Goals(카운터가 있는 수치 목표)." },
        { title:"노트", body:"시간순 노트와 세션 후 성찰. 콤보 아이디어, 관찰, 참조에 사용." },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"훈련 도구",
      items:[
        { title:"Explore", body:"수정자 칩과 4가지 모드가 있는 창의적 탐색 도구. MOVES > 라이브러리 도구 스트립에서 접근." },
        { title:"R/R/R (복원 / 리믹스 / 재구축)", body:"기존 무브를 재방문하고 변형하기 위한 큐레이션된 프롬프트. 타이머 옵션: 1, 3, 5, 10분, 커스텀, 제한 없음." },
        { title:"Combine", body:"랜덤 무브 조합 생성기. 라이브러리에서 추출하여 예상치 못한 페어링을 생성." },
        { title:"Map", body:"방향성 무브 페어링 매트릭스. 어떤 무브가 어떤 무브로 이어지는지 매핑하여 전환 어휘를 구축." },
        { title:"Drill", body:"바디 체크인과 성찰이 있는 타이밍 반복 세션." },
        { title:"Spar", body:"솔로 또는 1v1 스파링 세션. 솔로: 개인 기록 추적이 있는 타이밍 라운드. 1v1: 상대와 교대 라운드, 공유 가능한 요약." },
        { title:"Flow", body:"음악성 연습 세션. 음악을 틀고, 타이머를 설정하고, 비트에 맞춰 춤추기에 집중." },
      ]
    },
    {
      id:"profile", icon:"👤", title:"프로필 & 설정",
      items:[
        { title:"프로필", body:"헤더의 프로필 아바타를 탭. 닉네임, 나이, 브레이킹 시작일, 목표, 춤추는 이유를 설정." },
        { title:"설정", body:"헤더의 톱니바퀴 아이콘 또는 프로필 오버레이에서 접근. 테마, 텍스트 크기, 언어, 기본 뷰 등을 설정." },
        { title:"백업", body:"JSON 파일로 데이터를 저장하고 복원. 프로필 오버레이의 데이터 섹션에서 사용 가능." },
        { title:"언어", body:"MovesBook은 12개 언어를 지원: 영어, 이탈리아어, 스페인어, 프랑스어, 포르투갈어, 독일어, 일본어, 중국어, 러시아어, 한국어, 태국어, 베트남어." },
        { title:"법률", body:"개인정보 처리방침, 서비스 약관, 면책 조항은 프로필 오버레이의 법률 섹션에서 접근 가능." },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"팁과 요령",
      items:[
        { title:"제목에 이모지 사용", body:"목표, 습관, 노트, 무브 모두 제목에 이모지를 지원합니다. 예: '👟 일일 연습'." },
        { title:"시그니처 콤보에 세트 사용", body:"MOVES > SETS에서 시그니처 콤보나 오프닝 시퀀스를 위한 세트를 만드세요." },
        { title:"노트는 짧게", body:"노트는 빠른 캡처로 가장 잘 작동합니다. 구조가 필요하다면 아마 목표일 것입니다." },
        { title:"매일 체크인", body:"훈련 후 앱을 열고 HOME 탭에서 루틴을 체크하세요." },
        { title:"무브에 설명 추가", body:"무브의 설명 필드는 개인 기술 노트입니다 — 핵심 큐, 흔한 실수, 집중할 포인트." },
        { title:"큰 변경 전 내보내기", body:"무브 라이브러리를 비우기 전에 백업 기능으로 JSON 백업을 저장하세요." },
      ]
    },
  ],

  th: [
    {
      id:"overview", icon:"book", title:"ภาพรวม",
      items:[
        { title:"MovesBook คืออะไร?", body:"MovesBook เป็นเทรนเนอร์เบรกกิ้งส่วนตัวที่ออกแบบมาเพื่อช่วยให้คุณฝึกซ้อมอย่างชาญฉลาด ครอบคลุมทุกขั้นตอนของการฝึก: ตั้งเป้าหมาย สร้างไลบรารีท่า วางแผนเซ็ตแบทเทิล และติดตามนิสัยประจำวัน ทุกอย่างบันทึกในเครื่องและซิงค์กับคลาวด์เมื่อลงชื่อเข้าใช้" },
        { title:"สี่แท็บหลัก", body:"HOME — แผนประจำวันพร้อมรูทีน ไอเดีย และเป้าหมาย\nMOVES — ไลบรารีท่าส่วนตัว เซ็ต และตัวติดตามช่องว่าง\nBATTLE — วางแผนราวนด์ เตรียมอีเวนต์ ฟรีสไตล์ และจัดการคู่แข่ง\nREFLECT — ปฏิทิน การประเมินท่าทาง เป้าหมาย และบันทึก" },
        { title:"ปุ่ม + (ตรงกลางล่าง)", body:"ปุ่ม + ขนาดใหญ่ตรงกลางล่างจะเปิดโมดัลเพิ่มท่าเสมอ ไม่ว่าจะอยู่ที่แท็บไหน" },
        { title:"ซิงค์คลาวด์", body:"ลงชื่อเข้าใช้ด้วย Google หรืออีเมลเพื่อซิงค์ข้อมูลทั้งหมดกับคลาวด์ ท่า เป้าหมาย นิสัย ราวนด์ และเซ็ตจะถูกจัดเก็บอย่างปลอดภัย" },
        { title:"ซูม", body:"ใช้ตัวควบคุมซูม − และ + ในการตั้งค่าเพื่อปรับขนาดแอปทั้งหมด แตะตัวเลข % เพื่อรีเซ็ตเป็น 100%" },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"HOME ใช้สำหรับ", body:"HOME เป็นพื้นที่วางแผนประจำวัน สร้างวันของคุณด้วยรูทีน ไอเดีย และเป้าหมาย ทุกอย่างเพิ่มโดยผู้ใช้ ไม่มีการ์ดหรือคำแนะนำล่วงหน้า" },
        { title:"สแตกไทล์", body:"HOME เป็นสแตกไทล์เลื่อนได้ สามประเภท:\n• รูทีน — กิจกรรมซ้ำหรือครั้งเดียวพร้อมอีโมจิ ชื่อ เวลา คำอธิบาย\n• ไอเดีย — บันทึกย่อ ลิงก์วิดีโอ หรือความคิดฝึกซ้อม\n• เป้าหมาย/นิสัย — ดึงจากข้อมูลเป้าหมายและนิสัยที่มีอยู่" },
        { title:"เพิ่มไทล์", body:"แตะ '+ เพิ่มไปวันนี้' ด้านล่างเพื่อเปิดตัวเลือก เลือกเพิ่มรูทีน เพิ่มไอเดีย หรือเพิ่มเป้าหมายหรือนิสัย" },
        { title:"การโต้ตอบกับไทล์", body:"แตะแถวหัวข้อเพื่อแก้ไขในบอตทอมชีต แตะคำอธิบายเพื่อขยาย/ยุบ แตะช่องทำเครื่องหมายเพื่อเสร็จ แตะ X เพื่อลบ" },
        { title:"เมนูเฟือง", body:"ไอคอนเฟืองเปิดตัวเลือก: จัดเรียงไทล์ จัดการรูทีน รีเซ็ตวันนี้" },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"MOVES ใช้สำหรับ", body:"MOVES เป็นไลบรารีท่าส่วนตัว ทุกท่าที่คุณรู้หรือกำลังเรียนอยู่ที่นี่ จัดระเบียบตามหมวดหมู่ ติดตามความชำนาญ เพิ่มคำอธิบายและวิดีโออ้างอิง จัดกลุ่มท่าเป็นเซ็ตสำหรับแบทเทิล" },
        { title:"เพิ่มท่า", body:"แตะ + ในแถบล่าง กรอก: ชื่อท่า (จำเป็น) หมวดหมู่ คำอธิบาย ลิงก์วิดีโอ ความชำนาญ (สไลเดอร์ 0–100%) แตะบันทึก" },
        { title:"ระดับความชำนาญ", body:"ความชำนาญเป็นคะแนน 0–100% ที่คุณกำหนดเอง สีแถบ: แดง 0–30% แอมเบอร์ 30–60% เหลือง 60–80% เขียว 80–100%" },
        { title:"มุมมอง: ไทล์ รายการ ต้นไม้", body:"สลับมุมมองด้วยไอคอนในส่วนหัวไลบรารี" },
        { title:"หมวดหมู่", body:"ท่าจัดกลุ่มตามหมวดหมู่ แตะหมวดหมู่เพื่อดูท่า จากเมนูสามารถเปลี่ยนชื่อ เปลี่ยนสี ทำซ้ำ หรือลบ" },
        { title:"เซ็ต", body:"เซ็ตเป็นกลุ่มท่าที่ตั้งชื่อ — คอมโบหรือลำดับ ไปที่ MOVES > SETS เพื่อสร้าง" },
        { title:"แฟลชการ์ด", body:"ในแท็บย่อย SETS แตะปุ่มแฟลชการ์ดเพื่อเริ่มฝึกความจำ เลือกเซ็ตที่จะรวม แล้วพลิกการ์ดทดสอบความจำ" },
        { title:"ตัวติดตาม GAP", body:"แท็บย่อย GAP แสดงท่าที่กำลังเก่า การติดตามความสดใหม่ตามโดเมนช่วยระบุสิ่งที่ต้องการความสนใจ" },
        { title:"เครื่องมือฝึกซ้อม", body:"แท็บย่อยไลบรารีมีแถบเครื่องมือสี่ชิ้นสร้างสรรค์: Explore, R/R/R, Combine และ Map" },
        { title:"ลิงก์วิดีโอ", body:"ควบคุมการแสดงลิงก์วิดีโอในการตั้งค่า: ภายในเท่านั้น หรือภายในและภายนอก" },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"BATTLE ใช้สำหรับ", body:"BATTLE เป็นศูนย์เตรียมการแข่งขัน วางแผนราวนด์ เตรียมอีเวนต์ สร้างรายการฟรีสไตล์ จัดการคู่แข่งและคู่ซ้อม" },
        { title:"PLAN — สร้างราวนด์", body:"ใน BATTLE > PLAN แตะ + เพื่อเปิดโมดัลราวนด์ใหม่ ตั้งชื่อ สี และจำนวนช่อง" },
        { title:"PLAN — เทมเพลต", body:"บันทึกเลย์เอาต์ราวนด์ปัจจุบันเป็นเทมเพลต โหลดกลับได้ทุกเมื่อ" },
        { title:"PLAN — ตัวจำลองการแข่งขัน", body:"แตะจำลองการแข่งขันด้านบน PLAN เพื่อรันเซสชันฝึกซ้อมแบบสาย" },
        { title:"PREP — เตรียมแบทเทิล", body:"BATTLE > PREP สำหรับฝึกหลายแบทเทิลต่อเนื่อง สร้างการ์ดแบทเทิลพร้อมรายละเอียดอีเวนต์ สถานที่ URL และนับถอยหลัง" },
        { title:"FREESTYLE", body:"สร้างรายการท่าสดสำหรับใช้ระหว่างแจมหรือไซเฟอร์" },
        { title:"RIVALS", body:"BATTLE > RIVALS มีสามแท็บย่อย: RIVALS, SPARRING MATE และ CREW เพิ่มคนพร้อมโปรไฟล์เต็ม" },
        { title:"1v1 สปาร์", body:"เข้า Spar จาก HOME เลือกโหมด Solo หรือ 1v1 ใน 1v1 ตั้งชื่อคู่ต่อสู้ จำนวนราวนด์ และสถานที่ โยนเหรียญตัดสินผู้เริ่ม" },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"REFLECT ใช้สำหรับ", body:"REFLECT เป็นที่ทบทวนความก้าวหน้า ปฏิทินแสดงกิจกรรมทั้งหมด Stance ติดตามการประเมินตนเอง เป้าหมายติดตามเป้า บันทึกเก็บความคิด" },
        { title:"ปฏิทิน", body:"ตารางรายเดือนพร้อมมุมมองรายละเอียดวัน แตะวันใดก็ได้เพื่อดูเซสชันทั้งหมด" },
        { title:"STANCE — MyStance", body:"ประเมินตนเองใน 6 โดเมนเบรกกิ้งบนสเกล 1–10 กราฟเรดาร์หกเหลี่ยมแสดงโปรไฟล์" },
        { title:"STANCE — Development Story", body:"หลังจาก 90+ วันของข้อมูล เรื่องเล่าข้อเท็จจริงที่สร้างอัตโนมัติสรุปการเดินทางของคุณ แชร์เป็นการ์ดได้" },
        { title:"เป้าหมาย", body:"การ์ดเป้าหมายพร้อมติดตามความก้าวหน้าและกำหนดเวลา สองประเภท: Journey Goals และ Target Goals" },
        { title:"บันทึก", body:"บันทึกตามลำดับเวลาและการไตร่ตรองหลังเซสชัน" },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"เครื่องมือฝึกซ้อม",
      items:[
        { title:"Explore", body:"เครื่องมือสำรวจสร้างสรรค์พร้อมชิปตัวปรับและ 4 โหมด เข้าถึงจาก MOVES > ไลบรารี แถบเครื่องมือ" },
        { title:"R/R/R (คืนสภาพ / รีมิกซ์ / สร้างใหม่)", body:"พรอมต์คัดสรรสำหรับทบทวนและแปลงท่าที่มี ตัวเลือกตั้งเวลา: 1, 3, 5, 10 นาที กำหนดเอง หรือไม่จำกัด" },
        { title:"Combine", body:"ตัวสร้างการผสมท่าแบบสุ่ม ดึงจากไลบรารีเพื่อสร้างคู่ที่ไม่คาดคิด" },
        { title:"Map", body:"เมทริกซ์จับคู่ท่าตามทิศทาง แมปว่าท่าไหนไหลไปท่าไหน สร้างคำศัพท์การเปลี่ยน" },
        { title:"Drill", body:"เซสชันทำซ้ำจับเวลาพร้อมเช็คอินร่างกายและไตร่ตรอง" },
        { title:"Spar", body:"เซสชันสปาร์ริง Solo หรือ 1v1 Solo: ราวนด์จับเวลาพร้อมติดตามสถิติส่วนตัว 1v1: ราวนด์สลับกับคู่ต่อสู้" },
        { title:"Flow", body:"เซสชันฝึกดนตรี เปิดเพลง ตั้งตัวจับเวลา แล้วมุ่งเน้นเต้นตามจังหวะ" },
      ]
    },
    {
      id:"profile", icon:"👤", title:"โปรไฟล์และการตั้งค่า",
      items:[
        { title:"โปรไฟล์ของคุณ", body:"แตะอวาตาร์โปรไฟล์ในส่วนหัว ตั้งชื่อเล่น อายุ วันที่เริ่มเบรกกิ้ง เป้าหมาย และเหตุผลที่เต้น" },
        { title:"การตั้งค่า", body:"เข้าถึงผ่านไอคอนเฟืองในส่วนหัวหรือในโอเวอร์เลย์โปรไฟล์ กำหนดค่าธีม ขนาดตัวอักษร ภาษา มุมมองเริ่มต้น และอื่นๆ" },
        { title:"สำรองข้อมูล", body:"บันทึกและกู้คืนข้อมูลเป็นไฟล์ JSON มีในโอเวอร์เลย์โปรไฟล์ส่วนข้อมูล" },
        { title:"ภาษา", body:"MovesBook รองรับ 12 ภาษา: อังกฤษ อิตาลี สเปน ฝรั่งเศส โปรตุเกส เยอรมัน ญี่ปุ่น จีน รัสเซีย เกาหลี ไทย และเวียดนาม" },
        { title:"กฎหมาย", body:"นโยบายความเป็นส่วนตัว ข้อกำหนดการให้บริการ และข้อจำกัดความรับผิดชอบเข้าถึงได้จากโอเวอร์เลย์โปรไฟล์ในส่วนกฎหมาย" },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"เคล็ดลับ",
      items:[
        { title:"ใช้อีโมจิในชื่อเรื่อง", body:"เป้าหมาย นิสัย บันทึก และท่า รองรับอีโมจิในชื่อเรื่อง เช่น '👟 ฝึกซ้อมประจำวัน'" },
        { title:"ใช้เซ็ตสำหรับคอมโบเซ็นเนเจอร์", body:"สร้างเซ็ตใน MOVES > SETS สำหรับคอมโบเซ็นเนเจอร์หรือลำดับเปิด" },
        { title:"เก็บบันทึกให้สั้น", body:"บันทึกทำงานได้ดีที่สุดเป็นการจับภาพเร็ว ถ้าต้องการโครงสร้าง อาจเป็นเป้าหมาย" },
        { title:"เช็คอินทุกวัน", body:"เปิดแอปหลังฝึกซ้อมและทำเครื่องหมายรูทีนในแท็บ HOME" },
        { title:"เพิ่มคำอธิบายให้ท่า", body:"ช่องคำอธิบายท่าคือบันทึกเทคนิคส่วนตัว — เคล็ดลับสำคัญ ข้อผิดพลาดทั่วไป จุดโฟกัส" },
        { title:"ส่งออกก่อนเปลี่ยนแปลงใหญ่", body:"ก่อนล้างไลบรารีท่า ใช้ฟังก์ชันสำรองข้อมูลเพื่อบันทึก JSON" },
      ]
    },
  ],

  vi: [
    {
      id:"overview", icon:"book", title:"Tổng Quan",
      items:[
        { title:"MovesBook là gì?", body:"MovesBook là huấn luyện viên breaking cá nhân được thiết kế để giúp bạn tập luyện thông minh hơn. Nó bao gồm mọi giai đoạn luyện tập: đặt mục tiêu, xây dựng thư viện động tác, lên kế hoạch set battle và theo dõi thói quen hàng ngày. Tất cả được lưu cục bộ trên thiết bị và đồng bộ lên cloud khi đăng nhập." },
        { title:"Bốn tab chính", body:"HOME — kế hoạch hàng ngày với thói quen, ý tưởng và m���c tiêu.\nMOVES — thư viện động tác cá nhân, set và theo dõi khoảng trống.\nBATTLE — lên kế hoạch round, chuẩn bị sự kiện, freestyle và quản lý đối thủ.\nREFLECT — lịch, đánh giá stance, mục tiêu và ghi chú." },
        { title:"Nút + (giữa dưới)", body:"Nút + lớn ở giữa dưới luôn mở modal Thêm Động Tác, bất kể bạn đang ở tab nào." },
        { title:"Đồng bộ cloud", body:"Đăng nhập bằng Google hoặc Email để đồng bộ tất cả dữ liệu lên cloud. Động tác, mục tiêu, thói quen, round và set được lưu trữ an toàn và có sẵn trên mọi thiết bị." },
        { title:"Thu phóng", body:"Dùng điều khiển thu phóng − và + trong Cài đặt để co giãn toàn bộ ứng dụng. Nhấn số % để đặt lại về 100%." },
      ]
    },
    {
      id:"home", icon:"home", title:"HOME",
      items:[
        { title:"HOME dùng để làm gì", body:"HOME là không gian lập kế hoạch hàng ngày. Xây dựng ngày của bạn với thói quen, ý tưởng và mục tiêu. Tất cả do người dùng thêm — không có thẻ hay gợi ý mặc định." },
        { title:"Ngăn xếp tile", body:"HOME là một ngăn xếp tile cuộn được. Ba loại:\n• Thói quen — hoạt động lặp lại hoặc một lần với emoji, tên, thời lượng, mô tả\n• Ý tưởng — ghi chú nhanh, liên kết video hoặc suy nghĩ tập luyện\n• Mục tiêu/Thói quen — lấy từ dữ liệu mục tiêu và thói quen hiện có" },
        { title:"Thêm tile", body:"Nhấn '+ Thêm vào hôm nay' ở dưới để mở bộ chọn. Chọn Thêm Thói Quen, Thêm Ý Tưởng hoặc Thêm Mục Tiêu hoặc Thói Quen." },
        { title:"Tương tác với tile", body:"Nhấn hàng tiêu đề để chỉnh sửa trong bottom sheet. Nhấn mô tả để mở rộng/thu gọn. Nhấn checkbox để hoàn thành. Nhấn X để xóa." },
        { title:"Menu bánh răng", body:"Biểu tượng bánh răng mở các tùy chọn: Sắp xếp lại tile, Quản lý thói quen, Đặt lại hôm nay." },
      ]
    },
    {
      id:"moves", icon:"scroll", title:"MOVES",
      items:[
        { title:"MOVES dùng để làm gì", body:"MOVES là thư viện động tác cá nhân. Mọi động tác bạn biết hoặc đang học đều ở đây. Sắp xếp theo danh mục, theo dõi thành thạo, thêm mô tả và tham chiếu video, nhóm động tác thành set cho battle." },
        { title:"Thêm động tác", body:"Nhấn + ở thanh dưới. Điền: Tên động tác (bắt buộc), Danh mục, Mô tả, Liên kết video, Thành thạo (thanh trượt 0–100%). Nhấn Lưu." },
        { title:"Mức độ thành thạo", body:"Thành thạo là điểm 0–100% bạn tự gán. Màu thanh: Đỏ 0–30%, Hổ phách 30–60%, Vàng 60–80%, Xanh 80–100%." },
        { title:"Xem: Tile, Danh sách, Cây", body:"Chuyển đổi giữa các chế độ xem bằng biểu tượng trong header THƯVIỆN." },
        { title:"Danh mục", body:"Động tác được nhóm theo danh mục. Nhấn danh mục để xem động tác. Từ menu có thể đổi tên, đổi màu, nhân bản hoặc xóa." },
        { title:"Set", body:"Set là nhóm động tác có tên — combo hoặc chuỗi. Vào MOVES > SETS để tạo." },
        { title:"Thẻ ghi nhớ", body:"Trong tab phụ SETS, nhấn nút Thẻ Ghi Nhớ để bắt đầu bài tập trí nhớ. Chọn set để bao gồm, rồi lật thẻ kiểm tra trí nhớ." },
        { title:"Theo dõi GAP", body:"Tab phụ GAP hiển thị động tác nào đang cũ. Theo dõi độ tươi theo domain giúp xác định cần chú ý gì." },
        { title:"Công cụ tập luyện", body:"Tab phụ THƯVIỆN có thanh công cụ với bốn công cụ sáng tạo: Explore, R/R/R, Combine và Map." },
        { title:"Liên kết video", body:"Kiểm soát hiển thị liên kết video trong Cài đặt: Chỉ bên trong hoặc Bên trong và bên ngoài." },
      ]
    },
    {
      id:"battle", icon:"swords", title:"BATTLE",
      items:[
        { title:"BATTLE dùng để làm gì", body:"BATTLE là trung tâm chuẩn bị thi đấu. Lên kế hoạch round, chuẩn bị sự kiện, xây dựng danh sách freestyle, quản lý đối thủ và đối tác tập luyện." },
        { title:"PLAN — Tạo round", body:"Trong BATTLE > PLAN, nhấn + để mở modal Round Mới. Đặt tên, màu và số slot." },
        { title:"PLAN — Mẫu", body:"Lưu bố cục round hiện tại làm mẫu. Tải lại bất cứ lúc nào. Mẫu giữ toàn bộ cấu trúc bao gồm điểm căng thẳng (Round Arc)." },
        { title:"PLAN — Mô phỏng thi đấu", body:"Nhấn MÔ PHỎNG THI ĐẤU trên cùng PLAN để chạy phiên tập bracket với round cấu hình được, nghỉ ngơi và tóm tắt đầy đủ." },
        { title:"PREP — Chuẩn bị Battle", body:"BATTLE > PREP cho tập luyện nhiều battle liên tục. Tạo thẻ battle với chi tiết sự kiện, địa điểm (liên kết tự động Google Maps), URL sự kiện và đếm ngược." },
        { title:"FREESTYLE", body:"Xây dựng danh sách động tác trực tiếp để dùng trong jam hoặc cypher. Tìm theo tên hoặc danh mục, chọn động tác hoặc toàn bộ set." },
        { title:"RIVALS", body:"BATTLE > RIVALS có ba tab phụ: RIVALS, SPARRING MATE và CREW. Thêm người với hồ sơ đầy đủ bao gồm domain mạnh, động tác đặc trưng, kế hoạch game và lịch sử spar." },
        { title:"1v1 Spar", body:"Truy cập Spar từ HOME. Chọn chế độ Solo hoặc 1v1. Trong 1v1, đặt tên đối thủ, số round và địa điểm. Tung đồng xu quyết định ai đi trước." },
      ]
    },
    {
      id:"reflect", icon:"📊", title:"REFLECT",
      items:[
        { title:"REFLECT dùng để làm gì", body:"REFLECT là nơi bạn xem lại tiến trình. Lịch hiển thị tất cả hoạt động, Stance theo dõi tự đánh giá, Mục tiêu theo dõi target, Ghi chú lưu suy nghĩ." },
        { title:"LỊCH", body:"Lưới tháng với xem chi tiết ngày. Nhấn ngày bất kỳ để xem tất cả phiên. Nhật ký phiên và log cơ thể có sẵn mỗi ngày." },
        { title:"STANCE — MyStance", body:"Tự đánh giá trong 6 domain breaking trên thang 1–10. Biểu đồ radar lục giác trực quan hóa hồ sơ." },
        { title:"STANCE — Development Story", body:"Sau 90+ ngày dữ liệu, câu chuyện thực tế tự tạo tóm tắt hành trình. Chia sẻ dạng thẻ." },
        { title:"MỤC TIÊU", body:"Thẻ mục tiêu với theo dõi tiến trình và hạn chót. Hai loại: Journey Goals (cột mốc chất lượng với kế hoạch) và Target Goals (số để đạt với bộ đếm)." },
        { title:"GHI CHÚ", body:"Ghi chú theo thời gian và suy ngẫm sau phiên. Dùng cho ý tưởng combo, quan sát, tham chiếu." },
      ]
    },
    {
      id:"tools", icon:"🛠️", title:"Công Cụ Tập Luyện",
      items:[
        { title:"Explore", body:"Công cụ khám phá sáng tạo với chip bổ sung và 4 chế độ. Truy cập từ MOVES > THƯVIỆN thanh công cụ." },
        { title:"R/R/R (Khôi phục / Remix / Xây lại)", body:"Gợi ý được chọn lọc để xem lại và biến đổi động tác hiện có. Tùy chọn hẹn giờ: 1, 3, 5, 10 phút, Tùy chỉnh hoặc Không giới hạn." },
        { title:"Combine", body:"Bộ tạo kết hợp động tác ngẫu nhiên. Lấy từ thư viện để tạo ghép đôi bất ngờ." },
        { title:"Map", body:"Ma trận ghép đôi động tác theo hướng. Ánh xạ động tác nào chảy sang động tác nào, xây dựng vốn từ chuyển tiếp." },
        { title:"Drill", body:"Phiên lặp lại tính giờ với check-in cơ thể và suy ngẫm." },
        { title:"Spar", body:"Phiên sparring Solo hoặc 1v1. Solo: round tính giờ với theo dõi kỷ lục cá nhân. 1v1: round xen kẽ với đối thủ, tóm tắt chia sẻ được." },
        { title:"Flow", body:"Phiên tập âm nhạc tính. Bật nhạc, đặt hẹn giờ và tập trung nhảy theo nhịp." },
      ]
    },
    {
      id:"profile", icon:"👤", title:"Hồ Sơ & Cài Đặt",
      items:[
        { title:"Hồ sơ của bạn", body:"Nhấn avatar hồ sơ trong header. Đặt biệt danh, tuổi, ngày bắt đầu breaking, mục tiêu và lý do bạn nhảy." },
        { title:"Cài đặt", body:"Truy cập qua biểu tượng bánh răng trong header hoặc trong overlay Hồ sơ. Cấu hình chủ đề, cỡ chữ, ngôn ngữ, chế độ xem mặc định và nhiều hơn." },
        { title:"Sao lưu", body:"Lưu và khôi phục dữ liệu dưới dạng file JSON. Có sẵn trong overlay Hồ sơ phần Dữ liệu." },
        { title:"Ngôn ngữ", body:"MovesBook hỗ trợ 12 ngôn ngữ: Anh, Ý, Tây Ban Nha, Pháp, Bồ Đào Nha, Đức, Nhật, Trung, Nga, Hàn, Thái và Việt." },
        { title:"Pháp lý", body:"Chính Sách Bảo Mật, Điều Khoản Dịch Vụ và Tuyên Bố Miễn Trừ có thể truy cập từ overlay Hồ Sơ trong phần Pháp Lý." },
      ]
    },
    {
      id:"tips", icon:"bulb", title:"Mẹo Hay",
      items:[
        { title:"Dùng emoji trong tiêu đề", body:"Mục tiêu, thói quen, ghi chú và động tác đều hỗ trợ emoji trong tiêu đề. Ví dụ: '👟 Tập Luyện Hàng Ngày'." },
        { title:"Dùng set cho combo đặc trưng", body:"Tạo Set trong MOVES > SETS cho combo đặc trưng hoặc chuỗi mở đầu." },
        { title:"Giữ ghi chú ngắn", body:"Ghi chú hoạt động tốt nhất như nắm bắt nhanh. Nếu cần cấu trúc, có lẽ đó là Mục tiêu." },
        { title:"Check-in hàng ngày", body:"Mở ứng dụng sau tập luyện và đánh dấu thói quen trong tab HOME." },
        { title:"Thêm mô tả cho động tác", body:"Trường mô tả động tác là ghi chú kỹ thuật cá nhân — mẹo chính, lỗi thường gặp, điểm tập trung." },
        { title:"Xuất trước thay đổi lớn", body:"Trước khi xóa thư viện động tác, dùng tính năng Sao Lưu để lưu bản sao JSON." },
      ]
    },
  ],
};
