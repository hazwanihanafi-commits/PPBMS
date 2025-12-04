export default function TWTest() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-purple-700">Tailwind TEST</h1>
      <p className="mt-4 text-lg text-gray-600">If you see this styled, Tailwind is loaded.</p>
      <div className="mt-6 w-64 h-6 bg-gray-200 rounded">
        <div className="h-6 bg-purple-600 rounded" style={{width: '60%'}}></div>
      </div>
    </div>
  );
}
