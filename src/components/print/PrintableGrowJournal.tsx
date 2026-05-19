import React from 'react';

// This component is only visible when printing.
// It translates the Bloomberg Terminal aesthetic to a print-friendly format:
// Black text on white background, JetBrains Mono, strict 1px borders.

export function PrintableGrowJournal() {
  return (
    <div className="hidden print:block font-mono text-black bg-white w-full">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-8">
        <h1 className="uppercase tracking-widest text-2xl font-bold mb-2">
          PhenoSage // Master Ledger
        </h1>
        <div className="flex justify-between items-end text-sm">
          <div>
            <div>
              <strong>RUN ID:</strong> RUN-A49-XYZ
            </div>
            <div>
              <strong>COMPILED:</strong> {new Date().toLocaleDateString()}
            </div>
          </div>
          <div className="text-right">
            <div className="uppercase tracking-widest text-[10px]">Strict Telemetry & Ops Log</div>
          </div>
        </div>
      </div>

      {/* Grid Layout of Data */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-black p-4 col-span-2">
          <div className="uppercase tracking-widest text-[10px] text-gray-500 mb-2 border-b border-black pb-1">
            Strain Demographics
          </div>
          <div className="text-sm">
            <div className="mb-1">
              <strong>SOUR DIESEL</strong> (QTY: 4)
            </div>
            <div className="mb-1">
              <strong>MEDIUM:</strong> Coco Coir
            </div>
            <div>
              <strong>GEN:</strong> F1 Clone
            </div>
          </div>
        </div>
        <div className="border border-black p-4 col-span-2">
          <div className="uppercase tracking-widest text-[10px] text-gray-500 mb-2 border-b border-black pb-1">
            Lineage Tracing
          </div>
          <div className="text-sm">
            <div>
              <strong>MOTHER:</strong> M-SD-02
            </div>
            <div>
              <strong>TRAITS:</strong> High Terpene, Stretch
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Log */}
      <div className="mb-4 text-black">
        <h2 className="uppercase tracking-widest text-lg font-bold border-b border-black pb-1 mb-4">
          Chronological Operations
        </h2>

        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 font-normal uppercase tracking-widest text-[10px] text-gray-500 w-24">
                Date
              </th>
              <th className="py-2 font-normal uppercase tracking-widest text-[10px] text-gray-500 w-32">
                Event Type
              </th>
              <th className="py-2 font-normal uppercase tracking-widest text-[10px] text-gray-500">
                Raw Notes / Telemetry / Overrides
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300 print:break-inside-avoid">
              <td className="py-3 align-top text-xs">2026-04-12</td>
              <td className="py-3 align-top font-bold text-xs">GROW_START</td>
              <td className="py-3 align-top">
                Initialized grow parameters. Tent allocated: TENT_A.
              </td>
            </tr>
            <tr className="border-b border-gray-300 print:break-inside-avoid">
              <td className="py-3 align-top text-xs">2026-04-18</td>
              <td className="py-3 align-top font-bold text-xs uppercase text-red-600">
                Manual Override
              </td>
              <td className="py-3 align-top">
                <div className="mb-1">Adjusted watering schedule. Substrate was unusually dry.</div>
                <div className="bg-gray-100 p-2 font-mono text-[10px] border border-gray-300">
                  PREV: 400ml/day
                  <br />
                  NEW: 600ml/day
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-300 print:break-inside-avoid">
              <td className="py-3 align-top text-xs">2026-04-20</td>
              <td className="py-3 align-top font-bold text-xs">TELEMETRY OCR</td>
              <td className="py-3 align-top">
                Snapshot capture approved by operator.
                <div className="flex gap-4 mt-1 font-mono text-[10px]">
                  <span>TEMP: 78.5°F</span>
                  <span>RH: 55.2%</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-300 print:break-inside-avoid">
              <td className="py-3 align-top text-xs">2026-05-18</td>
              <td className="py-3 align-top font-bold text-xs">HARVEST LOG</td>
              <td className="py-3 align-top">
                <div className="mb-1">
                  <strong>Pheno-Score:</strong> S-Tier
                </div>
                <div>
                  <strong>Yield Est:</strong> 420g Dry
                </div>
                <div className="text-[10px] text-gray-600 mt-1">
                  Exceptional canopy density observed during final walkthrough.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
