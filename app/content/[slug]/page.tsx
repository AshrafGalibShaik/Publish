import { PublishedContent } from "@/components/PublishedContent";

interface ContentPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <PublishedContent slug={slug} />
    </div>
  );
}
