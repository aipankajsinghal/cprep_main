export const CLUSTERS = [
  "taxation",
  "accountancy",
  "business-studies",
  "economics",
  "finance",
  "corporate-law",
  "tips-tricks",
  "shortcuts",
  "mindmaps",
  "quick-quiz"
] as const;

export type Cluster = (typeof CLUSTERS)[number];

export const CLUSTER_LABELS: Record<Cluster, string> = {
  taxation: "Taxation",
  accountancy: "Accountancy",
  "business-studies": "Business Studies",
  economics: "Economics",
  finance: "Finance",
  "corporate-law": "Corporate Law",
  "tips-tricks": "Tips & Tricks",
  shortcuts: "Shortcuts",
  mindmaps: "Mindmaps",
  "quick-quiz": "Quick Quiz"
};

export function isCluster(value: string): value is Cluster {
  return (CLUSTERS as readonly string[]).includes(value);
}

export function clusterLabel(cluster: string): string {
  if (isCluster(cluster)) {
    return CLUSTER_LABELS[cluster];
  }
  return cluster
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
