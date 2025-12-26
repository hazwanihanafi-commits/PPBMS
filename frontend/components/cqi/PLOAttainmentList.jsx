import PLOAttainmentRow from "./PLOAttainmentRow";

export default function PLOAttainmentList({ ploData }) {
  return (
    <div className="space-y-4">
      {ploData.map((plo) => (
        <PLOAttainmentRow key={plo.plo} plo={plo} />
      ))}
    </div>
  );
}
