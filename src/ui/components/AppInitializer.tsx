"use client";

import React from "react";
import { useAuth } from "@/infra/auth/authContext";
import { LoadingScreen } from "./LoadingScreen";

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
    const { loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
};
