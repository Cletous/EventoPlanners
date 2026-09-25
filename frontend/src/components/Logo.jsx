export default function Logo({ compact = false }) {
  return (
    <div className={`overflow-hidden rounded-xl ${compact ? "w-36" : "w-48"}`}>
      <img
        src="/eventoplanners-logo.png"
        alt="EventoPlanners"
        className="block w-full h-auto"
      />
    </div>
  );
}
