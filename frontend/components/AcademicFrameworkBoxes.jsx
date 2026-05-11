export default function AcademicFrameworkBoxes() {

  const data = [

    {
      title: "IEG",
      subtitle:
        "Institutional Educational Goals",

      color:
        "from-indigo-500 to-purple-600",

      items: [

        "IEG1 — Thinker",
        "IEG2 — Balanced",
        "IEG3 — Entrepreneurial",
        "IEG4 — Articulate",
        "IEG5 — Holistic"

      ]
    },

    {
      title: "PEO",
      subtitle:
        "Programme Educational Objectives",

      color:
        "from-emerald-500 to-green-600",

      items: [

        "PEO1 — Research knowledge integration",
        "PEO2 — Critical problem solving",
        "PEO3 — Ethics & professionalism",
        "PEO4 — Communication & entrepreneurship",
        "PEO5 — New knowledge & collaboration"

      ]
    },

    {
      title: "PLO",
      subtitle:
        "Programme Learning Outcomes",

      color:
        "from-pink-500 to-rose-500",

      items: [

        "PLO1 — Knowledge & understanding",
        "PLO2 — Cognitive skills",
        "PLO3 — Practical skills",
        "PLO4 — Interpersonal skills",
        "PLO5 — Communication skills",
        "PLO6 — Digital skills",
        "PLO7 — Numeracy skills",
        "PLO8 — Leadership & autonomy",
        "PLO9 — Lifelong learning",
        "PLO10 — Entrepreneurship",
        "PLO11 — Ethics & professionalism"

      ]
    }

  ];

  return (

    <div className="grid lg:grid-cols-3 gap-6">

      {data.map((box, i) => (

        <div
          key={i}
          className="bg-white rounded-3xl overflow-hidden shadow border"
        >

          <div
            className={`bg-gradient-to-r ${box.color} p-5 text-white`}
          >

            <h2 className="text-2xl font-bold">
              {box.title}
            </h2>

            <p className="text-sm opacity-90 mt-1">
              {box.subtitle}
            </p>

          </div>

          <div className="p-5 space-y-3">

            {box.items.map((item, idx) => (

              <div
                key={idx}
                className="bg-gray-50 border rounded-2xl px-4 py-3 text-sm"
              >
                {item}
              </div>

            ))}

          </div>

        </div>

      ))}

    </div>

  );
}
