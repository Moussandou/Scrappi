"use client";

import React from "react";
import { useAuth } from "@/infra/auth/authContext";
import { LoadingScreen } from "./LoadingScreen";

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
    const { loading } = useAuth();
    const [shouldShow, setShouldShow] = React.useState(false);

    React.useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (loading) {
            // Wait 400ms before showing the loader to avoid flashing on fast connections
            timeout = setTimeout(() => {
                setShouldShow(true);
            }, 400);
        } else {
            setShouldShow(false);
        }
        return () => clearTimeout(timeout);
    }, [loading]);

    if (loading && shouldShow) {
        return <LoadingScreen />;
    }

    if (loading && !shouldShow) {
        return <div className="fixed inset-0 bg-paper z-[200]" />; // Minimal placeholder
    }

    return <>{children}</>;
};
