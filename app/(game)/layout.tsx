import { GameApp } from "@/components/GameApp";

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><GameApp />{children}</>;
}
