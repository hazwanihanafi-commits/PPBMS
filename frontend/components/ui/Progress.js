export default function Progress({value=0}){
  return (
    <div>
      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div className="h-2 bg-primary rounded-full" style={{width:`${value}%`}}></div>
      </div>
      <div className="text-xs text-gray-600 mt-1">{value}%</div>
    </div>
  );
}
