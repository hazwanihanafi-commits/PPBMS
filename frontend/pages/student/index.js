import { useEffect } from "react";
import { useRouter } from "next/router";

export default function StudentIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/me");
  }, []);

  return <div>Loading…</div>;
}
