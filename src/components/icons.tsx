// One icon family for the whole app (Lucide, stroke style) so weight and size match everywhere.
import {
  ArrowLeft,
  Banknote,
  Bus,
  Car,
  ChartPie,
  Coffee,
  House,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Receipt,
  Shield,
  Sun,
  Tag,
  Target,
  Undo2,
  User,
  Utensils,
  Wallet,
  Gift,
  Briefcase,
  Trash2,
  ChevronRight,
  X,
  ArrowLeftRight,
  Sparkles,
  SendHorizontal,
  Volume2,
  VolumeX,
  type LucideProps,
} from "lucide-react";

const STROKE = 1.9;

function wrap(Icon: React.ComponentType<LucideProps>) {
  return function AppIcon({ size = 22, ...rest }: { size?: number } & Omit<LucideProps, "size">) {
    return <Icon size={size} strokeWidth={STROKE} aria-hidden="true" {...rest} />;
  };
}

export const IconSummary = wrap(ChartPie);
export const IconList = wrap(Receipt);
export const IconBudget = wrap(Target);
export const IconAccount = wrap(User);
export const IconAdd = wrap(Plus);
export const IconBack = wrap(ArrowLeft);
export const IconHome = wrap(House);
export const IconWallet = wrap(Wallet);
export const IconLogout = wrap(LogOut);
export const IconShield = wrap(Shield);
export const IconSun = wrap(Sun);
export const IconMoon = wrap(Moon);
export const IconSystem = wrap(Monitor);
export const IconUndo = wrap(Undo2);
export const IconTrash = wrap(Trash2);
export const IconChevron = wrap(ChevronRight);
export const IconTransfer = wrap(ArrowLeftRight);
export const IconClose = wrap(X);
export const IconSparkle = wrap(Sparkles);
export const IconSend = wrap(SendHorizontal);
export const IconVolume = wrap(Volume2);
export const IconVolumeOff = wrap(VolumeX);
export const IconBanknote = wrap(Banknote);

// Category icon chosen by name. Unknown (custom) categories get a neutral tag.
const CATEGORY_RULES: [RegExp, typeof Tag][] = [
  [/อาหาร|ข้าว|ทาน/, Utensils],
  [/กาแฟ|เครื่องดื่ม/, Coffee],
  [/เดินทาง|รถ|น้ำมัน/, Car],
  [/ไฟฟ้า|รถไฟ|โดยสาร|bts|mrt/i, Bus],
  [/ที่พัก|ห้อง|ค่าเช่า|บ้าน/, House],
  [/เงินเดือน|รายได้|โบนัส/, Briefcase],
  [/ของขวัญ/, Gift],
  [/เงินสด|ธนาคาร|พร้อมเพย์/, Banknote],
];

export function CategoryIcon({ name, size = 18 }: { name?: string; size?: number }) {
  const rule = CATEGORY_RULES.find(([pattern]) => name !== undefined && pattern.test(name));
  const Icon = rule ? rule[1] : Tag;
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
}
