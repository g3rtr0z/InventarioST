export default function Loader() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="w-64 h-64 flex items-center justify-center">
          <iframe
            src="https://lottie.host/embed/0551a82d-d7de-488d-92be-e4a123a71027/YgeU4xnlTU.lottie"
            className="w-full h-full border-0"
            title="Loading animation"
            allow="autoplay"
          />
        </div>
        <p className="mt-4 text-gray-600 text-sm font-medium">Cargando inventario...</p>
      </div>
    </div>
  );
}

