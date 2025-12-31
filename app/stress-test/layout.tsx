import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Stress Test | Memory Quiz",
};

export default function StressTestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}