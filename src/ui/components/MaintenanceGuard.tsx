"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/infra/auth/authContext";
import { getMaintenanceStatus } from "@/infra/db/adminService";

interface MaintenanceGuardProps {
    children: React.ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string } | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const check = async () => {
            try {
                const status = await getMaintenanceStatus();
                setMaintenance(status);
            } catch {
                // If we can't check maintenance status, allow access
                setMaintenance({ enabled: false, message: "" });
            } finally {
                setChecking(false);
            }
        };
        check();
    }, []);

    // Still loading auth or maintenance status
    if (authLoading || checking) return <>{children}</>;

    // Admin bypasses maintenance
    if (isAdmin) return <>{children}</>;

    // Maintenance mode active for non-admin users
    if (maintenance?.enabled) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center p-6">
                <div className="paper-grain opacity-40"></div>
                <div className="max-w-md text-center relative z-10">
                    <span className="material-symbols-outlined text-6xl text-ink-light/30 mb-4 block">
                        construction
                    </span>
                    <h1 className="font-serif text-3xl font-bold text-ink mb-3">Maintenance en cours</h1>
                    <p className="text-sm text-ink-light leading-relaxed mb-6">
                        {maintenance.message || "L'application est temporairement indisponible. Veuillez réessayer plus tard."}
                    </p>
                    {!user && (
                        <p className="text-[10px] text-ink-light/40 italic">
                            Si vous etes administrateur, connectez-vous pour acceder a l&apos;application.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
