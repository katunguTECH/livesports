export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-48"></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="h-28 bg-gray-200 rounded"></div>
        <div className="h-28 bg-gray-200 rounded"></div>
        <div className="h-28 bg-gray-200 rounded"></div>
        <div className="h-28 bg-gray-200 rounded"></div>
      </div>
      <div className="h-48 bg-gray-200 rounded"></div>
    </div>
  );
}
