export default function Loading() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}