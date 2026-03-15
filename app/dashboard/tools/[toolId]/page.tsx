import { notFound } from 'next/navigation';
import { getToolById, TOOLS } from '@/lib/tools/registry';
import ToolPage from '@/components/dashboard/ToolPage';

// Generate static params for all tools so Next.js can pre-render them
export function generateStaticParams() {
  return TOOLS.map((tool) => ({
    toolId: tool.id,
  }));
}

interface PageProps {
  params: Promise<{ toolId: string }>;
}

export default async function ToolPageRoute({ params }: PageProps) {
  const { toolId } = await params;
  const tool = getToolById(toolId);

  if (!tool) {
    notFound();
  }

  return (
    <ToolPage
      toolId={tool.id}
      title={tool.name}
      description={tool.description}
      icon={tool.icon}
      category={tool.category}
      modelTier={tool.modelTier}
      minPlan={tool.minPlan}
      fields={tool.fields}
      outputLabel={tool.outputLabel}
    />
  );
}
