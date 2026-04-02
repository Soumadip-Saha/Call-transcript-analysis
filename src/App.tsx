import React, { useState, useMemo } from 'react';
import { Upload, PhoneCall, LayoutDashboard, FileText, Download } from 'lucide-react';
import { processData, FlattenedIntent } from './lib/data';
import Dashboard from './components/Dashboard';

export default function App() {
  const [rawData, setRawData] = useState<FlattenedIntent[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Filters
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [selectedL1, setSelectedL1] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [topN, setTopN] = useState<number>(15);

  // Extracted unique values for filters
  const uniqueReasons = useMemo(() => {
    if (!rawData) return [];
    return Array.from(new Set(rawData.map((d) => d.reason))).sort();
  }, [rawData]);

  const uniqueL1 = useMemo(() => {
    if (!rawData) return [];
    return Array.from(new Set(rawData.map((d) => d.l1))).sort();
  }, [rawData]);

  const uniqueStatuses = useMemo(() => {
    if (!rawData) return [];
    return Array.from(new Set(rawData.map((d) => d.classification_status))).sort();
  }, [rawData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const processed = processData(text, file.name);
        setRawData(processed);
        
        // Initialize filters with all values
        setSelectedReasons(Array.from(new Set(processed.map(d => d.reason))));
        setSelectedL1(Array.from(new Set(processed.map(d => d.l1))));
        setSelectedStatuses(Array.from(new Set(processed.map(d => d.classification_status))));
      };
      reader.readAsText(file);
    }
  };

  // Apply filters
  const filteredData = useMemo(() => {
    if (!rawData) return [];
    return rawData.filter(
      (d) =>
        selectedReasons.includes(d.reason) &&
        selectedL1.includes(d.l1) &&
        selectedStatuses.includes(d.classification_status)
    );
  }, [rawData, selectedReasons, selectedL1, selectedStatuses]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <PhoneCall className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Call Intel</h1>
          </div>
          <p className="text-sm text-gray-500">Analytics Dashboard</p>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Upload Data</h2>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> CSV or JSON
                </p>
                {fileName && <p className="text-xs text-indigo-600 font-medium truncate max-w-[200px]">{fileName}</p>}
              </div>
              <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileUpload} />
            </label>
          </div>

          {rawData && (
            <div className="flex flex-col gap-5">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Filters</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-2">
                  {uniqueReasons.map(reason => (
                    <label key={reason} className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={selectedReasons.includes(reason)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedReasons([...selectedReasons, reason]);
                          else setSelectedReasons(selectedReasons.filter(r => r !== reason));
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">L1 Category</label>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-2">
                  {uniqueL1.map(l1 => (
                    <label key={l1} className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={selectedL1.includes(l1)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedL1([...selectedL1, l1]);
                          else setSelectedL1(selectedL1.filter(l => l !== l1));
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{l1}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Classification Status</label>
                <div className="flex flex-col gap-1">
                  {uniqueStatuses.map(status => (
                    <label key={status} className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={selectedStatuses.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStatuses([...selectedStatuses, status]);
                          else setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Top N L2 Issues: {topN}</label>
                <input 
                  type="range" 
                  min="5" 
                  max="25" 
                  value={topN} 
                  onChange={(e) => setTopN(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {!rawData ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <LayoutDashboard className="w-10 h-10 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Call Intelligence</h2>
              <p className="text-gray-500 max-w-md mb-8">
                Upload your call classification CSV or JSON in the sidebar to begin analysis. The dashboard will automatically process and visualize your intent data.
              </p>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left w-full max-w-2xl">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Expected Schema
                </h3>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600 overflow-x-auto border border-gray-100 font-mono">
{`call_id,transcript,classification_status,intents_json,num_intents
46386475,"[agent]... [client]...",success,"[{'l1': 'Issue', 'l2': 'Delay', 'reason': 'Complaint'}]",1`}
                </pre>
              </div>
            </div>
          ) : (
            <Dashboard data={filteredData} topN={topN} />
          )}
        </div>
      </main>
    </div>
  );
}
