import { ColPaliManager } from "@/components/colpali";

export default function ColPaliPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ColPali Document Search</h1>
        <p className="text-muted-foreground">
          Index and search PDF documents using vision-language models
        </p>
      </div>
      <ColPaliManager className="w-full" />
    </div>
  );
}
