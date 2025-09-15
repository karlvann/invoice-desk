export interface ComponentDimensions {
  // Height is optional if not yet specified/confirmed
  heightCm?: number;
  widthCm: number;
  lengthCm: number;
  notes?: string;
}

export const DEFAULT_WIDTH_CM = 151;
export const DEFAULT_LENGTH_CM = 201;

/**
 * Dimensions dictionary for components/materials referenced by the Layer Guide.
 * - Width/Length: globally default to 151 cm × 201 cm (confirmed).
 * - Springs: per user instruction, show 13 cm height for all stiffness variants.
 * - White: confirmed 2.5 cm per layer (Cooper model uses 4 × 2.5 cm = 10 cm for Layers 2–5).
 * - Latex/Micro/Blue/Purple/Felt (as Layers 2–5): Height per-layer not explicitly specified in source docs.
 *   The Layers 2–5 group totals 10 cm for Cloud/Aurora configurations; exact split across layers is unspecified.
 * - Under-springs (Blue/Purple/Felt): height is effectively 0 cm (functional layer), but values are left as notes
 *   since components can also appear as a regular layer material in some models.
 */
export const layerDimensions: Record<string, ComponentDimensions> = {
  // Springs (heights per user instruction)
  'soft spring - 13cm': {
    heightCm: 13,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Pocket spring unit (soft). Standard height 13 cm (per user selection).',
  },
  'medium spring - 13cm': {
    heightCm: 13,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Pocket spring unit (medium). Standard height 13 cm (per user selection).',
  },
  'firm spring - 13cm': {
    heightCm: 13,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Pocket spring unit (firm). Standard height 13 cm (per user selection).',
  },

  // Confirmed layer heights
  white: {
    heightCm: 2.5,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Polyfoam (Cooper). 4 × 2.5 cm = 10 cm total for Layers 2–5.',
  },

  // Layer materials with unspecified per-layer heights (part of 10 cm group)
  'soft latex': {
    heightCm: 5,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Latex (soft). 5 cm layer height.',
  },
  'medium latex': {
    heightCm: 5,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Latex (medium). 5 cm layer height.',
  },
  'firm latex': {
    heightCm: 5,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Latex (firm). 5 cm layer height.',
  },
  micro: {
    heightCm: 3.5,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Micro comfort layer. 3.5 cm layer height.',
  },
  blue: {
    heightCm: 1.5,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Blue foam. As under-springs: effectively 0 cm; as a layer (L2–L5): typically 1.5 cm when present.',
  },
  purple: {
    heightCm: 2.5,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Purple foam. As under-springs: effectively 0 cm; as a layer (L2–L5): 2.5 cm.',
  },
  felt: {
    heightCm: 0.4,
    widthCm: DEFAULT_WIDTH_CM,
    lengthCm: DEFAULT_LENGTH_CM,
    notes: 'Felt. 4 mm thickness (0.4 cm).',
  },
};