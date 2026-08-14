import { z } from "zod";

export const settingsInputSchema = z.object({
  webIq: z.object({
    enabled: z.boolean(),
    apiKey: z.string().max(500).optional()
  })
});

export const briefSchema = z.object({
  headline: z.string().max(180),
  actions: z.array(z.string().max(300)).min(2).max(4),
  caution: z.string().max(240),
  sourceIndexes: z.array(z.number().int().nonnegative()).max(3).default([])
});

export const pricingInputSchema = z.object({
  demandIndex: z.coerce.number().min(60).max(150).default(112),
  capacityIndex: z.coerce.number().min(60).max(140).default(86),
  equipment: z.enum(["40HC", "40GP", "20GP"]).default("40HC"),
  serviceTier: z.enum(["standard", "priority", "contract"]).default("priority"),
  disruption: z.enum(["none", "weather", "port-congestion"]).default("port-congestion")
});

export const timeInputSchema = z.object({
  minutes: z.coerce.number().int().min(0).max(1440).default(0)
});

export const containerInputSchema = z.object({
  equipment: z.enum(["40HC", "40GP", "20GP"]).default("40HC"),
  priority: z.enum(["balanced", "cost", "service"]).default("balanced")
});
