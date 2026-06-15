// Full-survey preview route: /admin/preview/:surveyConfigId
// Loads a SAVED survey config by id and renders it with the respondent-facing
// preview. Note: this shows the last-saved version of the config; unsaved edits
// in the Survey Editor are previewed via the in-editor panel/modal instead.

import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SurveyPreview } from "@/components/SurveyPreview";
import type { SurveyConfig, Taxonomy } from "@shared/schema";

export default function Preview() {
  const [, params] = useRoute("/admin/preview/:surveyConfigId");
  const id = params?.surveyConfigId;

  const { data: config, isLoading } = useQuery<SurveyConfig>({
    queryKey: ["/api/admin/configs", id],
    enabled: !!id,
  });
  const { data: taxonomies } = useQuery<Taxonomy[]>({ queryKey: ["/api/admin/taxonomies"] });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!config) {
    return <p className="text-slate-500" data-testid="text-preview-notfound">Survey not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="text-preview-title">
          Preview: {config.name}
        </h2>
        <p className="text-slate-500">Version {config.version} · {config.status} · last saved view</p>
      </div>
      <div className="w-full">
        <SurveyPreview pages={config.pages} taxonomies={taxonomies ?? []} />
      </div>
    </div>
  );
}
