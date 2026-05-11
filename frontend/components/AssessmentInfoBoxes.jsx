export default function AssessmentInfoBoxes() {

  const boxes = [

    {
      title: "TRX500",
      color: "from-blue-500 to-cyan-500",
      items: [
        "5 = Excellent",
        "4 = Good",
        "3 = Satisfactory",
        "2 = Weak",
        "1 = Poor"
      ]
    },

    {
      title: "Progress Review",
      color: "from-green-500 to-emerald-500",
      items: [
        "5 = Excellent progress",
        "4 = Good progress",
        "3 = Satisfactory",
        "2 = Delayed",
        "1 = Unsatisfactory"
      ]
    },

    {
      title: "Viva Voce",
      color: "from-purple-500 to-indigo-500",
      items: [
        "5 = Excellent defence",
        "4 = Good defence",
        "3 = Acceptable",
        "2 = Major correction",
        "1 = Fail / weak"
      ]
    },

    {
      title: "Thesis Examination",
      color: "from-orange-500 to-amber-500",
      items: [
        "5 = Excellent thesis",
        "4 = Good thesis",
        "3 = Acceptable",
        "2 = Weak thesis",
        "1 = Unsatisfactory"
      ]
    },

    {
      title: "Turnitin / Similarity Index",
      color: "from-red-500 to-pink-500",
      items: [
        "≤10% → Score 5",
        "11–15% → Score 4",
        "16–20% → Score 3",
        "21–24% → Score 2",
        "≥25% → Score 1"
      ]
    }

  ];

  return (

    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

      {boxes.map((b, i) => (

        <div
          key={i}
          className="bg-white rounded-3xl shadow border overflow-hidden"
        >

          <div
            className={`bg-gradient-to-r ${b.color} p-4 text-white`}
          >

            <h2 className="font-bold text-lg">
              {b.title}
            </h2>

          </div>

          <div className="p-5 space-y-2 text-sm">

            {b.items.map((x, idx) => (

              <div
                key={idx}
                className="bg-gray-50 rounded-xl px-3 py-2 border"
              >
                {x}
              </div>

            ))}

          </div>

        </div>

      ))}

    </div>

  );
}
