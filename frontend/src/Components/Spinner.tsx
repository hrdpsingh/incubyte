// Configuration for caller-driven visual styling and sizing dimensions.
interface SpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export default function Spinner({ className = "", size = "sm" }: SpinnerProps) {
    // Maps semantic size tokens to explicit Tailwind dimensional utilities.
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    };

    return (
        <svg
            className={`animate-spin ${sizeClasses[size]} ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            /* Hides decorative visual element from screen readers; pair with aria-live parent containers. */
            aria-hidden="true"
        >
            {/* Background track indicator */}
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            {/* Active spinning segment covering a 90-degree arc */}
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}