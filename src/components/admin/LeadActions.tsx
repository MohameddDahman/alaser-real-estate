import { useTranslations } from "next-intl";
import { MessageCircle, Phone } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The two ways the client answers an enquiry, one tap each. The WhatsApp
 * message already names the unit, in the visitor's own language.
 */
export function LeadActions({
  phone,
  whatsapp,
  className,
}: {
  phone: string;
  whatsapp: string;
  className?: string;
}) {
  const t = useTranslations("admin");
  return (
    <div className={cn("flex gap-2", className)}>
      <a href={`tel:${phone}`} className="btn btn-quiet btn-sm">
        <Phone className="size-4" strokeWidth={2} aria-hidden="true" />
        {t("call")}
      </a>
      <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-sm">
        <MessageCircle className="size-4" strokeWidth={2} aria-hidden="true" />
        {t("whatsapp")}
      </a>
    </div>
  );
}
