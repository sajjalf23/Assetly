const COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#84CC16", // lime
  "#F97316", // orange
  "#6366F1", // indigo
  "#14B8A6", // teal
  "#A855F7",
  "#EAB308",
  "#0EA5E9",
  "#22C55E"
];

const colorMap = {};

export const getAssetColor = (asset) => {
  if (!colorMap[asset]) {
    colorMap[asset] = COLORS[
      Object.keys(colorMap).length % COLORS.length
    ];
  }

  return colorMap[asset];
};