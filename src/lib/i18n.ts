import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: "HandTrack Gaming Hub",
      subtitle: "Experience the future of gaming with MediaPipe hand tracking",
      devLabel: "Developed By",
      clubLabel: "Club",
      selectGame: "Select a Game",
      backToMenu: "Back to Menu",
      startGame: "Start Game",
      turnOnCamera: "Turn On Camera",
      loadingCamera: "Loading Camera...",
      cameraActive: "Camera Active",
      rules: "Rules",
      singlePlayer: "Single Player",
      multiPlayer: "Multiplayer",
      wins: "Wins",
      rematch: "Rematch",
      score: "Score",
      level: "Level",
      cyberConnect: {
        name: "Cyber Connect",
        desc: "Connect the dots 1 ➜ 2 ➜ 3 without breaking the line.",
        warning: "Warning: Don't cross your own line!",
        winMatch: "WINS THE MATCH!",
        winLevel: "WINS LEVEL",
        perfectScore: "PERFECT SCORE"
      },
      neonHockey: {
        name: "Neon Hand Hockey",
        desc: "Deflect the ball and score in the opponent's goal.",
        player1: "Player 1 (Right)",
        player2: "Player 2 (Left)"
      },
      facePuzzle: {
        name: "Your Face Puzzle",
        desc: "Take a snapshot of your face and solve the puzzle with hand gestures.",
        instruction: "Use your hands to create a box for the snapshot, then pinch to move pieces."
      }
    }
  },
  ar: {
	translation: {
	  title: "ألعاب بتتبع اليد",
	  subtitle: "جرّب تلعب بطريقة جديدة بتتبع اليد",
	  devLabel: "تطوير",
	  clubLabel: "النادي",
	  selectGame: "اختار لعبتك",
	  backToMenu: "رجوع",
	  startGame: "ابدأ اللعب",
	  turnOnCamera: "شعل الكاميرا",
	  loadingCamera: "رانا نشعلو الكاميرا...",
	  cameraActive: "الكاميرا راهي خدامة",
	  rules: "كيفاش تلعب",
	  singlePlayer: "لاعب واحد",
	  multiPlayer: "زوج لاعبين",
      wins: "ربح",
	  rematch: "عاود",
	  score: "النتيجة",
	  level: "المرحلة",
	  cyberConnect: {
		name: "سايبر كونكت",
		desc: "وصل بين 1 ➜ 2 ➜ 3 بخط واحد.",
		warning: "رد بالك: ما تخليش الخط يتقاطع!",
		winMatch: "ربح الجولة!",
		winLevel: "كمّل المرحلة",
		perfectScore: "نتيجة كاملة"
	  },
	  neonHockey: {
		name: "هوكي نيوني",
		desc: "صد الكرة وحاول تسجّل على صاحبك.",
		player1: "اللاعب 1 (يمين)",
		player2: "اللاعب 2 (يسار)"
	  },
      facePuzzle: {
		name: "لغز الوجه",
		desc: "صوّر وجهك وركّب الصورة بيديك.",
		instruction: "دير إطار بيديك باش تصوّر، ومن بعد قرص باش تحرّك القطع."
	  }
	}
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
