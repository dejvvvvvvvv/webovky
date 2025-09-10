import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';

// Placeholder pro komponenty. V reálné aplikaci by byly importovány z /components.
const FileUploader = ({ onFileUpload }) => (
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors">
    <h3 className="text-xl font-semibold text-gray-700">Přetáhněte 3D model sem</h3>
    <p className="text-gray-500 mt-2">nebo</p>
    <button
      onClick={() => onFileUpload({ name: 'ukazkovy-model.stl', size: 1024768 })}
      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
    >
      Vyberte soubor
    </button>
    <p className="text-xs text-gray-400 mt-4">Podporované formáty: STL, OBJ, GLB (max 100 MB)</p>
  </div>
);

const ModelPreview = ({ file, analysis }) => (
  <div className="bg-gray-50 p-6 rounded-lg">
    <h3 className="text-lg font-semibold text-gray-800">Náhled a Analýza</h3>
    <div className="mt-4 w-full h-64 bg-gray-200 rounded flex items-center justify-center">
      {/* V reálné aplikaci by zde byla <model-viewer> komponenta */}
      <p className="text-gray-500">3D náhled modelu: {file.name}</p>
    </div>
    <div className="mt-4">
      {analysis.status === 'loading' && <p className="text-gray-600">Analyzuji model...</p>}
      {analysis.status === 'success' && (
        <div>
          <h4 className="font-semibold">Výsledky analýzy:</h4>
          <ul className="list-disc list-inside text-gray-700">
            <li>Objem: {analysis.data.volume_cm3} cm³</li>
            <li>Rozměry: {analysis.data.bbox_mm.x} x {analysis.data.bbox_mm.y} x {analysis.data.bbox_mm.z} mm</li>
          </ul>
        </div>
      )}
      {analysis.status === 'error' && <p className="text-red-500">Analýza selhala. Zkuste jiný model.</p>}
    </div>
  </div>
);


const ObjednatTisk: NextPage = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState({ status: 'idle', data: null, error: null });

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    // Simulace volání API pro nahrání a spuštění analýzy
    setAnalysisResult({ status: 'loading', data: null, error: null });

    // V reálné appce by zde byl `fetch` nebo `axios` POST na /api/models
    // a následné periodické dotazování na /api/models/{id}/estimate
    setTimeout(() => {
      setAnalysisResult({
        status: 'success',
        data: {
          volume_cm3: 125.7,
          bbox_mm: { x: 50.5, y: 100.2, z: 30.0 },
          suggested_price_eur: 25.50,
        },
        error: null,
      });
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Head>
        <title>Objednat tisk | Commun Printing</title>
        <meta name="description" content="Nahrjte svůj 3D model a získejte okamžitý odhad ceny." />
      </Head>

      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800">Od nápadu k realitě ve třech krocích</h1>
        <p className="text-center text-lg text-gray-600 mt-2">Nahrjte model, nakonfigurujte tisk a my se postaráme o zbytek.</p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-700">1. Nahrát 3D model</h2>
              <FileUploader onFileUpload={handleFileUpload} />
            </div>

            {uploadedFile && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-700">2. Konfigurace tisku</h2>
                <div className="bg-white p-6 rounded-lg shadow-sm mt-4">
                  {/* Zde bude PrintSettingsForm */}
                  <p className="text-gray-500">Zde brzy naleznete konfigurátor materiálu, kvality a dalších parametrů.</p>
                </div>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div className="sticky top-24">
              <ModelPreview file={uploadedFile} analysis={analysisResult} />

              {analysisResult.status === 'success' && (
                <div className="mt-6">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                    <p className="text-lg text-gray-700">Předběžný odhad ceny:</p>
                    <p className="text-3xl font-bold text-green-700">
                      {analysisResult.data.suggested_price_eur.toFixed(2)} €
                    </p>
                  </div>
                  <button className="w-full mt-4 px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-transform transform hover:scale-105">
                    Pokračovat k výběru tiskárny
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ObjednatTisk;
