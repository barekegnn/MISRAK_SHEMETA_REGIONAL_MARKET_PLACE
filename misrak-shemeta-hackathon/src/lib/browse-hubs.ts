import type { ShopCity } from "@/types";
import { SHOP_CITIES } from "@/types";

/** URL/query value for browse (includes hubs that map to a shop city). */
export type BrowseHubParam = "all" | ShopCity | "Haramaya";

export const BROWSE_HUB_PARAMS: BrowseHubParam[] = [
  "all",
  "Harar",
  "Haramaya",
  ...SHOP_CITIES.filter((c) => c !== "Harar"),
];

/** Eastern Triangle: Haramaya town/campus buyers often shop Harar-hub stores in this demo. */
export function hubParamToShopCity(hub: string | undefined | null): ShopCity | "all" {
  if (!hub || hub === "all") return "all";
  if (hub === "Haramaya") return "Harar";
  if (SHOP_CITIES.includes(hub as ShopCity)) return hub as ShopCity;
  return "all";
}

export function isValidHubParam(h: string): h is BrowseHubParam {
  return BROWSE_HUB_PARAMS.includes(h as BrowseHubParam);
}
