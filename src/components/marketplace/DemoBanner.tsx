import { DemoAlert } from "@/components/platform/DemoAlert";

interface DemoBannerProps {
  compact?: boolean;
}

/** @deprecated Use DemoAlert from @/components/platform/DemoAlert */
export function DemoBanner(props: DemoBannerProps) {
  return <DemoAlert {...props} />;
}
