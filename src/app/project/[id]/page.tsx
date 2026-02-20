import CanvasEditor from "@/components/canvas/CanvasEditor";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return (
        <main className="w-full h-screen overflow-hidden">
            <CanvasEditor projectId={resolvedParams.id} />
        </main>
    );
}
