"use client";

export function AddContentButton() {
  const handleAddContent = () => {
    // TODO: Implement add content functionality
    // This could open a modal, navigate to a new page, etc.
    console.log("Add content clicked");
  };

  return (
    <button
      onClick={handleAddContent}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm hover:shadow-md"
    >
      <span className="text-lg">+</span>
      Add Content
    </button>
  );
}
