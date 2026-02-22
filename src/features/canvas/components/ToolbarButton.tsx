import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ButtonHTMLAttributes } from 'react';

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string;
    isActive?: boolean;
    variant?: 'tool' | 'action' | 'simple' | 'delete';
}

export function ToolbarButton({
    icon,
    isActive = false,
    variant = 'tool',
    className,
    ...props
}: ToolbarButtonProps) {
    const baseClasses = "size-11 rounded-xl flex items-center justify-center pointer-events-auto transition-all duration-200";

    const variantClasses = {
        tool: clsx(
            "shadow-sm hover:scale-105",
            isActive ? "bg-sage text-white" : "text-ink-light hover:text-ink hover:bg-black/5"
        ),
        action: "hover:scale-105 border-2 border-dashed border-sage/30 text-sage hover:border-sage hover:bg-sage/5",
        simple: "text-ink-light hover:text-ink hover:bg-black/5",
        delete: clsx(
            "shadow-sm hover:scale-105",
            props.disabled ? "text-ink-light opacity-30 cursor-not-allowed" : "text-red-500 hover:bg-red-50"
        )
    };

    return (
        <button
            type="button"
            className={twMerge(baseClasses, variantClasses[variant], className)}
            {...props}
        >
            <span className="material-symbols-outlined">{icon}</span>
        </button>
    );
}
