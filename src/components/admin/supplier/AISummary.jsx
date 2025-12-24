function AISummary({ data }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);

    try {
      const res = await axios.post("/api/admin/suppliers/ai-summary", {
        suppliers: data,
      });

      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">AI Insights</h3>

      <button
        onClick={generateSummary}
        className="px-4 py-2 bg-purple-600 text-white rounded"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate AI Summary"}
      </button>

      {summary && (
        <div className="mt-4 p-4 bg-gray-50 border rounded whitespace-pre-line text-sm">
          {summary}
        </div>
      )}
    </div>
  );
}
