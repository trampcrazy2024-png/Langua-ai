const GENDER_MAP: Record<string, { label: string; color: string }> = {
  male_speaker: { label: "مذکر (گوینده مرد میگوید)", color: "#3B82F6" },
  female_speaker: { label: "مؤنث (گوینده زن میگوید)", color: "#EC4899" },
  male_listener: { label: "خطاب به آقا", color: "#3B82F6" },
  female_listener: { label: "خطاب به خانم", color: "#EC4899" },
};

export function GenderBadge({ gender }: { gender?: string | undefined }) {
  if (!gender || gender === "unisex") return null;
  const info = GENDER_MAP[gender];
  if (!info) return null;
  return (
    <span className="text-[9px] font-black px-2 py-1 rounded border"
      style={{ color: info.color, borderColor: `${info.color}40`, backgroundColor: `${info.color}15` }}>
      {info.label}
    </span>
  );
}
