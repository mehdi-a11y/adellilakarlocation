type StarsProps = {
  value: number;
  size?: number;
};

export default function Stars({ value, size = 18 }: StarsProps) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        return (
          <svg
            key={star}
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill={filled ? "#f59e0b" : "none"}
            className={filled ? "text-amber-500" : "text-slate-300"}
          >
            <path
              d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 17l-5.4 2.8 1-6L3.3 9.4l6-.9L12 3Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}
