import CanvasEditor from "@/components/canvas/CanvasEditor";

export default function ProjectPage({ params }: { params: { id: string } }) {
    return (
        <main className="w-full h-screen overflow-hidden">
            <CanvasEditor projectId={params.id} />
        </main>
    );
}
