export interface AiUiConfig {
  colors?: {
    background?: string;
    foreground?: string;
    orpColor?: string;
    accent?: string;
    surface?: string;
  };
  fonts?: {
    family?: string;
    size?: number;
    weight?: number;
    letterSpacing?: number;
  };
  rsvp?: {
    bionicBoldRatio?: number;
    orpGuideVisible?: boolean;
    animationStyle?: "none" | "fade" | "slide";
  };
  layout?: {
    sidebarWidth?: number;
    displayPadding?: number;
    showStats?: boolean;
    showProgress?: boolean;
  };
  timing?: {
    sentenceEndMultiplier?: number;
    clauseMultiplier?: number;
    paragraphMultiplier?: number;
  };
}

export interface Settings {
  theme: "light" | "dark" | "system";
  fontSize: number;
  fontFamily: string;
  orpColor: string;
  defaultWpm: number;
}

export interface ReadingSession {
  id: string;
  date: string;
  title: string;
  wordCount: number;
  averageWpm: number;
  targetWpm: number;
  totalTimeSeconds: number;
  timeSavedPercent: number;
}

export interface Bookmark {
  textHash: string;
  title: string;
  wordIndex: number;
  wpm: number;
  timestamp: number;
  totalWords: number;
}
