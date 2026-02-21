import CanvasEditorLayout from "@/features/canvas/CanvasEditorLayout";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return (
        <main className="w-full h-screen overflow-hidden">
            <CanvasEditorLayout projectId={resolvedParams.id} />
        </main>
    );
}
