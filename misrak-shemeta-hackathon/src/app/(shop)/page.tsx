import { getPlatformStats } from "@/app/actions/stats";
import { HomeHero } from "./home-content";

export default async function HomePage() {
  const initial = await getPlatformStats();
  return <HomeHero initial={initial} />;
}
