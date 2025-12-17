import { useEffect, useState } from "react";
import { apiGet, apiUpload } from "../utils/api";

const SECTIONS = [
  {
    title: "Maklumat Asas & Pendaftaran",
    locked: true,
    items: [
      "Surat Tawaran",
      "Salinan KP / Passport",
      "Borang Pengesahan Pendaftaran",
      "Profil Pelajar (SMU)",
      "Skrol dan Transkrip (Kelayakan Masuk)",
      "Surat Sokongan EMGS",
      "LKM100 / LKM111",
    ],
  },
  {
    title: "Pemantauan & Penyeliaan",
    items: [
      "Development Plan & Learning Contract (DPLC)",
      "Buku Log Penyeliaan Pelajar",
      "Laporan Kemajuan Pelajar (CampusOnline)",
    ],
  },
  {
    title: "Tesis & Pemeriksaan",
    items: [
      "Borang Serahan Draf Tesis",
      "Minit Jemaah Pemeriksaan Tesis",
      "Keputusan Panel Pemeriksa",
      "Laporan Pemeriksa Tesis",
      "Borang Serah Tesis Mutakhir",
    ],
  },
];

export default function SubmittedDocumentsTab() {
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/api/documents/my").then((rows) => {
      const map = {};
      rows.forEach((r) => (map[r.document_type] = r));
      setDocs(map);
      setLoading(false);
    });
  }, []);

  async function handleUpload(item, section, file) {
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("document_type", item);
    fd.append("section", section);

    const saved = await apiUpload("/api/documents/upload", fd);
    setDocs((prev) => ({ ...prev, [item]: saved }));
  }

  if (loading) {
    return <div className="text-gray-500">Loading documents…</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">📄 Submitted Documents</h2>

      {SECTIONS.map((sec) => (
        <div key={sec.title} className="bg-white rounded-xl shadow p-5">
          <h3 className="font-medium mb-3">
            {sec.title}
            {sec.locked && (
              <span className="ml-2 text-xs text-purple-600">(Locked)</span>
            )}
          </h3>

          <ul className="space-y-2">
            {sec.items.map((item) => {
              const doc = docs[item];
              return (
                <li
                  key={item}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <span className="text-sm">
                    {doc ? "✅" : "⬜"} {item}
                  </span>

                  {doc ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-xs"
                    >
                      View
                    </a>
                  ) : sec.locked ? (
                    <span className="text-xs text-gray-400">Auto</span>
                  ) : (
                    <label className="text-xs bg-purple-600 text-white px-3 py-1 rounded cursor-pointer">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleUpload(item, sec.title, e.target.files[0])
                        }
                      />
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
