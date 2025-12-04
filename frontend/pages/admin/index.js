{/* ============================
    STATUS RULES SECTION
============================= */}
<div className="bg-white shadow-card rounded-2xl p-6 border border-gray-100 mt-10">

  <h2 className="text-2xl font-bold text-purple-700 mb-4">
    📊 Progress Status Classification Rules
  </h2>

  <p className="text-gray-600 mb-6">
    These rules determine whether students are <strong>On Track</strong>, 
    <strong>Slightly Late</strong>, or <strong>At Risk</strong> based on their 
    expected vs actual timeline milestones.
  </p>

  {/* Rule Cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

    {/* On Track */}
    <div className="p-5 rounded-2xl border border-green-200 bg-green-50">
      <h3 className="font-bold text-green-700 mb-2">🟢 On Track</h3>
      <ul className="text-gray-700 text-sm space-y-1">
        <li>• All due milestones completed on time</li>
        <li>• Next milestone deadline ≥ <strong>7 days</strong> away</li>
        <li>• Progress aligns with programme expectations</li>
      </ul>
    </div>

    {/* Slightly Late */}
    <div className="p-5 rounded-2xl border border-yellow-200 bg-yellow-50">
      <h3 className="font-bold text-yellow-700 mb-2">🟡 Slightly Late</h3>
      <ul className="text-gray-700 text-sm space-y-1">
        <li>• Missed a deadline by up to <strong>14 days</strong></li>
        <li>• Remaining days between <strong>0 and -14</strong></li>
        <li>• Indicates minor scheduling delay</li>
      </ul>
    </div>

    {/* At Risk */}
    <div className="p-5 rounded-2xl border border-red-200 bg-red-50">
      <h3 className="font-bold text-red-700 mb-2">🔴 At Risk</h3>
      <ul className="text-gray-700 text-sm space-y-1">
        <li>• Milestone overdue by more than <strong>14 days</strong></li>
        <li>• Progress significantly behind expectations</li>
        <li>• May require supervisor intervention</li>
      </ul>
    </div>

  </div>

  {/* Footer Note */}
  <p className="text-sm text-gray-500 mt-6">
    These thresholds are automatically calculated based on Google Sheet data and 
    applied consistently across all students.
  </p>

</div>
