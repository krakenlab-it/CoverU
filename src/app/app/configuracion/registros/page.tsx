import { redirect } from "next/navigation";

export default function LegacyRequestLogsRedirect() {
  redirect("/app/desarrolladores/registros");
}
