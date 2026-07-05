export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="grid place-items-center rounded-xl bg-lime shadow-glow"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 24 24"
          width={size * 0.62}
          height={size * 0.62}
          fill="none"
          className="text-pitch-950"
        >
          <path
            d="M4 12l5-3v6l-5-3zm6-4l5 4-5 4V8zm7 0h3v8h-3V8z"
            fill="currentColor"
          />
        </svg>
      </div>
      <span className="font-display text-xl font-bold tracking-tight text-white">
        Kick<span className="text-lime">ly</span>
      </span>
    </div>
  )
}
