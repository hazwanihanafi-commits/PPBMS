import { useRouter } from "next/router";
import ProgrammePLOPage from "../../components/ProgrammePLOPage";

export default function ProgrammePLOWrapper() {
  const router = useRouter();
  const { programme } = router.query;

  return <ProgrammePLOPage programme={programme} />;
}
