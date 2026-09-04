import { redirect } from "next/navigation";

export default function LegacyApiKeysRedirect() {
  redirect("/app/desarrolladores/api-keys");
}
