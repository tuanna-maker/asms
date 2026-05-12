import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AttributeModuleNav } from "@/components/settings/attributes/AttributeModuleNav";
import { AttributeModulePanel } from "@/components/settings/attributes/AttributeModulePanel";
import { AttributeSettingsLayout } from "@/components/settings/attributes/AttributeSettingsLayout";
import { Button } from "@/components/ui/button";
import {
  ATTRIBUTE_SETTINGS_BASE_PATH,
  DEFAULT_ATTRIBUTE_MODULE_KEY,
  isAttributeModuleKey,
} from "@/lib/attribute-settings-config";

export default function AttributeSettingsPage() {
  const { moduleKey } = useParams<{ moduleKey?: string }>();

  if (!moduleKey) {
    return <Navigate to={`${ATTRIBUTE_SETTINGS_BASE_PATH}/${DEFAULT_ATTRIBUTE_MODULE_KEY}`} replace />;
  }

  if (!isAttributeModuleKey(moduleKey)) {
    return <Navigate to={`${ATTRIBUTE_SETTINGS_BASE_PATH}/${DEFAULT_ATTRIBUTE_MODULE_KEY}`} replace />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/cai-dat">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại Cài đặt
          </Link>
        </Button>
      </div>
      <AttributeSettingsLayout nav={<AttributeModuleNav activeKey={moduleKey} />}>
        <AttributeModulePanel moduleKey={moduleKey} />
      </AttributeSettingsLayout>
    </div>
  );
}
