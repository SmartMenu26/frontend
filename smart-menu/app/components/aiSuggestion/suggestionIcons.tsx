import {
  Dice5,
  Drumstick,
  Dumbbell,
  Flame,
  Leaf,
  Target,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value);

export const isSuggestionImageIcon = (icon?: string) => {
  const normalized = icon?.trim();
  if (!normalized) return false;
  return normalized.startsWith("/") || isRemoteUrl(normalized);
};

export const getSuggestionIconNode = (
  iconName?: string,
  index = 0,
  size = 16
): ReactNode => {
  const normalized = iconName?.trim().toLowerCase();

  switch (normalized) {
    case "leaf":
      return <Leaf size={size} />;
    case "dumbbell":
      return <Dumbbell size={size} />;
    case "target":
      return <Target size={size} />;
    case "zap":
      return <Zap size={size} />;
    case "flame":
      return <Flame size={size} />;
    case "drumstick":
      return <Drumstick size={size} />;
    case "dice":
    case "dice5":
      return <Dice5 size={size} />;
    default: {
      const fallbackIcons = [
        <Leaf key="leaf" size={size} />,
        <Drumstick key="drumstick" size={size} />,
        <Dice5 key="dice" size={size} />,
        <Flame key="flame" size={size} />,
      ];
      return fallbackIcons[index % fallbackIcons.length];
    }
  }
};
